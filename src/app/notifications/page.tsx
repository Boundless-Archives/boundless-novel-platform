import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import OpenNotification from "./OpenNotification";
import { markAllNotificationsAsRead } from "./actions";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
  actor_id: string | null;
  profiles: {
    username: string | null;
    display_name: string | null;
    avatar_url: string | null;
    is_author: boolean | null;
  }[] | null;
};

function getNotificationIcon(type: string) {
  switch (type) {
    case "follow":
      return "👤";

    case "new_book":
      return "📚";

    case "new_chapter":
      return "📖";

    case "followed_author_update":
      return "✍️";

    case "book_completed":
      return "✅";

    case "book_status":
      return "📌";

    case "announcement":
      return "📢";

    case "system":
      return "⚙️";

    case "crossover_request":
    case "crossover_response":
      return "🌐";

    case "tier_submission":
    case "tier_submission_response":
      return "🏆";

    case "badge_earned":
      return "🎖️";

    case "story_review":
      return "⭐";

    case "chapter_comment":
      return "💬";

    case "cultivation_breakthrough":
      return "🧘";

    case "gift_received":
      return "🎁";

    case "milestone":
      return "🎉";

    case "weekly_digest":
      return "🗞️";

    case "leaderboard":
      return "🏆";

    case "message":
      return "✉️";

    default:
      return "🔔";
  }
}

function getNotificationLabel(type: string) {
  switch (type) {
    case "follow":
      return "Follower";

    case "new_book":
      return "New book";

    case "new_chapter":
      return "New chapter";

    case "followed_author_update":
      return "Author update";

    case "book_completed":
      return "Completed";

    case "book_status":
      return "Book update";

    case "announcement":
      return "Announcement";

    case "system":
      return "System";

    case "crossover_request":
      return "Crossover request";

    case "crossover_response":
      return "Crossover update";

    case "tier_submission":
      return "Tier submission";

    case "tier_submission_response":
      return "Tier decision";

    case "badge_earned":
      return "Badge earned";

    case "story_review":
      return "Review";

    case "chapter_comment":
      return "Comment";

    case "cultivation_breakthrough":
      return "Cultivation";

    case "gift_received":
      return "Gift";

    case "milestone":
      return "Milestone";

    case "weekly_digest":
      return "Weekly digest";

    case "leaderboard":
      return "Leaderboard";

    case "message":
      return "Message";

    default:
      return "Notification";
  }
}

/* The inbox sorts notifications into rooms. */
const TABS = [
  { key: "all", label: "All" },
  { key: "books", label: "Books" },
  { key: "reviews", label: "Reviews" },
  { key: "reputation", label: "Reputation" },
  { key: "rewards", label: "Rewards" },
  { key: "guilds", label: "Guilds" },
  { key: "messages", label: "Messages" },
  { key: "system", label: "System" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

function categoryOf(n: { type: string; link: string | null }): TabKey {
  if (n.link?.startsWith("/guilds")) return "guilds";
  if (n.type === "message") return "messages";

  switch (n.type) {
    case "new_book":
    case "new_chapter":
    case "followed_author_update":
    case "book_completed":
    case "book_status":
    case "weekly_digest":
      return "books";

    case "story_review":
    case "chapter_comment":
      return "reviews";

    case "follow":
    case "gift_received":
    case "crossover_request":
    case "crossover_response":
    case "tier_submission":
    case "tier_submission_response":
      return "reputation";

    case "badge_earned":
    case "cultivation_breakthrough":
    case "leaderboard":
    case "milestone":
      return "rewards";

    default:
      return "system";
  }
}

function formatRelativeTime(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const seconds = Math.floor(
    (now.getTime() - date.getTime()) / 1000
  );

  if (seconds < 60) {
    return "Just now";
  }

  const minutes = Math.floor(seconds / 60);

  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);

  if (hours < 24) {
    return `${hours}h`;
  }

  const days = Math.floor(hours / 24);

  if (days < 7) {
    return `${days}d`;
  }

  const weeks = Math.floor(days / 7);

  if (weeks < 5) {
    return `${weeks}w`;
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year:
      date.getFullYear() !== now.getFullYear()
        ? "numeric"
        : undefined,
  });
}

function getNotificationMessage(
  notification: Notification
) {
  if (notification.message) {
    return notification.message;
  }

  const actor = notification.profiles?.[0] ?? null;

  const actorName =
    actor?.display_name ||
    actor?.username ||
    "Someone";

  switch (notification.type) {
    case "follow":
      return `${actorName} started following you.`;

    case "new_book":
      return "A new book is available from an author you follow.";

    case "new_chapter":
      return "A new chapter has been published in a book you saved.";

    case "followed_author_update":
      return "An author you follow has published a new chapter.";

    case "book_completed":
      return "A book you saved has been completed.";

    case "book_status":
      return "A book you saved has changed status.";

    case "announcement":
      return "There's a new announcement from Boundless.";

    case "system":
      return "You have a new system notification.";

    default:
      return "You have a new notification.";
  }
}

