import { NextResponse } from "next/server";
import webpush from "web-push";
import { createAdminClient } from "@/utils/supabase/admin";

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT!,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export async function POST(request: Request) {
  try {
    const secret = request.headers.get(
      "x-boundless-push-secret"
    );

    if (
      !process.env.PUSH_WEBHOOK_SECRET ||
      secret !== process.env.PUSH_WEBHOOK_SECRET
    ) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const payload = await request.json();

    const notification =
      payload?.record;

    if (!notification) {
      return NextResponse.json(
        {
          error:
            "Missing notification record.",
        },
        { status: 400 }
      );
    }

    const {
      user_id,
      title,
      message,
      link,
    } = notification;

    if (!user_id || !title) {
      return NextResponse.json(
        {
          error:
            "Missing notification data.",
        },
        { status: 400 }
      );
    }

    const supabase =
      createAdminClient();

    const {
      data: subscriptions,
      error,
    } = await supabase
      .from("push_subscriptions")
      .select(
        "id, endpoint, p256dh, auth"
      )
      .eq("user_id", user_id);

    if (error) {
      throw new Error(error.message);
    }

    if (!subscriptions?.length) {
      return NextResponse.json({
        success: true,
        sent: 0,
      });
    }

    let sent = 0;

    for (const subscription of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint:
              subscription.endpoint,
            keys: {
              p256dh:
                subscription.p256dh,
              auth:
                subscription.auth,
            },
          },
          JSON.stringify({
            title,
            body:
              message ||
              "You have a new notification.",
            icon:
              "/icon/icon-192.png",
            badge:
              "/icon/icon-192.png",
            url:
              link ||
              "/notifications",
          })
        );

        sent++;
      } catch (pushError: any) {
        if (
          pushError?.statusCode === 404 ||
          pushError?.statusCode === 410
        ) {
          await supabase
            .from("push_subscriptions")
            .delete()
            .eq(
              "id",
              subscription.id
            );
        } else {
          console.error(
            "Push delivery failed:",
            pushError
          );
        }
      }
    }

    return NextResponse.json({
      success: true,
      sent,
    });
  } catch (error) {
    console.error(
      "Push notification error:",
      error
    );

    return NextResponse.json(
      {
        error:
          "Failed to send notification.",
      },
      { status: 500 }
    );
  }
}