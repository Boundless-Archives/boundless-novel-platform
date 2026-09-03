import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type StoryStatus = {
  status: string;
  count: number;
};

type RecentStory = {
  id: string;
  title: string;
  status: string;
  created_at: string;
};

export default async function AdminAnalyticsPage() {
  const supabase = await createClient();

  /*
   * AUTHORIZATION
   */

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["admin", "superadmin"].includes(profile.role)
  ) {
    redirect("/");
  }

  /*
   * USER COUNTS
   */

  const { count: totalUsers } = await supabase
    .from("profiles")
    .select("id", {
      count: "exact",
      head: true,
    });

  const { count: authors } = await supabase
    .from("profiles")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("role", "author");

  const { count: editors } = await supabase
    .from("profiles")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("role", "editor");

  const { count: admins } = await supabase
    .from("profiles")
    .select("id", {
      count: "exact",
      head: true,
    })
    .in("role", ["admin", "superadmin"]);

  /*
   * STORY COUNTS
   */

  const { count: totalStories } = await supabase
    .from("stories")
    .select("id", {
      count: "exact",
      head: true,
    });

  const { count: draftStories } = await supabase
    .from("stories")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("status", "Draft");

  const { count: ongoingStories } = await supabase
    .from("stories")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("status", "Ongoing");

  const { count: completedStories } = await supabase
    .from("stories")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("status", "Completed");

  const { count: hiatusStories } = await supabase
    .from("stories")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("status", "Hiatus");

  const { count: droppedStories } = await supabase
    .from("stories")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("status", "Dropped");

  /*
   * CHAPTER COUNT
   */

  const { count: totalChapters } = await supabase
    .from("chapters")
    .select("id", {
      count: "exact",
      head: true,
    });

  /*
   * READING ACTIVITY
   */

  const { count: totalReadingActivity } =
    await supabase
      .from("reading_history")
      .select("chapter_id", {
        count: "exact",
        head: true,
      });

  /*
   * RECENT STORIES
   */

  const { data: recentStories } = await supabase
    .from("stories")
    .select("id, title, status, created_at")
    .order("created_at", {
      ascending: false,
    })
    .limit(5);

  /*
   * STATUS DATA
   */

  const statusBreakdown: StoryStatus[] = [
    {
      status: "Ongoing",
      count: ongoingStories ?? 0,
    },
    {
      status: "Completed",
      count: completedStories ?? 0,
    },
    {
      status: "Draft",
      count: draftStories ?? 0,
    },
    {
      status: "Hiatus",
      count: hiatusStories ?? 0,
    },
    {
      status: "Dropped",
      count: droppedStories ?? 0,
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* HEADER */}

        <div className="mb-10">
          <Link
            href="/admin"
            className="
              inline-flex
              items-center
              text-sm
              opacity-60
              transition
              hover:opacity-100
            "
          >
            ← Back to Admin Control Center
          </Link>

          <div className="mt-6">
            <div className="flex items-center gap-4">
              <div
                className="
                  flex
                  h-14
                  w-14
                  items-center
                  justify-center
                  rounded-2xl
                  border
                  bg-[var(--card)]
                  text-2xl
                  shadow-sm
                "
                style={{
                  borderColor:
                    "var(--card-border)",
                }}
              >
                📊
              </div>

              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Platform Analytics
                </h1>

                <p className="mt-1 text-sm opacity-60">
                  A high-level overview of activity across
                  Boundless.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* PRIMARY METRICS */}

        <section
          className="
            grid
            gap-5
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          <MetricCard
            icon="👥"
            label="Total Users"
            value={totalUsers ?? 0}
            description="Registered accounts"
          />

          <MetricCard
            icon="✍️"
            label="Authors"
            value={authors ?? 0}
            description="Users with author access"
          />

          <MetricCard
            icon="📝"
            label="Editors"
            value={editors ?? 0}
            description="Active editor accounts"
          />

          <MetricCard
            icon="🛡️"
            label="Admins"
            value={admins ?? 0}
            description="Admins and superadmins"
          />
        </section>

        {/* CONTENT METRICS */}

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">
            Content
          </h2>

          <div
            className="
              grid
              gap-5
              sm:grid-cols-2
              lg:grid-cols-4
            "
          >
            <MetricCard
              icon="📚"
              label="Total Stories"
              value={totalStories ?? 0}
              description="All stories on the platform"
            />

            <MetricCard
              icon="📖"
              label="Active Stories"
              value={
                (ongoingStories ?? 0) +
                (completedStories ?? 0) +
                (hiatusStories ?? 0) +
                (droppedStories ?? 0)
              }
              description="Non-draft stories"
            />

            <MetricCard
              icon="📝"
              label="Draft Stories"
              value={draftStories ?? 0}
              description="Not publicly visible"
            />

            <MetricCard
              icon="📄"
              label="Total Chapters"
              value={totalChapters ?? 0}
              description="Chapters created"
            />
          </div>
        </section>

        {/* ACTIVITY */}

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">
            Reader Activity
          </h2>

          <div
            className="
              grid
              gap-5
              md:grid-cols-2
            "
          >
            <MetricCard
              icon="📚"
              label="Reading Activity"
              value={totalReadingActivity ?? 0}
              description="Recorded reading-history entries"
            />

            <div
              className="
                rounded-2xl
                border
                bg-[var(--card)]
                p-6
                shadow-sm
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >
              <p className="text-sm opacity-60">
                Platform Health
              </p>

              <div className="mt-4 flex items-center gap-3">
                <span
                  className="
                    h-3
                    w-3
                    rounded-full
                    bg-emerald-500
                  "
                />

                <span className="text-xl font-semibold">
                  Operational
                </span>
              </div>

              <p className="mt-3 text-sm leading-6 opacity-60">
                Core user, story, chapter, and reading
                systems are available.
              </p>
            </div>
          </div>
        </section>

        {/* STORY STATUS */}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Story Status
            </h2>

            <Link
              href="/admin/content"
              className="
                text-sm
                font-medium
                opacity-60
                transition
                hover:opacity-100
              "
            >
              Manage Content →
            </Link>
          </div>

          <div
            className="
              grid
              gap-4
              sm:grid-cols-2
              lg:grid-cols-5
            "
          >
            {statusBreakdown.map((item) => (
              <div
                key={item.status}
                className="
                  rounded-2xl
                  border
                  bg-[var(--card)]
                  p-5
                  shadow-sm
                "
                style={{
                  borderColor:
                    "var(--card-border)",
                }}
              >
                <p className="text-sm opacity-60">
                  {item.status}
                </p>

                <p className="mt-2 text-3xl font-bold">
                  {item.count}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* RECENT STORIES */}

        <section className="mt-8">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Recently Created Stories
            </h2>

            <Link
              href="/admin/content"
              className="
                text-sm
                font-medium
                opacity-60
                transition
                hover:opacity-100
              "
            >
              View All →
            </Link>
          </div>

          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              bg-[var(--card)]
              shadow-sm
            "
            style={{
              borderColor:
                "var(--card-border)",
            }}
          >
            {!recentStories?.length ? (
              <div className="p-8 text-center">
                <p className="text-sm opacity-60">
                  No stories have been created yet.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {(
                  recentStories as RecentStory[]
                ).map((story) => (
                  <div
                    key={story.id}
                    className="
                      flex
                      items-center
                      justify-between
                      gap-4
                      px-5
                      py-4
                    "
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {story.title}
                      </p>

                      <p className="mt-1 text-xs opacity-50">
                        {formatDate(story.created_at)}
                      </p>
                    </div>

                    <span
                      className="
                        shrink-0
                        rounded-full
                        border
                        px-3
                        py-1
                        text-xs
                      "
                      style={{
                        borderColor:
                          "var(--card-border)",
                      }}
                    >
                      {story.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* FOOTER NOTE */}

        <div
          className="
            mt-8
            rounded-2xl
            border
            p-5
            text-sm
            opacity-70
          "
          style={{
            borderColor:
              "var(--card-border)",
          }}
        >
          <strong className="opacity-100">
            Analytics note:
          </strong>{" "}
          These figures represent the current database
          state. More advanced analytics such as daily
          active users, engagement trends, views, retention,
          and growth charts can be added later once the
          underlying event data is available.
        </div>

      </div>
    </main>
  );
}

function MetricCard({
  icon,
  label,
  value,
  description,
}: {
  icon: string;
  label: string;
  value: number;
  description: string;
}) {
  return (
    <div
      className="
        rounded-2xl
        border
        bg-[var(--card)]
        p-6
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:shadow-md
      "
      style={{
        borderColor:
          "var(--card-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-2xl">
          {icon}
        </span>

        <span className="text-3xl font-bold">
          {value.toLocaleString()}
        </span>
      </div>

      <h3 className="mt-5 font-semibold">
        {label}
      </h3>

      <p className="mt-1 text-xs opacity-50">
        {description}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}