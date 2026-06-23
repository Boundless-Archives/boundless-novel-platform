import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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

  if (story.status === "Draft") {
    notFound();
  }

  const { data: previousChapter } =
    await supabase
      .from("chapters")
      .select("*")
      .eq("story_id", chapter.story_id)
      .eq(
        "chapter_number",
        chapter.chapter_number - 1
      )
      .maybeSingle();

  const { data: nextChapter } =
    await supabase
      .from("chapters")
      .select("*")
      .eq("story_id", chapter.story_id)
      .eq(
        "chapter_number",
        chapter.chapter_number + 1
      )
      .maybeSingle();

  return (
    <main className="p-10 max-w-4xl">
      <h1 className="text-4xl font-bold">
        {chapter.title}
      </h1>

      <div className="mt-8 whitespace-pre-wrap">
        {chapter.content}
      </div>

      <div className="mt-12 flex gap-4">
        {previousChapter ? (
          <Link
            href={`/chapter/${previousChapter.id}`}
            className="border rounded px-4 py-2"
          >
            ← Previous Chapter
          </Link>
        ) : (
          <div />
        )}

        <Link
          href={`/story/${story.slug}`}
          className="border rounded px-4 py-2"
        >
          Back to Story
        </Link>

        {nextChapter ? (
          <Link
            href={`/chapter/${nextChapter.id}`}
            className="border rounded px-4 py-2"
          >
            Next Chapter →
          </Link>
        ) : (
          <div />
        )}
      </div>
    </main>
  );
}