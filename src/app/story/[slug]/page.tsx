import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicStoryPage({
  params,
}: Props) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("slug", slug)
    .single();

  if (!story) {
    notFound();
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", story.id)
    .order("chapter_number");

  return (
    <main className="p-10 max-w-4xl">
      <h1 className="text-4xl font-bold">
        {story.title}
      </h1>

      <p className="mt-4">
        {story.description}
      </p>

      <div className="mt-8">
        <h2 className="text-2xl font-semibold">
          Chapters
        </h2>

        <div className="mt-4 space-y-2">
          {chapters?.map((chapter) => (
            <div key={chapter.id}>
              <Link
                href={`/chapter/${chapter.id}`}
                className="underline"
              >
                Chapter {chapter.chapter_number}:{" "}
                {chapter.title}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}