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

  <main className="max-w-5xl mx-auto px-6 py-10">

```
<div className="text-center">

  <Link
    href={`/story/${story.slug}`}
    className="
      text-sm
      opacity-70
      hover:underline
      hover:text-cyan-400
    "
  >
    {story.title}
  </Link>

  <h1 className="text-4xl font-bold mt-2">
    Chapter {chapter.chapter_number}
  </h1>

  <h2 className="text-2xl mt-3 opacity-90">
    {chapter.title}
  </h2>

</div>

<article
  className="
    mt-12
    mx-auto
    max-w-2xl
    text-lg
    leading-10
    whitespace-pre-wrap
  "
>
  {chapter.content}

  <p
    className="
      mt-16
      text-center
      text-sm
      opacity-60
    "
  >
    End of Chapter
  </p>
</article>

<div
  className="
    mt-16
    border-t
    pt-8
    flex
    justify-between flex-wrap
    items-center
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
          border
          rounded-lg
          px-4
          py-2
          transition
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
      border
      rounded-lg
      px-4
      py-2
      transition
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
          border
          rounded-lg
          px-4
          py-2
          transition
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

</div>
```

  </main>
);
}