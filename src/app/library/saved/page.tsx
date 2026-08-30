import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

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
  created_at: string | null;
  stories: SavedStory | SavedStory[] | null;
};

export default async function SavedStoriesPage() {
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

  const savedStories: SavedStory[] = (rows ?? [])
    .map((entry) => {
      const story = Array.isArray(entry.stories)
        ? entry.stories[0] ?? null
        : entry.stories;

      return story;
    })
    .filter(
      (story): story is SavedStory =>
        story !== null
    );

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
          Stories you've saved to your personal library.
        </p>

      </div>

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
            No Saved Stories
          </h2>

          <p className="mt-4 opacity-70">
            Stories you save will appear here.
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

                  <div className="mt-4">

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