export default async function NotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab: TabKey =
    TABS.find((t) => t.key === sp.tab)?.key ?? "all";

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
      .select(
        `
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
      `
      )
      .eq("user_id", user.id)
      .order("created_at", {
        ascending: false,
      })
      .limit(300);

  if (error) {
    throw new Error(error.message);
  }

  const items =
    (notifications as Notification[]) ?? [];

  const unreadCount = items.filter(
    (notification) => !notification.is_read
  ).length;

  const unreadBy: Record<string, number> = {};
  for (const n of items) {
    if (!n.is_read) {
      const k = categoryOf(n);
      unreadBy[k] = (unreadBy[k] ?? 0) + 1;
    }
  }

  const visible =
    tab === "all" ? items : items.filter((n) => categoryOf(n) === tab);

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <span className="text-3xl">🔔</span>

            <h1 className="text-4xl font-bold tracking-tight">
              Inbox
            </h1>
          </div>

          {unreadCount > 0 ? (
            <p className="opacity-70">
              You have{" "}
              <span className="font-semibold opacity-100">
                {unreadCount}
              </span>{" "}
              unread{" "}
              {unreadCount === 1
                ? "notification"
                : "notifications"}
              .
            </p>
          ) : (
            <p className="opacity-70">
              You&apos;re all caught up.
            </p>
          )}
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
                py-2.5
                text-sm
                font-medium
                transition
                hover:opacity-80
                active:scale-[0.98]
              "
              style={{
                borderColor: "var(--card-border)",
                backgroundColor: "var(--card)",
              }}
            >
              Mark all as read
            </button>
          </form>
        )}
      </div>

      {tab === "messages" && (
        <p className="mb-4 text-sm">
          <Link href="/messages" className="underline underline-offset-4">
            Open all messages →
          </Link>
        </p>
      )}

      <nav
        className="-mx-1 mb-6 flex gap-2 overflow-x-auto px-1 pb-1"
        aria-label="Inbox sections"
      >
        {TABS.map((t) => {
          const active = t.key === tab;
          const count =
            t.key === "all" ? unreadCount : (unreadBy[t.key] ?? 0);
          return (
            <Link
              key={t.key}
              href={t.key === "all" ? "/notifications" : `/notifications?tab=${t.key}`}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                active ? "" : "opacity-60 hover:opacity-100"
              }`}
              style={
                active
                  ? { backgroundColor: "var(--button)", color: "var(--button-text)" }
                  : { borderColor: "var(--card-border)" }
              }
            >
              {t.label}
              {count > 0 && (
                <span
                  className="rounded-full px-1.5 text-xs"
                  style={{
                    backgroundColor: active ? "var(--button-text)" : "var(--button)",
                    color: active ? "var(--button)" : "var(--button-text)",
                  }}
                >
                  {count}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Empty state */}
      {visible.length === 0 ? (
        <div
          className="
            rounded-2xl
            border
            px-6
            py-16
            text-center
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <div className="mb-5 text-6xl">
            🔔
          </div>

          <h2 className="text-2xl font-bold">
            {tab === "all" ? "Nothing here yet" : "Nothing in this room"}
          </h2>

          <p className="mx-auto mt-3 max-w-md opacity-70">
            When someone follows you, a book you
            follow gets updated, or something
            important happens, you&apos;ll see it here.
          </p>

          <Link
            href="/"
            className="
              mt-7
              inline-flex
              rounded-xl
              border
              px-5
              py-2.5
              text-sm
              font-medium
              transition
              hover:opacity-80
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            Explore Boundless
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {visible.map((notification) => {
            const actor = notification.profiles?.[0] ?? null;

            const actorName =
              actor?.display_name ||
              actor?.username ||
              "Boundless";

            const icon = getNotificationIcon(
              notification.type
            );

            const label = getNotificationLabel(
              notification.type
            );

            const content = (
              <div
                className="
                  relative
                  flex
                  gap-4
                  rounded-2xl
                  border
                  p-4
                  transition
                  sm:p-5
                "
                style={{
                  backgroundColor: notification.is_read
                    ? "transparent"
                    : "var(--card)",
                  borderColor:
                    "var(--card-border)",
                  opacity: notification.is_read
                    ? 0.72
                    : 1,
                }}
              >
                {!notification.is_read && (
                  <span
                    className="
                      absolute
                      left-0
                      top-6
                      h-2.5
                      w-2.5
                      -translate-x-1/2
                      rounded-full
                    "
                    style={{
                      backgroundColor:
                        "currentColor",
                    }}
                  />
                )}

                {/* Avatar / icon */}
                <div className="shrink-0">
                  {actor?.avatar_url ? (
                    <img
                      src={actor.avatar_url}
                      alt={actorName}
                      className="
                        h-12
                        w-12
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
                        items-center
                        justify-center
                        rounded-full
                        border
                        text-xl
                      "
                      style={{
                        borderColor:
                          "var(--card-border)",
                        backgroundColor:
                          "var(--background)",
                      }}
                    >
                      {icon}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className="
                        rounded-full
                        border
                        px-2
                        py-0.5
                        text-[11px]
                        font-medium
                        uppercase
                        tracking-wide
                      "
                      style={{
                        borderColor:
                          "var(--card-border)",
                      }}
                    >
                      {label}
                    </span>

                    <span className="text-xs opacity-50">
                      {formatRelativeTime(
                        notification.created_at
                      )}
                    </span>
                  </div>

                  <h2 className="mt-2 font-semibold leading-snug">
                    {notification.title}
                  </h2>

                  <p className="mt-1 text-sm leading-relaxed opacity-70">
                    {getNotificationMessage(
                      notification
                    )}
                  </p>

                  {notification.type === "follow" &&
                    actor?.username && (
                      <p className="mt-2 text-sm opacity-50">
                        @{actor.username}
                      </p>
                    )}
                </div>

                {/* Arrow */}
                {notification.link && (
                  <div className="flex shrink-0 items-center opacity-40">
                    →
                  </div>
                )}
              </div>
            );

            if (!notification.link) {
              return (
                <div key={notification.id}>
                  {content}
                </div>
              );
            }

            return (
              <OpenNotification
                key={notification.id}
                notificationId={notification.id}
                href={notification.link}
              >
                {content}
              </OpenNotification>
            );
          })}
        </div>
      )}
    </main>
  );
}