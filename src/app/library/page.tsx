import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

type Story = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  cover_url: string | null;
  status: string;
};

type Chapter = {
  id: string;
  chapter_number: number;
  title: string;
};

type LibraryEntry = {
  id: string;
  story_id: string;
  created_at: string | null;
  stories: Story | null;
};

type ReadingHistoryEntry = {
  story_id: string;
  chapter_id: string;
  progress: number | null;
  last_read_at: string | null;
  stories: Story | null;
  chapters: Chapter | null;
};

type StoryChapterCount = {
  story_id: string;
  total_chapters: number;
};

export default async function LibraryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  /*
   * --------------------------------------------------
   * SAVED STORIES
   * --------------------------------------------------
   */

  const { data: libraryRows } = await supabase
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

  /*
   * Normalize Supabase relationships.
   */

  const library: LibraryEntry[] = (libraryRows ?? []).map(
    (entry) => ({
      id: entry.id,
      story_id: entry.story_id,
      created_at: entry.created_at,
      stories: Array.isArray(entry.stories)
        ? entry.stories[0] ?? null
        : entry.stories,
    })
  );

  /*
   * --------------------------------------------------
   * READING HISTORY
   * --------------------------------------------------
   *
   * We load the reader's history rather than only the
   * latest record because the Library's reading stats
   * are based on actual reading activity.
   */

  const { data: readingHistoryRows } = await supabase
    .from("reading_history")
    .select(`
      story_id,
      chapter_id,
      progress,
      last_read_at,
      stories (
        id,
        title,
        slug,
        description,
        cover_url,
        status
      ),
      chapters (
        id,
        chapter_number,
        title
      )
    `)
    .eq("user_id", user.id)
    .order("last_read_at", {
      ascending: false,
    });

  const readingHistory: ReadingHistoryEntry[] =
    (readingHistoryRows ?? []).map((entry) => ({
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

    /*
      * --------------------------------------------------
      * TOTAL CHAPTERS PER STORY
      * --------------------------------------------------
      */

      const storyIds = [
        ...new Set(
          readingHistory
            .map((entry) => entry.story_id)
            .filter(Boolean)
        ),
      ];

      const { data: chapterRows } =
        storyIds.length > 0
          ? await supabase
              .from("chapters")
              .select("story_id")
              .in("story_id", storyIds)
          : { data: [] };

      const chapterCounts = new Map<string, number>();

      (chapterRows ?? []).forEach((chapter) => {
        chapterCounts.set(
          chapter.story_id,
          (chapterCounts.get(chapter.story_id) ?? 0) + 1
        );
      });

  /*
   * --------------------------------------------------
   * CONTINUE READING
   * --------------------------------------------------
   */

  const continueReading =
    readingHistory[0] ?? null;

  /*
   * --------------------------------------------------
   * READING OVERVIEW
   * --------------------------------------------------
   *
   * Stats are based on actual reading history.
   */

  const uniqueStoryProgress = new Map<
  string,
  number
>();

readingHistory.forEach((entry) => {
  const totalChapters =
    chapterCounts.get(entry.story_id) ?? 0;

  const currentChapter =
    entry.chapters?.chapter_number ?? 1;

  const chapterProgress = Math.min(
    Math.max(entry.progress ?? 0, 0),
    100
  );

  let overallProgress = 0;

  if (totalChapters > 0) {
    overallProgress =
      ((currentChapter - 1) +
        chapterProgress / 100) /
      totalChapters *
      100;
  }

  overallProgress = Math.min(
    Math.max(overallProgress, 0),
    100
  );

  const existing =
    uniqueStoryProgress.get(entry.story_id) ?? 0;

  if (overallProgress > existing) {
    uniqueStoryProgress.set(
      entry.story_id,
      overallProgress
    );
  }
});

  const startedCount =
    uniqueStoryProgress.size;

  const currentlyReadingCount =
    [...uniqueStoryProgress.values()].filter(
      (progress) =>
        progress > 0 && progress < 100
    ).length;

  const finishedCount =
    [...uniqueStoryProgress.values()].filter(
      (progress) => progress >= 100
    ).length;

  const totalProgress =
    startedCount > 0
      ? Math.round(
          [...uniqueStoryProgress.values()].reduce(
            (total, progress) =>
              total + progress,
            0
          ) / startedCount
        )
      : 0;

  const savedCount = library.length;

  /*
   * --------------------------------------------------
   * PAGE
   * --------------------------------------------------
   */

  return (
    <main className="max-w-7xl mx-auto px-5 py-10">

      {/* PAGE HEADER */}

      <header className="mb-10">

        <p className="text-sm font-medium opacity-60">
          Reader
        </p>

        <h1 className="mt-1 text-5xl font-bold">
          My Library
        </h1>

        <p className="mt-3 max-w-2xl opacity-70">
          Your personal reading space for saved stories,
          collections, reading activity, and more.
        </p>

      </header>

      {/* CONTINUE READING */}

      <section
        className="
          rounded-2xl
          border
          p-6
          md:p-8
        "
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >

        <div className="
          flex
          items-center
          justify-between
          gap-4
        ">

          <div>

            <h2 className="text-2xl font-bold">
              Continue Reading
            </h2>

            <p className="mt-1 text-sm opacity-60">
              Pick up where you left off.
            </p>

          </div>

          {continueReading && (
            <Link
              href="/library/history"
              className="
                text-sm
                font-medium
                opacity-70
                hover:opacity-100
                transition
              "
            >
              View Activity →
            </Link>
          )}

        </div>

        {continueReading?.stories ? (

          <div className="
            mt-7
            flex
            flex-col
            sm:flex-row
            gap-6
            items-start
          ">

            {/* COVER */}

            {continueReading.stories.cover_url ? (

              <Image
                src={
                  continueReading.stories.cover_url
                }
                alt={
                  continueReading.stories.title
                }
                width={110}
                height={165}
                className="
                  w-28
                  h-40
                  rounded-xl
                  object-cover
                  shrink-0
                "
              />

            ) : (

              <div
                className="
                  w-28
                  h-40
                  rounded-xl
                  border
                  flex
                  items-center
                  justify-center
                  text-4xl
                  opacity-40
                  shrink-0
                "
                style={{
                  borderColor:
                    "var(--card-border)",
                }}
              >
                📖
              </div>

            )}

            {/* INFORMATION */}

            <div className="flex-1">

              <p className="text-sm opacity-60">
                Currently reading
              </p>

              <h3 className="
                mt-1
                text-2xl
                md:text-3xl
                font-bold
              ">
                {continueReading.stories.title}
              </h3>

              {continueReading.chapters && (
                <p className="mt-2 opacity-75">
                  Chapter{" "}
                  {
                    continueReading.chapters
                      .chapter_number
                  }
                  {" — "}
                  {
                    continueReading.chapters.title
                  }
                </p>
              )}

              {/* PROGRESS */}

              <div className="mt-5 max-w-xl">

                <div className="
                  flex
                  items-center
                  justify-between
                  text-sm
                  mb-2
                ">

                  <span className="opacity-60">
                    Reading progress
                  </span>

                  <span className="font-medium">
                    {Math.round(
                      (
                        (
                          (continueReading.chapters?.chapter_number ?? 1) - 1 +
                          Math.min(
                            Math.max(
                              continueReading.progress ?? 0,
                              0
                            ),
                            100
                          ) / 100
                        ) /
                        Math.max(
                          chapterCounts.get(
                            continueReading.story_id
                          ) ?? 1,
                          1
                        )
                      ) * 100
                    )}%
                  </span>

                </div>

                <div
                  className="
                    h-2
                    w-full
                    rounded-full
                    overflow-hidden
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
                      transition-all
                    "
                    style={{
                      width: `${
                        Math.round(
                          (
                            (
                              (continueReading.chapters?.chapter_number ?? 1) - 1 +
                              Math.min(
                                Math.max(
                                  continueReading.progress ?? 0,
                                  0
                                ),
                                100
                              ) / 100
                            ) /
                            Math.max(
                              chapterCounts.get(
                                continueReading.story_id
                              ) ?? 1,
                              1
                            )
                          ) * 100
                        )
                      }%`,
                      backgroundColor:
                        "var(--button)",
                    }}
                  />

                </div>

              </div>

              <Link
                href={`/chapter/${continueReading.chapter_id}`}
                className="
                  inline-block
                  mt-6
                  rounded-xl
                  px-5
                  py-3
                  font-semibold
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                "
                style={{
                  backgroundColor:
                    "var(--button)",
                  color:
                    "var(--button-text)",
                }}
              >
                Continue Reading →
              </Link>

            </div>

          </div>

        ) : (

          <div
            className="
              mt-7
              rounded-xl
              border
              p-10
              text-center
            "
            style={{
              borderColor:
                "var(--card-border)",
            }}
          >

            <div className="text-5xl">
              📖
            </div>

            <h3 className="
              mt-4
              text-xl
              font-bold
            ">
              Nothing to continue
            </h3>

            <p className="
              mt-2
              opacity-70
              max-w-md
              mx-auto
            ">
              Start reading a story and your current
              reading position will appear here.
            </p>

          </div>

        )}

      </section>

      {/* READING OVERVIEW */}

      <section className="mt-8">

        <div className="
          rounded-2xl
          border
          p-6
          md:p-8
        "
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
        >

          <div className="
            flex
            flex-col
            md:flex-row
            md:items-center
            md:justify-between
            gap-6
          ">

            <div>

              <h2 className="text-2xl font-bold">
                Reading Overview
              </h2>

              <p className="
                mt-1
                text-sm
                opacity-60
              ">
                A quick look at your reading activity.
              </p>

            </div>

            <Link
              href="/library/history"
              className="
                text-sm
                font-medium
                opacity-70
                hover:opacity-100
                transition
              "
            >
              View Full Activity →
            </Link>

          </div>

          <div className="
            mt-7
            grid
            gap-4
            sm:grid-cols-2
            lg:grid-cols-4
          ">

            {/* SAVED */}

            <div
              className="
                rounded-xl
                border
                p-5
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >

              <p className="
                text-sm
                opacity-60
              ">
                Saved
              </p>

              <p className="
                mt-2
                text-3xl
                font-bold
              ">
                {savedCount}
              </p>

              <p className="
                mt-1
                text-sm
                opacity-60
              ">
                stories in library
              </p>

            </div>

            {/* STARTED */}

            <div
              className="
                rounded-xl
                border
                p-5
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >

              <p className="
                text-sm
                opacity-60
              ">
                Started
              </p>

              <p className="
                mt-2
                text-3xl
                font-bold
              ">
                {startedCount}
              </p>

              <p className="
                mt-1
                text-sm
                opacity-60
              ">
                stories you've begun
              </p>

            </div>

            {/* CURRENTLY READING */}

            <div
              className="
                rounded-xl
                border
                p-5
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >

              <p className="
                text-sm
                opacity-60
              ">
                Currently Reading
              </p>

              <p className="
                mt-2
                text-3xl
                font-bold
              ">
                {currentlyReadingCount}
              </p>

              <p className="
                mt-1
                text-sm
                opacity-60
              ">
                stories in progress
              </p>

            </div>

            {/* FINISHED */}

            <div
              className="
                rounded-xl
                border
                p-5
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >

              <p className="
                text-sm
                opacity-60
              ">
                Finished
              </p>

              <p className="
                mt-2
                text-3xl
                font-bold
              ">
                {finishedCount}
              </p>

              <p className="
                mt-1
                text-sm
                opacity-60
              ">
                stories completed
              </p>

            </div>

          </div>

          {/* OVERALL PROGRESS */}

          {startedCount > 0 && (
            <div className="mt-7">

              <div className="
                flex
                items-center
                justify-between
                text-sm
                mb-2
              ">

                <span className="opacity-60">
                  Overall reading progress
                </span>

                <span className="font-medium">
                  {totalProgress}%
                </span>

              </div>

              <div
                className="
                  h-2
                  w-full
                  rounded-full
                  overflow-hidden
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
                    width: `${totalProgress}%`,
                    backgroundColor:
                      "var(--button)",
                  }}
                />

              </div>

            </div>
          )}

        </div>

      </section>

      {/* LIBRARY SECTIONS */}

      <section className="mt-12">

        <div className="mb-6">

          <h2 className="text-2xl font-bold">
            Your Reading Space
          </h2>

          <p className="
            mt-1
            opacity-60
          ">
            Everything in your library, organized into
            dedicated spaces.
          </p>

        </div>

        <div className="
          grid
          gap-5
          sm:grid-cols-2
          lg:grid-cols-3
        ">

          {/* SAVED STORIES */}

          <Link
            href="/library/saved"
            className="
              group
              rounded-2xl
              border
              p-6
              transition
              hover:-translate-y-1
              hover:shadow-lg
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >

            <div className="text-3xl">
              📚
            </div>

            <h3 className="
              mt-4
              text-xl
              font-bold
              group-hover:underline
            ">
              Saved Stories
            </h3>

            <p className="
              mt-2
              text-sm
              opacity-65
            ">
              Stories you've saved to your library.
            </p>

            <p className="
              mt-5
              text-sm
              font-medium
              opacity-70
            ">
              {savedCount} saved →
            </p>

          </Link>

          {/* COLLECTIONS */}

          <Link
            href="/collections"
            className="
              group
              rounded-2xl
              border
              p-6
              transition
              hover:-translate-y-1
              hover:shadow-lg
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >

            <div className="text-3xl">
              🗂️
            </div>

            <h3 className="
              mt-4
              text-xl
              font-bold
              group-hover:underline
            ">
              Collections
            </h3>

            <p className="
              mt-2
              text-sm
              opacity-65
            ">
              Organize stories into your own collections.
            </p>

            <p className="
              mt-5
              text-sm
              font-medium
              opacity-70
            ">
              Manage Collections →
            </p>

          </Link>

          {/* READING ACTIVITY */}

          <Link
            href="/library/activity"
            className="
              group
              rounded-2xl
              border
              p-6
              transition
              hover:-translate-y-1
              hover:shadow-lg
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >

            <div className="text-3xl">
              🕘
            </div>

            <h3 className="
              mt-4
              text-xl
              font-bold
              group-hover:underline
            ">
              Reading Activity
            </h3>

            <p className="
              mt-2
              text-sm
              opacity-65
            ">
              View your reading history and progress.
            </p>

            <p className="
              mt-5
              text-sm
              font-medium
              opacity-70
            ">
              View Activity →
            </p>

          </Link>

        </div>

      </section>

      {/* QUICK DISCOVERY */}

      <section
        className="
          mt-12
          rounded-2xl
          border
          p-6
          md:p-8
        "
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >

        <div className="
          flex
          flex-col
          sm:flex-row
          items-start
          sm:items-center
          justify-between
          gap-5
        ">

          <div>

            <h2 className="text-2xl font-bold">
              Looking for something new?
            </h2>

            <p className="
              mt-1
              opacity-65
            ">
              Discover more stories to add to your library.
            </p>

          </div>

          <Link
            href="/explore"
            className="
              rounded-xl
              border
              px-5
              py-3
              font-medium
              transition
              hover:-translate-y-0.5
            "
            style={{
              borderColor:
                "var(--card-border)",
            }}
          >
            Explore Stories →
          </Link>

        </div>

      </section>

    </main>
  );
}