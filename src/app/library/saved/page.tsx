import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import ShelfSelect from "@/components/library/ShelfSelect";
import { SHELVES, isShelf, type Shelf } from "@/lib/shelves";

type SavedStory = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  status: string;
};

type LibraryEntry = {
  id: string;
  story_id: string;
  shelf: string;
  created_at: string | null;
  stories: SavedStory | SavedStory[] | null;
};

export default async function SavedStoriesPage({
  searchParams,
}: {
  searchParams: Promise<{ shelf?: string }>;
}) {
  const { shelf: shelfParam } = await searchParams;
  const activeShelf: Shelf | "all" = isShelf(shelfParam) ? shelfParam : "all";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: rows, error } = await supabase
    .from("library")
    .select(`
      id,
      story_id,
      shelf,
      created_at,
      stories (
        id,
        title,
        slug,
        description,
        cover_url,
        status
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const entries = ((rows ?? []) as unknown as LibraryEntry[])
    .map((entry) => {
      const story = Array.isArray(entry.stories)
        ? entry.stories[0] ?? null
        : entry.stories;

      return story
        ? { story, shelf: (isShelf(entry.shelf) ? entry.shelf : "want_to_read") as Shelf }
        : null;
    })
    .filter(
      (e): e is { story: SavedStory; shelf: Shelf } => e !== null
    );

  const counts = new Map<string, number>();
  for (const e of entries) {
    counts.set(e.shelf, (counts.get(e.shelf) ?? 0) + 1);
  }

  const visible = entries.filter(
    (e) => activeShelf === "all" || e.shelf === activeShelf
  );

  const savedStories = visible.map((e) => e.story);
  const shelfById = new Map(visible.map((e) => [e.story.id, e.shelf]));

  return (
    <main className="max-w-7xl mx-auto px-5 py-10">

      {/* HEADER */}

      <div className="mb-10">

        <Link
          href="/library"
          className="
            inline-block
            mb-5
            text-sm
            opacity-70
            hover:underline
          "
        >
          ← Back to Library
        </Link>

        <h1 className="text-5xl font-bold">
          Saved Stories
        </h1>

        <p className="mt-2 opacity-70">
          Stories you&apos;ve saved to your personal library.
        </p>

      </div>

      {/* SHELF TABS */}

      {entries.length > 0 && (
        <nav className="mb-8 flex flex-wrap gap-2" aria-label="Shelves">
          {[
            { value: "all", label: "All", icon: "📚", n: entries.length },
            ...SHELVES.map((sh) => ({
              value: sh.value as string,
              label: sh.label,
              icon: sh.icon as string,
              n: counts.get(sh.value) ?? 0,
            })),
          ].map((tab) => (
            <Link
              key={tab.value}
              href={
                tab.value === "all"
                  ? "/library/saved"
                  : `/library/saved?shelf=${tab.value}`
              }
              className="rounded-full border px-4 py-2 text-sm font-medium"
              style={
                activeShelf === tab.value
                  ? {
                      backgroundColor: "var(--button)",
                      color: "var(--button-text)",
                      borderColor: "var(--button)",
                    }
                  : { borderColor: "var(--card-border)" }
              }
            >
              {tab.icon} {tab.label} · {tab.n}
            </Link>
          ))}
        </nav>
      )}

      {/* EMPTY STATE */}

      {!savedStories.length ? (

        <section
          className="
            rounded-2xl
            border
            p-14
            text-center
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >

          <div className="text-6xl mb-6">
            📚
          </div>

          <h2 className="text-3xl font-bold">
            {entries.length === 0
              ? "No Saved Stories"
              : "Nothing on this shelf yet"}
          </h2>

          <p className="mt-4 opacity-70">
            {entries.length === 0
              ? "Stories you save will appear here."
              : "Move a story here from any shelf, or save a new one."}
          </p>

          <Link
            href="/explore"
            className="
              inline-block
              mt-8
              rounded-xl
              border
              px-5
              py-3
              font-medium
              transition
              hover:-translate-y-0.5
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            Explore Stories →
          </Link>

        </section>

      ) : (

        /* SAVED STORIES */

        <section>

          <div className="mb-6">

            <span className="opacity-70">
              {savedStories.length}{" "}
              {savedStories.length === 1
                ? "story"
                : "stories"}
            </span>

          </div>

          <div
            className="
              grid
              gap-8
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-4
            "
          >

            {savedStories.map((story) => (

              <article
                key={story.id}
                className="
                  overflow-hidden
                  rounded-2xl
                  border
                  transition
                  duration-200
                  hover:-translate-y-1
                  hover:shadow-xl
                "
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                }}
              >

                {/* COVER */}

                {story.cover_url ? (

                  <Image
                    src={story.cover_url}
                    alt={story.title}
                    width={400}
                    height={600}
                    className="
                      aspect-[2/3]
                      w-full
                      object-cover
                    "
                  />

                ) : (

                  <div
                    className="
                      flex
                      aspect-[2/3]
                      w-full
                      items-center
                      justify-center
                      text-6xl
                      opacity-30
                    "
                  >
                    📖
                  </div>

                )}

                {/* DETAILS */}

                <div className="p-6">

                  <Link
                    href={`/story/${story.slug}`}
                    className="
                      text-2xl
                      font-bold
                      hover:underline
                    "
                  >
                    {story.title}
                  </Link>

                  <div className="mt-4 flex flex-wrap items-center gap-2">

                    <ShelfSelect
                      key={`${story.id}-${shelfById.get(story.id)}`}
                      storyId={story.id}
                      initial={shelfById.get(story.id) ?? "want_to_read"}
                    />

                    <span
                      className="
                        inline-block
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

                  {story.description && (

                    <p
                      className="
                        mt-5
                        line-clamp-4
                        text-sm
                        opacity-75
                      "
                    >
                      {story.description}
                    </p>

                  )}

                  <Link
                    href={`/story/${story.slug}`}
                    className="
                      mt-7
                      inline-block
                      rounded-xl
                      border
                      px-5
                      py-3
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
                    Open Story →
                  </Link>

                </div>

              </article>

            ))}

          </div>

        </section>

      )}

    </main>
  );
}