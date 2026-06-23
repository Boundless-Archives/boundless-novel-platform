import Image from "next/image";
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

  if (story.status === "Draft") {
    notFound();
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", story.id)
    .order("chapter_number");

  return (
    <main className="p-10 max-w-4xl">
    {story.cover_url && (
      <Image
        src={story.cover_url}
        alt={story.title}
        width={250}
        height={375}
        className="rounded mb-6"
      />
    )}
    
    <h1 className="text-4xl font-bold">
        {story.title}
      </h1>

      <div className="mt-4 space-y-2">
        <p>
          <strong>Status:</strong>{" "}
          {story.status}
        </p>

        <p>
          <strong>Chapters:</strong>{" "}
          {chapters?.length ?? 0}
        </p>
      </div>

      <p className="mt-6">
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