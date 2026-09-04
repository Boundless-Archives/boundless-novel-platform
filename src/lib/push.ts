import webpush from "web-push";

const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT;

if (!publicKey || !privateKey || !subject) {
  throw new Error(
    "Missing VAPID environment variables"
  );
}

webpush.setVapidDetails(
  subject,
  publicKey,
  privateKey
);

export type PushSubscriptionData = {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
};

export async function sendPushNotification(
  subscription: PushSubscriptionData,
  payload: {
    title: string;
    body: string;
    url?: string;
    icon?: string;
    badge?: string;
  }
) {
  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload)
    );

    return {
      success: true,
    };
  } catch (error: unknown) {
    const statusCode =
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error
        ? (error as { statusCode?: number }).statusCode
        : undefined;

    if (
      statusCode === 404 ||
      statusCode === 410
    ) {
      return {
        success: false,
        expired: true,
      };
    }

    console.error(
      "Push notification failed:",
      error
    );

    return {
      success: false,
      expired: false,
    };
  }
}