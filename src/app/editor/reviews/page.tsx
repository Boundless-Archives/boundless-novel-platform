import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Story = {
  id: string;
  title: string;
  author_id: string;
};

type Author = {
  id: string;
  username: string | null;
  display_name: string | null;
};

type Review = {
  id: string;
  title: string;
  content: string;
  story_id: string;
  chapter_id: string | null;
  created_at: string;
};

async function createReview(formData: FormData) {
  "use server";

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

  const storyId =
    String(formData.get("story_id") ?? "");

  const title =
    String(formData.get("title") ?? "").trim();

  const content =
    String(formData.get("content") ?? "").trim();

  if (!storyId || !title || !content) {
    throw new Error(
      "Story, title and review content are required."
    );
  }

  const { data: story } = await supabase
    .from("stories")
    .select("id, author_id")
    .eq("id", storyId)
    .single();

  if (!story) {
    throw new Error("Story does not exist.");
  }

  const { data: assignment } = await supabase
    .from("editor_author_assignments")
    .select("id")
    .eq("editor_id", user.id)
    .eq("author_id", story.author_id)
    .maybeSingle();

  if (!assignment) {
    throw new Error(
      "You are not assigned to this author."
    );
  }

  const { error } = await supabase
    .from("editorial_reviews")
    .insert({
      editor_id: user.id,
      author_id: story.author_id,
      story_id: story.id,
      title,
      content,
    });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/editor/reviews?saved=1");
}

export default async function EditorReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
  }>;
}) {
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

  let stories: Story[] = [];
  let authors: Author[] = [];

  if (authorIds.length > 0) {
    const { data: storyData } = await supabase
      .from("stories")
      .select(
        "id, title, author_id"
      )
      .in("author_id", authorIds)
      .order("title");

    stories = (storyData ?? []) as Story[];

    const { data: authorData } = await supabase
      .from("profiles")
      .select(
        "id, username, display_name"
      )
      .in("id", authorIds);

    authors = (authorData ?? []) as Author[];
  }

  const { data: reviewData } = await supabase
    .from("editorial_reviews")
    .select(`
      id,
      title,
      content,
      story_id,
      chapter_id,
      created_at
    `)
    .eq("editor_id", user.id)
    .order("created_at", {
      ascending: false,
    });

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

  const params = await searchParams;

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
            Editorial Reviews
          </h1>

          <p className="mt-2 text-sm leading-6 opacity-60">
            Provide feedback on the author's work.
          </p>
        </div>

        {params.saved === "1" && (
          <div
            className="
              mt-6
              rounded-2xl
              border
              p-4
              text-sm
            "
            style={{
              borderColor:
                "var(--card-border)",
            }}
          >
            <span className="font-semibold">
              ✓ Review saved
            </span>

            <span className="ml-2 opacity-55">
              Your editorial feedback has been recorded.
            </span>
          </div>
        )}

        {/* CREATE REVIEW */}

        <section
          className="
            mt-8
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
          <div className="mb-6">
            <h2 className="text-lg font-semibold">
              Write an Editorial Review
            </h2>

            <p className="mt-1 text-sm opacity-55">
              Your review is stored separately from the
              author's work.
            </p>
          </div>

          {stories.length === 0 ? (
            <div className="rounded-xl border p-5 text-sm opacity-55">
              You currently have no assigned stories to review.
            </div>
          ) : (
            <form
              action={createReview}
              className="space-y-5"
            >

              <div>
                <label
                  htmlFor="story_id"
                  className="mb-2 block text-sm font-medium"
                >
                  Story
                </label>

                <select
                  id="story_id"
                  name="story_id"
                  required
                  className="
                    w-full
                    rounded-xl
                    border
                    bg-transparent
                    px-4
                    py-3
                    outline-none
                  "
                  style={{
                    borderColor:
                      "var(--card-border)",
                  }}
                >
                  <option value="">
                    Select a story
                  </option>

                  {stories.map((story) => {
                    const author =
                      authorMap.get(
                        story.author_id
                      );

                    return (
                      <option
                        key={story.id}
                        value={story.id}
                      >
                        {story.title}
                        {" — "}
                        {author?.display_name ||
                          author?.username ||
                          "Author"}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div>
                <label
                  htmlFor="title"
                  className="mb-2 block text-sm font-medium"
                >
                  Review Title
                </label>

                <input
                  id="title"
                  name="title"
                  type="text"
                  required
                  placeholder="e.g. Character development feedback"
                  className="
                    w-full
                    rounded-xl
                    border
                    bg-transparent
                    px-4
                    py-3
                    outline-none
                  "
                  style={{
                    borderColor:
                      "var(--card-border)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="content"
                  className="mb-2 block text-sm font-medium"
                >
                  Editorial Feedback
                </label>

                <textarea
                  id="content"
                  name="content"
                  required
                  rows={8}
                  placeholder="Write your editorial feedback here..."
                  className="
                    w-full
                    resize-y
                    rounded-xl
                    border
                    bg-transparent
                    px-4
                    py-3
                    leading-6
                    outline-none
                  "
                  style={{
                    borderColor:
                      "var(--card-border)",
                  }}
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="
                    rounded-xl
                    border
                    px-6
                    py-3
                    text-sm
                    font-semibold
                    shadow-sm
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-md
                    active:translate-y-0
                  "
                  style={{
                    borderColor:
                      "var(--card-border)",
                    backgroundColor:
                      "var(--foreground)",
                    color:
                      "var(--background)",
                  }}
                >
                  Save Editorial Review
                </button>
              </div>

            </form>
          )}
        </section>

        {/* REVIEW HISTORY */}

        <section className="mt-8">

          <h2 className="mb-4 text-lg font-semibold">
            Review History
          </h2>

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
                  No reviews written yet.
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
                    <article
                      key={review.id}
                      className="p-5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">

                        <div>
                          <h3 className="font-semibold">
                            {review.title}
                          </h3>

                          <p className="mt-1 text-xs opacity-50">
                            {story?.title ||
                              "Story"}
                          </p>
                        </div>

                        <span className="text-xs opacity-40">
                          {formatDate(
                            review.created_at
                          )}
                        </span>

                      </div>

                      <p className="mt-4 whitespace-pre-wrap text-sm leading-7 opacity-65">
                        {review.content}
                      </p>
                    </article>
                  );
                })}
              </div>
            )}
          </div>

        </section>

      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}