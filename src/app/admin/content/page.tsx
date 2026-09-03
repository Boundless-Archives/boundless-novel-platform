import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import DeleteStoryButton from "@/components/admin/DeleteStoryButton";

type Story = {
  id: string;
  title: string;
  slug: string;
  status: string;
  author_id: string;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
};

export default async function AdminContentPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !currentProfile ||
    !["admin", "superadmin"].includes(currentProfile.role)
  ) {
    redirect("/");
  }

  const { data: stories, error: storiesError } = await supabase
    .from("stories")
    .select(
      "id, title, slug, status, author_id, created_at, updated_at"
    )
    .order("updated_at", { ascending: false });

  if (storiesError) {
    return <ErrorState message={storiesError.message} />;
  }

  const storyList = (stories ?? []) as Story[];

  const authorIds = [
    ...new Set(storyList.map((story) => story.author_id)),
  ];

  let profiles: Profile[] = [];

  if (authorIds.length > 0) {
    const { data: profileData, error: profilesError } =
      await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", authorIds);

    if (profilesError) {
      return <ErrorState message={profilesError.message} />;
    }

    profiles = (profileData ?? []) as Profile[];
  }

  const getAuthor = (authorId: string) =>
    profiles.find((profile) => profile.id === authorId);

  const draftCount = storyList.filter(
    (story) => story.status === "Draft"
  ).length;

  const ongoingCount = storyList.filter(
    (story) => story.status === "Ongoing"
  ).length;

  const completedCount = storyList.filter(
    (story) => story.status === "Completed"
  ).length;

  const hiatusCount = storyList.filter(
    (story) => story.status === "Hiatus"
  ).length;

  const droppedCount = storyList.filter(
    (story) => story.status === "Dropped"
  ).length;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-card-border bg-card text-2xl shadow-sm">
              📚
            </div>

            <div>
              <p className="text-sm font-medium text-foreground/60">
                Administration
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Content Management
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-foreground/65">
            Review and oversee stories published across Boundless.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard
            label="Total Stories"
            value={storyList.length}
          />

          <StatCard
            label="Drafts"
            value={draftCount}
          />

          <StatCard
            label="Ongoing"
            value={ongoingCount}
          />

          <StatCard
            label="Completed"
            value={completedCount}
          />

          <StatCard
            label="Hiatus / Dropped"
            value={hiatusCount + droppedCount}
          />
        </div>

        {/* Stories */}
        <section className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
          <div className="border-b border-card-border px-6 py-5">
            <h2 className="font-semibold text-foreground">
              All Stories
            </h2>

            <p className="mt-1 text-sm text-foreground/55">
              Latest updated stories appear first.
            </p>
          </div>

          {storyList.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mb-3 text-3xl">📭</div>

              <p className="text-sm font-medium text-foreground">
                No stories found.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-card-border">
              {storyList.map((story) => {
                const author = getAuthor(story.author_id);

                return (
                  <div
                    key={story.id}
                    className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between"
                  >
                    {/* Story information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="truncate font-semibold text-foreground">
                          {story.title}
                        </h3>

                        <StatusBadge status={story.status} />
                      </div>

                      <p className="mt-1 text-sm text-foreground/50">
                        by{" "}
                        {author?.display_name?.trim() ||
                          author?.username?.trim() ||
                          "Unknown author"}
                      </p>

                      <p className="mt-2 text-xs text-foreground/40">
                        Updated {formatDate(story.updated_at)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/stories/${story.id}`}
                        className="rounded-xl border border-card-border bg-background px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-foreground/30 hover:text-foreground"
                      >
                        View
                      </Link>

                      <Link
                        href={`/stories/${story.id}/edit`}
                        className="rounded-xl bg-button px-4 py-2 text-sm font-semibold text-button-text transition hover:opacity-90 active:scale-[0.98]"
                      >
                        Manage
                      </Link>

                      <DeleteStoryButton
                        storyId={story.id}
                        storyTitle={story.title}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Moderation */}
        <section className="mt-6 rounded-2xl border border-card-border bg-card p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <span className="text-xl">🛡️</span>

            <div>
              <p className="font-medium text-foreground">
                Moderation controls
              </p>

              <p className="mt-1 text-sm leading-6 text-foreground/60">
                Administrators can review stories, open their
                management pages, and permanently remove content
                when necessary.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
      <p className="text-sm text-foreground/55">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: string;
}) {
  return (
    <span className="rounded-full border border-card-border bg-background px-3 py-1 text-xs font-semibold text-foreground/70">
      {status}
    </span>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}

function ErrorState({
  message,
}: {
  message: string;
}) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            Unable to load content
          </h1>

          <p className="mt-2 text-sm text-foreground/60">
            {message}
          </p>
        </div>
      </div>
    </main>
  );
}