import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import {
  sendPushNotification,
  type PushSubscriptionData,
} from "@/lib/push";

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { data: subscriptions, error } =
      await supabase
        .from("push_subscriptions")
        .select(
          "id, endpoint, p256dh, auth"
        )
        .eq("user_id", user.id);

    if (error) {
      console.error(
        "Failed to load push subscriptions:",
        error
      );

      return NextResponse.json(
        { error: "Failed to load subscriptions" },
        { status: 500 }
      );
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        {
          error:
            "No push subscription found for this user.",
        },
        { status: 404 }
      );
    }

    let sent = 0;
    let expired = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
      const result = await sendPushNotification(
        {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        } satisfies PushSubscriptionData,
        {
          title: "Boundless Push Test",
          body:
            "Push notifications are working on this device.",
          url: "/notifications",
          icon: "/icons/icon-192.png",
          badge: "/icons/icon-192.png",
        }
      );

      if (result.success) {
        sent++;
      } else if (result.expired) {
        expired++;

        await supabase
          .from("push_subscriptions")
          .delete()
          .eq("id", subscription.id);
      } else {
        failed++;
      }
    }

    return NextResponse.json({
      success: true,
      sent,
      expired,
      failed,
    });
  } catch (error) {
    console.error(
      "Push test failed:",
      error
    );

    return NextResponse.json(
      { error: "Push test failed" },
      { status: 500 }
    );
  }
}