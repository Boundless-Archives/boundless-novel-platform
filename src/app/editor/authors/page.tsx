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
};

export default async function EditorAuthorsPage() {
  const supabase = await createClient();

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

  if (!profile || profile.role !== "editor") {
    redirect("/");
  }

  const { data: assignments } = await supabase
    .from("editor_author_assignments")
    .select("author_id")
    .eq("editor_id", user.id);

  const authorIds =
    assignments?.map(
      (assignment) => assignment.author_id
    ) ?? [];

  let authors: Author[] = [];
  let stories: Story[] = [];

  if (authorIds.length > 0) {
    const { data: authorData } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name"
      )
      .in("id", authorIds)
      .order("username");

    authors = (authorData ?? []) as Author[];

    const { data: storyData } = await supabase
      .from("stories")
      .select(
        "id, title, status, author_id"
      )
      .in("author_id", authorIds)
      .order("created_at", {
        ascending: false,
      });

    stories = (storyData ?? []) as Story[];
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">

        <Link
          href="/editor"
          className="text-sm opacity-55 transition hover:opacity-100"
        >
          ← Back to Editor Dashboard
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight">
            My Authors
          </h1>

          <p className="mt-2 text-sm opacity-60">
            Authors assigned to you and their work.
          </p>
        </div>

        <div className="mt-8 space-y-5">

          {authors.length === 0 ? (
            <div
              className="
                rounded-2xl
                border
                bg-[var(--card)]
                p-8
                text-center
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >
              <p className="text-sm opacity-55">
                No authors are currently assigned to you.
              </p>
            </div>
          ) : (
            authors.map((author) => {
              const authorStories =
                stories.filter(
                  (story) =>
                    story.author_id ===
                    author.id
                );

              return (
                <section
                  key={author.id}
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
                  <div className="flex flex-wrap items-start justify-between gap-4">

                    <div>
                      <h2 className="text-xl font-semibold">
                        {author.display_name ||
                          author.username ||
                          "Author"}
                      </h2>

                      {author.username && (
                        <p className="mt-1 text-sm opacity-50">
                          @{author.username}
                        </p>
                      )}
                    </div>

                    <span
                      className="
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
                      {authorStories.length}{" "}
                      {authorStories.length === 1
                        ? "story"
                        : "stories"}
                    </span>

                  </div>

                  <div className="mt-5 space-y-2">

                    {authorStories.length === 0 ? (
                      <p className="text-sm opacity-50">
                        This author has no stories yet.
                      </p>
                    ) : (
                      authorStories.map(
                        (story) => (
                          <div
                            key={story.id}
                            className="
                              flex
                              items-center
                              justify-between
                              gap-4
                              rounded-xl
                              border
                              p-4
                            "
                            style={{
                              borderColor:
                                "var(--card-border)",
                            }}
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium">
                                {story.title}
                              </p>

                              <p className="mt-1 text-xs opacity-50">
                                {story.status}
                              </p>
                            </div>

                            <Link
                              href={`/stories/${story.id}`}
                              className="
                                shrink-0
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
                        )
                      )
                    )}

                  </div>
                </section>
              );
            })
          )}

        </div>

      </div>
    </main>
  );
}