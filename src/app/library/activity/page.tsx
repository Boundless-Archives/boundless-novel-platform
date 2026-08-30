import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

type ReadingActivity = {
  story_id: string;
  chapter_id: string;
  progress: number | null;
  last_read_at: string | null;
  stories: {
    title: string;
    slug: string;
    cover_url: string | null;
  } | null;
  chapters: {
    chapter_number: number;
    title: string;
  } | null;
};

export default async function ReadingActivityPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: rows, error } = await supabase
    .from("reading_history")
    .select(`
      story_id,
      chapter_id,
      progress,
      last_read_at,
      stories (
        title,
        slug,
        cover_url
      ),
      chapters (
        chapter_number,
        title
      )
    `)
    .eq("user_id", user.id)
    .order("last_read_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  const activity: ReadingActivity[] =
    (rows ?? []).map((entry) => ({
      story_id: entry.story_id,
      chapter_id: entry.chapter_id,
      progress: entry.progress,
      last_read_at: entry.last_read_at,
      stories: Array.isArray(entry.stories)
        ? entry.stories[0] ?? null
        : entry.stories,
      chapters: Array.isArray(entry.chapters)
        ? entry.chapters[0] ?? null
        : entry.chapters,
    }));

  return (
    <main className="max-w-5xl mx-auto px-5 py-10">

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
          Reading Activity
        </h1>

        <p className="mt-2 opacity-70">
          Your recent reading history.
        </p>

      </div>

      {/* EMPTY STATE */}

      {!activity.length ? (

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
            📖
          </div>

          <h2 className="text-3xl font-bold">
            No Reading Activity
          </h2>

          <p className="mt-4 opacity-70">
            Stories you read will appear here.
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
            Start Reading →
          </Link>

        </section>

      ) : (

        /* ACTIVITY LIST */

        <section className="space-y-5">

          {activity.map((entry, index) => {

            const story = entry.stories;
            const chapter = entry.chapters;

            if (!story || !chapter) {
              return null;
            }

            const progress = Math.min(
              Math.max(entry.progress ?? 0, 0),
              100
            );

            const date = entry.last_read_at
              ? new Date(
                  entry.last_read_at
                ).toLocaleDateString(
                  "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }
                )
              : "Unknown date";

            return (

              <article
                key={`${entry.story_id}-${entry.chapter_id}-${index}`}
                className="
                  flex
                  gap-5
                  rounded-2xl
                  border
                  p-5
                  transition
                  hover:-translate-y-0.5
                "
                style={{
                  backgroundColor: "var(--card)",
                  borderColor:
                    "var(--card-border)",
                }}
              >

                {/* COVER */}

                {story.cover_url ? (

                  <Image
                    src={story.cover_url}
                    alt={story.title}
                    width={80}
                    height={110}
                    className="
                      h-[110px]
                      w-[75px]
                      shrink-0
                      rounded-xl
                      object-cover
                    "
                  />

                ) : (

                  <div
                    className="
                      flex
                      h-[110px]
                      w-[75px]
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      border
                      text-3xl
                      opacity-40
                    "
                    style={{
                      borderColor:
                        "var(--card-border)",
                    }}
                  >
                    📖
                  </div>

                )}

                {/* DETAILS */}

                <div className="min-w-0 flex-1">

                  <Link
                    href={`/story/${story.slug}`}
                    className="
                      text-xl
                      font-bold
                      hover:underline
                    "
                  >
                    {story.title}
                  </Link>

                  <p className="mt-2 opacity-70">
                    Chapter {chapter.chapter_number}
                    {" — "}
                    {chapter.title}
                  </p>

                  <p className="mt-2 text-sm opacity-50">
                    Last read {date}
                  </p>

                  {/* CHAPTER PROGRESS */}

                  <div className="mt-4">

                    <div className="mb-1 flex justify-between text-xs">

                      <span className="opacity-60">
                        Chapter progress
                      </span>

                      <span className="font-medium">
                        {progress}%
                      </span>

                    </div>

                    <div
                      className="
                        h-2
                        overflow-hidden
                        rounded-full
                      "
                      style={{
                        backgroundColor:
                          "var(--card-border)",
                      }}
                    >

                      <div
                        className="
                          h-full
                          rounded-full
                        "
                        style={{
                          width: `${progress}%`,
                          backgroundColor:
                            "var(--button)",
                        }}
                      />

                    </div>

                  </div>

                  <Link
                    href={`/chapter/${entry.chapter_id}`}
                    className="
                      mt-5
                      inline-block
                      text-sm
                      font-medium
                      hover:underline
                    "
                  >
                    Continue Reading →
                  </Link>

                </div>

              </article>

            );
          })}

        </section>

      )}

    </main>
  );
}