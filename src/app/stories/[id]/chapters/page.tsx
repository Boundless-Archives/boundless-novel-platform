import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChaptersPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (!story) {
    notFound();
  }

  if (story.author_id !== user.id) {
    redirect("/stories");
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", id)
    .order("chapter_number");

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold">
        {story.title}
      </h1>

      <p className="mt-2">
        Manage Chapters
      </p>

      <div className="mt-6">
        <Link
          href={`/stories/${id}/chapters/new`}
          className="border rounded px-4 py-2"
        >
          Create Chapter
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {chapters?.length === 0 && (
          <p>No chapters yet.</p>
        )}

        {chapters?.map((chapter) => (
          <div
            key={chapter.id}
            className="border rounded p-4"
          >
            <h2 className="font-semibold">
              Chapter {chapter.chapter_number}
            </h2>

            <p>{chapter.title}</p>
          </div>
        ))}
      </div>
    </main>
  );
}