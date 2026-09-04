"use client";

import { useEffect, useState } from "react";

type PermissionState =
  | "unsupported"
  | "default"
  | "granted"
  | "denied";

export default function PushNotificationSettings() {
  const [permission, setPermission] =
    useState<PermissionState>("default");

  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function checkNotificationStatus() {
      if (
        typeof window === "undefined" ||
        !("Notification" in window) ||
        !("serviceWorker" in navigator) ||
        !("PushManager" in window)
      ) {
        setPermission("unsupported");
        setLoading(false);
        return;
      }

      setPermission(Notification.permission);

      try {
        const registration =
          await navigator.serviceWorker.ready;

        const subscription =
          await registration.pushManager.getSubscription();

        setEnabled(!!subscription);
      } catch (error) {
        console.error(
          "Failed to check push notification status:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    checkNotificationStatus();
  }, []);

  async function enableNotifications() {
    setMessage("");

    if (
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setPermission("unsupported");
      return;
    }

    setLoading(true);

    try {
      const result =
        await Notification.requestPermission();

      setPermission(result);

      if (result !== "granted") {
        if (result === "denied") {
          setMessage(
            "Notifications are blocked. You can enable them from your browser settings."
          );
        }

        return;
      }

      const registration =
        await navigator.serviceWorker.ready;

      const existingSubscription =
        await registration.pushManager.getSubscription();

      const subscription =
        existingSubscription ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey:
            urlBase64ToUint8Array(
              process.env
                .NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ""
            ),
        }));

      const response = await fetch(
        "/api/push/subscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(
            subscription.toJSON()
          ),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to save push subscription"
        );
      }

      setEnabled(true);
      setMessage(
        "Notifications are now enabled on this device."
      );
    } catch (error) {
      console.error(
        "Failed to enable notifications:",
        error
      );

      setMessage(
        "We couldn't enable notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function disableNotifications() {
    setMessage("");
    setLoading(true);

    try {
      const registration =
        await navigator.serviceWorker.ready;

      const subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        setEnabled(false);
        return;
      }

      const endpoint = subscription.endpoint;

      await subscription.unsubscribe();

      const response = await fetch(
        "/api/push/unsubscribe",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            endpoint,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to remove push subscription"
        );
      }

      setEnabled(false);
      setMessage(
        "Notifications have been disabled on this device."
      );
    } catch (error) {
      console.error(
        "Failed to disable notifications:",
        error
      );

      setMessage(
        "We couldn't disable notifications. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  async function testPushNotification() {
    setMessage("");
    setTesting(true);

    try {
      const response = await fetch(
        "/api/push/test",
        {
          method: "POST",
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "Failed to send test notification"
        );
      }

      setMessage(
        "Test notification sent. Check your device notifications."
      );
    } catch (error) {
      console.error(
        "Push test failed:",
        error
      );

      setMessage(
        error instanceof Error
          ? error.message
          : "Failed to send test notification."
      );
    } finally {
      setTesting(false);
    }
  }

  if (loading) {
    return (
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "var(--card)",
        }}
      >
        <p className="text-sm opacity-60">
          Checking notification settings...
        </p>
      </div>
    );
  }

  if (permission === "unsupported") {
    return (
      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "var(--card)",
        }}
      >
        <h3 className="font-semibold">
          Device Notifications
        </h3>

        <p className="mt-1 text-sm opacity-60">
          Push notifications are not supported by
          this browser.
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: "var(--card)",
      }}
    >
      <div
        className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        "
      >
        <div>
          <h3 className="font-semibold">
            Device Notifications
          </h3>

          <p className="mt-1 text-sm opacity-60">
            Receive Boundless notifications on this
            device, even when the app is not open.
          </p>
        </div>

        {enabled ? (
          <button
            type="button"
            onClick={disableNotifications}
            disabled={loading || testing}
            className="
              rounded-lg
              border
              px-4
              py-2
              text-sm
              font-medium
              transition
              hover:shadow-md
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            Disable
          </button>
        ) : (
          <button
            type="button"
            onClick={enableNotifications}
            disabled={loading || testing}
            className="
              rounded-lg
              border
              px-4
              py-2
              text-sm
              font-medium
              transition
              hover:shadow-md
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            Enable Notifications
          </button>
        )}
      </div>

      {permission === "denied" && (
        <p className="mt-4 text-sm text-red-400">
          Notifications are blocked by your browser.
          Enable them in your browser's site settings.
        </p>
      )}

      {enabled && (
        <div className="mt-5 border-t pt-5">
          <button
            type="button"
            onClick={testPushNotification}
            disabled={testing}
            className="
              rounded-lg
              border
              px-4
              py-2
              text-sm
              font-medium
              transition
              hover:shadow-md
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            {testing
              ? "Sending Test..."
              : "Send Test Notification"}
          </button>
        </div>
      )}

      {message && (
        <p className="mt-4 text-sm opacity-70">
          {message}
        </p>
      )}
    </div>
  );
}

function urlBase64ToUint8Array(
  base64String: string
) {
  const padding = "=".repeat(
    (4 - (base64String.length % 4)) % 4
  );

  const base64 = (
    base64String + padding
  )
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);

  return Uint8Array.from(
    [...rawData].map((char) =>
      char.charCodeAt(0)
    )
  );
}