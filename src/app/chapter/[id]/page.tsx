import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

import CommentForm from "@/components/chapter/CommentForm";
import CommentList from "@/components/chapter/CommentList";
import ReadingProgress from "@/components/chapter/ReadingProgress";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChapterPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: chapter } = await supabase
    .from("chapters")
    .select("*")
    .eq("id", id)
    .single();

  if (!chapter) {
    notFound();
  }

  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", chapter.story_id)
    .single();

  if (!story) {
    notFound();
  }

  let crossoverBanner: {
    counterpartTitle: string;
    counterpartSlug: string;
  } | null = null;

  if (chapter.crossover_request_id) {
    const { data: crossoverRequest } = await supabase
      .from("crossover_requests")
      .select(
        `
        requesting_story_id,
        target_story_id,
        requesting_story:requesting_story_id ( title, slug ),
        target_story:target_story_id ( title, slug )
      `
      )
      .eq("id", chapter.crossover_request_id)
      .maybeSingle();

    if (crossoverRequest) {
      const isRequester =
        crossoverRequest.requesting_story_id === story.id;

      const counterpart = isRequester
        ? crossoverRequest.target_story
        : crossoverRequest.requesting_story;

      const counterpartInfo = Array.isArray(counterpart)
        ? counterpart[0]
        : counterpart;

      if (counterpartInfo) {
        crossoverBanner = {
          counterpartTitle: counterpartInfo.title,
          counterpartSlug: counterpartInfo.slug,
        };
      }
    }
  }

  if (story.status === "Draft") {
    notFound();
  }

  if (user) {
    await supabase
      .from("reading_history")
      .upsert(
        {
          user_id: user.id,
          story_id: story.id,
          chapter_id: chapter.id,
          last_read_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,story_id",
        }
      );
  }

  const { data: previousChapter } =
    await supabase
      .from("chapters")
      .select("*")
      .eq("story_id", story.id)
      .eq(
        "chapter_number",
        chapter.chapter_number - 1
      )
      .maybeSingle();

  const { data: nextChapter } =
    await supabase
      .from("chapters")
      .select("*")
      .eq("story_id", story.id)
      .eq(
        "chapter_number",
        chapter.chapter_number + 1
      )
      .maybeSingle();

  const { data: comments } =
    await supabase
      .from("chapter_comments")
      .select("*")
      .eq("chapter_id", chapter.id)
      .order("created_at", {
        ascending: false,
      });

  const profileIds = [
    ...new Set(
      (comments ?? []).map(
        (comment) => comment.user_id
      )
    ),
  ];

  const { data: profileRows } =
    profileIds.length > 0
      ? await supabase
          .from("profiles")
          .select(`
            id,
            username,
            display_name
          `)
          .in("id", profileIds)
      : {
          data: [],
        };

  const profiles = new Map(
    (profileRows ?? []).map((profile) => [
      profile.id,
      {
        username: profile.username,
        display_name:
          profile.display_name,
      },
    ])
  );

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">

      <ReadingProgress
        storyId={story.id}
        chapterId={chapter.id}
      />

      <header className="text-center">

        <Link
          href={`/story/${story.slug}`}
          className="
            text-sm
            opacity-70
            hover:text-cyan-400
            transition
          "
        >
          ← {story.title}
        </Link>

        <h1 className="mt-5 text-5xl font-bold">
          Chapter {chapter.chapter_number}
        </h1>

        <p className="mt-4 text-2xl opacity-85">
          {chapter.title}
        </p>

      </header>

      {crossoverBanner && (
        <div
          className="
            mx-auto
            mt-8
            max-w-3xl
            rounded-xl
            border
            p-4
            text-center
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <p className="text-sm opacity-80">
            🌐 This chapter is part of a crossover with{" "}
            <Link
              href={`/story/${crossoverBanner.counterpartSlug}`}
              className="underline font-semibold"
            >
              {crossoverBanner.counterpartTitle}
            </Link>
          </p>
        </div>
      )}

      <article
        id="chapter-reading-content"
        className="
          mx-auto
          mt-16
          max-w-3xl
          text-lg
          leading-10
          whitespace-pre-wrap
        "
      >
        <div
          dangerouslySetInnerHTML={{
            __html: chapter.content,
          }}
        />

        <p
          className="
            mt-20
            text-center
            text-sm
            opacity-60
          "
        >
          End of Chapter
        </p>
      </article>

      <section
        className="
          mt-20
          border-t
          pt-8
          flex
          flex-wrap
          items-center
          justify-between
          gap-4
        "
        style={{
          borderColor: "var(--card-border)",
        }}
      >

        <div>

          {previousChapter && (
            <Link
              href={`/chapter/${previousChapter.id}`}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                px-5
                py-3
                transition
                hover:-translate-y-0.5
                hover:shadow-md
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            >
              ← Previous
            </Link>
          )}

        </div>

        <Link
          href={`/story/${story.slug}`}
          className="
            rounded-xl
            border
            px-5
            py-3
            transition
            hover:-translate-y-0.5
            hover:shadow-md
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Back to Story
        </Link>

        <div>

          {nextChapter && (
            <Link
              href={`/chapter/${nextChapter.id}`}
              className="
                inline-flex
                items-center
                gap-2
                rounded-xl
                border
                px-5
                py-3
                transition
                hover:-translate-y-0.5
                hover:shadow-md
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            >
              Next →
            </Link>
          )}

        </div>

      </section>

      <section className="mt-20">

        <div className="flex items-center justify-between">

          <h2 className="text-3xl font-bold">
            Discussion
          </h2>

          <span className="opacity-70">
            {(comments ?? []).length} Comment
            {(comments?.length ?? 0) === 1
              ? ""
              : "s"}
          </span>

        </div>

        {user && (
          <div className="mt-8">
            <CommentForm
              chapterId={chapter.id}
            />
          </div>
        )}

        {!user && (
          <div
            className="
              mt-8
              rounded-xl
              border
              p-6
              text-center
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >

            <p className="opacity-80">
              Join the discussion by
              <Link
                href="/auth/login"
                className="ml-1 underline"
              >
                signing in
              </Link>.
            </p>

          </div>
        )}

        <div className="mt-10">
          <CommentList
            chapterId={chapter.id}
            currentUserId={user?.id}
            comments={comments ?? []}
            profiles={profiles}
          />
        </div>

      </section>
    </main>
  );
}