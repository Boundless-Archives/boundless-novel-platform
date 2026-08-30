import Link from "next/link";
import { redirect } from "next/navigation";
import OpenNotification from "./OpenNotification";
import { createClient } from "@/utils/supabase/server";
import {
  markAllNotificationsAsRead,
} from "./actions";

export default async function NotificationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: notifications, error } =
    await supabase
      .from("notifications")
      .select(`
        id,
        type,
        title,
        message,
        link,
        is_read,
        created_at,
        actor_id,
        profiles:actor_id (
          username,
          display_name,
          avatar_url,
          is_author
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      });

  if (error) {
    throw new Error(error.message);
  }

  const unreadCount =
    notifications?.filter(
      (notification) =>
        !notification.is_read
    ).length ?? 0;

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">

      <div className="flex items-center justify-between gap-4">

        <div>
          <h1 className="text-4xl font-bold">
            Notifications
          </h1>

          <p className="mt-2 opacity-60">
            {unreadCount > 0
              ? `${unreadCount} unread notification${
                  unreadCount === 1 ? "" : "s"
                }`
              : "You're all caught up."}
          </p>
        </div>

        {unreadCount > 0 && (
          <form
            action={markAllNotificationsAsRead}
          >
            <button
              type="submit"
              className="
                rounded-xl
                border
                px-4
                py-2
                text-sm
                font-medium
                transition
                hover:-translate-y-0.5
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >
              Mark all as read
            </button>
          </form>
        )}

      </div>

      <section className="mt-8 space-y-3">

        {!notifications?.length ? (

          <div
            className="
              rounded-2xl
              border
              p-10
              text-center
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor:
                "var(--card-border)",
            }}
          >
            <div className="text-5xl">
              🔔
            </div>

            <h2 className="mt-4 text-2xl font-bold">
              No notifications yet
            </h2>

            <p className="mt-2 opacity-60">
              Activity involving your account
              will appear here.
            </p>
          </div>

        ) : (

          notifications.map((notification) => {

            const actor = Array.isArray(
              notification.profiles
            )
              ? notification.profiles[0]
              : notification.profiles;

            const actorName =
              actor?.display_name ||
              actor?.username ||
              "Someone";

            const date = new Date(
              notification.created_at
            ).toLocaleDateString(
              "en-US",
              {
                year: "numeric",
                month: "short",
                day: "numeric",
              }
            );

            const content = (
              <div
                className={`
                  flex
                  gap-4
                  rounded-2xl
                  border
                  p-5
                  transition
                  ${
                    notification.is_read
                      ? "opacity-70"
                      : ""
                  }
                `}
                style={{
                  backgroundColor:
                    notification.is_read
                      ? "var(--background)"
                      : "var(--card)",
                  borderColor:
                    "var(--card-border)",
                }}
              >

                {actor?.avatar_url ? (

                  <img
                    src={actor.avatar_url}
                    alt={actorName}
                    className="
                      h-12
                      w-12
                      shrink-0
                      rounded-full
                      object-cover
                    "
                  />

                ) : (

                  <div
                    className="
                      flex
                      h-12
                      w-12
                      shrink-0
                      items-center
                      justify-center
                      rounded-full
                      border
                    "
                    style={{
                      borderColor:
                        "var(--card-border)",
                    }}
                  >
                    🔔
                  </div>

                )}

                <div className="min-w-0 flex-1">

                  <div className="flex items-start justify-between gap-4">

                    <div>

                      <p className="font-semibold">
                        {notification.title}
                      </p>

                      {notification.message && (
                        <p className="mt-1 text-sm opacity-60">
                          {notification.message}
                        </p>
                      )}

                    </div>

                    {!notification.is_read && (
                      <span
                        className="
                          mt-1
                          h-2
                          w-2
                          shrink-0
                          rounded-full
                        "
                        style={{
                          backgroundColor:
                            "var(--button)",
                        }}
                      />
                    )}

                  </div>

                  <p className="mt-2 text-xs opacity-40">
                    {date}
                  </p>

                  {notification.type ===
                    "follow" &&
                    actor?.username && (
                      <p className="mt-3 text-sm opacity-60">
                        @{actor.username} followed you
                      </p>
                    )}

                </div>

              </div>
            );

            if (notification.link) {
              return (
                <OpenNotification
                    key={notification.id}
                    notificationId={notification.id}
                    href={notification.link}
                >
                    {content}
                  </OpenNotification>
                );
              }

            return (
              <div key={notification.id}>
                {content}
              </div>
            );
          })

        )}

      </section>

    </main>
  );
}