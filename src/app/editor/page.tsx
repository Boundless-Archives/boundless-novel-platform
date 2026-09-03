import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Author = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type Story = {
  id: string;
  title: string;
  status: string;
  author_id: string;
  created_at: string;
};

type Review = {
  id: string;
  title: string;
  content: string;
  story_id: string;
  chapter_id: string | null;
  created_at: string;
};

export default async function EditorDashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "id, username, display_name, role, editor_referral_code"
    )
    .eq("id", user.id)
    .single();

  if (!profile || profile.role !== "editor") {
    redirect("/");
  }

  /*
   * ASSIGNED AUTHORS
   */

  const { data: assignments } = await supabase
    .from("editor_author_assignments")
    .select("author_id, created_at")
    .eq("editor_id", user.id);

  const authorIds =
    assignments?.map(
      (assignment) => assignment.author_id
    ) ?? [];

  let authors: Author[] = [];

  if (authorIds.length > 0) {
    const { data: authorData } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name"
      )
      .in("id", authorIds)
      .order("username");

    authors = (authorData ?? []) as Author[];
  }

  /*
   * ASSIGNED STORIES
   */

  let stories: Story[] = [];

  if (authorIds.length > 0) {
    const { data: storyData } = await supabase
      .from("stories")
      .select(
        "id, title, status, author_id, created_at"
      )
      .in("author_id", authorIds)
      .order("created_at", {
        ascending: false,
      });

    stories = (storyData ?? []) as Story[];
  }

  /*
   * REVIEWS
   */

  const { data: reviewData } = await supabase
    .from("editorial_reviews")
    .select(
      "id, title, content, story_id, chapter_id, created_at"
    )
    .eq("editor_id", user.id)
    .order("created_at", {
      ascending: false,
    })
    .limit(5);

  const reviews =
    (reviewData ?? []) as Review[];

  const storyMap = new Map(
    stories.map((story) => [
      story.id,
      story,
    ])
  );

  const authorMap = new Map(
    authors.map((author) => [
      author.id,
      author,
    ])
  );

  const displayName =
    profile.display_name?.trim() ||
    profile.username?.trim() ||
    "Editor";

  const ongoingStories = stories.filter(
    (story) => story.status === "Ongoing"
  ).length;

  const completedStories = stories.filter(
    (story) => story.status === "Completed"
  ).length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-6 py-10">

        {/* HEADER */}

        <div className="mb-10">
          <div className="flex flex-wrap items-start justify-between gap-6">

            <div>
              <p className="text-sm font-medium opacity-50">
                Editor Workspace
              </p>

              <h1 className="mt-2 text-3xl font-bold tracking-tight">
                Welcome, {displayName}
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 opacity-60">
                Review assigned authors and provide editorial
                feedback without modifying their work.
              </p>
            </div>

            {profile.editor_referral_code && (
              <div
                className="
                  rounded-2xl
                  border
                  bg-[var(--card)]
                  px-5
                  py-4
                  shadow-sm
                "
                style={{
                  borderColor:
                    "var(--card-border)",
                }}
              >
                <p className="text-xs uppercase tracking-wider opacity-50">
                  Editor Referral Code
                </p>

                <p className="mt-1 font-mono text-lg font-semibold">
                  {profile.editor_referral_code}
                </p>
              </div>
            )}

          </div>
        </div>

        {/* STATS */}

        <section
          className="
            grid
            gap-5
            sm:grid-cols-2
            lg:grid-cols-4
          "
        >
          <StatCard
            icon="✍️"
            label="Assigned Authors"
            value={authors.length}
          />

          <StatCard
            icon="📚"
            label="Assigned Stories"
            value={stories.length}
          />

          <StatCard
            icon="📖"
            label="Ongoing Stories"
            value={ongoingStories}
          />

          <StatCard
            icon="📝"
            label="Reviews Written"
            value={reviews.length}
          />
        </section>

        {/* QUICK ACTIONS */}

        <section className="mt-8">
          <h2 className="mb-4 text-lg font-semibold">
            Editorial Workspace
          </h2>

          <div className="grid gap-5 md:grid-cols-2">

            <Link
              href="/editor/authors"
              className="
                group
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
                  ✍️
                </span>

                <span className="text-xl opacity-40 transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-semibold">
                My Authors
              </h3>

              <p className="mt-1 text-sm leading-6 opacity-55">
                View the authors currently assigned to you
                and explore their published work.
              </p>
            </Link>

            <Link
              href="/editor/reviews"
              className="
                group
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
                  📝
                </span>

                <span className="text-xl opacity-40 transition group-hover:translate-x-1">
                  →
                </span>
              </div>

              <h3 className="mt-5 font-semibold">
                Editorial Reviews
              </h3>

              <p className="mt-1 text-sm leading-6 opacity-55">
                Read and write editorial feedback for your
                assigned authors.
              </p>
            </Link>

          </div>
        </section>

        {/* ASSIGNED STORIES */}

        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Assigned Stories
            </h2>

            <Link
              href="/editor/authors"
              className="text-sm font-medium opacity-55 transition hover:opacity-100"
            >
              View Authors →
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
            {stories.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm opacity-55">
                  You currently have no assigned stories.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {stories.slice(0, 8).map((story) => {
                  const author =
                    authorMap.get(
                      story.author_id
                    );

                  return (
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
                          by{" "}
                          {author?.display_name ||
                            author?.username ||
                            "Unknown author"}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">

                        <span
                          className="
                            hidden
                            rounded-full
                            border
                            px-3
                            py-1
                            text-xs
                            sm:inline-flex
                          "
                          style={{
                            borderColor:
                              "var(--card-border)",
                          }}
                        >
                          {story.status}
                        </span>

                        <Link
                          href={`/stories/${story.id}`}
                          className="
                            rounded-lg
                            border
                            px-3
                            py-1.5
                            text-xs
                            font-medium
                            transition
                            hover:bg-[var(--background)]
                          "
                          style={{
                            borderColor:
                              "var(--card-border)",
                          }}
                        >
                          View
                        </Link>

                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

        {/* RECENT REVIEWS */}

        <section className="mt-8">

          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              Recent Editorial Reviews
            </h2>

            <Link
              href="/editor/reviews"
              className="text-sm font-medium opacity-55 transition hover:opacity-100"
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
            {reviews.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm opacity-55">
                  No editorial reviews have been written yet.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {reviews.map((review) => {
                  const story =
                    storyMap.get(
                      review.story_id
                    );

                  return (
                    <div
                      key={review.id}
                      className="px-5 py-4"
                    >
                      <div className="flex items-start justify-between gap-4">

                        <div className="min-w-0">
                          <p className="font-medium">
                            {review.title}
                          </p>

                          <p className="mt-1 text-xs opacity-50">
                            {story?.title ||
                              "Story"}
                            {review.chapter_id
                              ? " • Chapter review"
                              : " • Story review"}
                          </p>
                        </div>

                        <span className="shrink-0 text-xs opacity-40">
                          {formatDate(
                            review.created_at
                          )}
                        </span>

                      </div>

                      <p className="mt-3 line-clamp-2 text-sm leading-6 opacity-60">
                        {review.content}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </section>

        {/* PERMISSIONS NOTICE */}

        <section
          className="
            mt-8
            rounded-2xl
            border
            p-5
          "
          style={{
            borderColor:
              "var(--card-border)",
          }}
        >
          <p className="text-sm font-semibold">
            Editorial permissions
          </p>

          <p className="mt-2 text-sm leading-6 opacity-55">
            Your editor account is read-only with respect to
            author content. You can review assigned work and
            provide editorial feedback, but you cannot edit,
            publish, delete, or otherwise alter an author's
            stories or chapters.
          </p>
        </section>

      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: number;
}) {
  return (
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
      <div className="flex items-center justify-between">
        <span className="text-2xl">
          {icon}
        </span>

        <span className="text-3xl font-bold">
          {value.toLocaleString()}
        </span>
      </div>

      <p className="mt-5 text-sm font-semibold">
        {label}
      </p>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}