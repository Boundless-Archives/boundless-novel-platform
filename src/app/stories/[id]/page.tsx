import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StoryPage({
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

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold">
        {story.title}
      </h1>

      <p className="mt-4">
        Status: {story.status}
      </p>

      <div className="mt-6">
        <p>{story.description}</p>
      </div>

      <div className="mt-8 flex gap-4">
        <Link
          href={`/stories/${story.id}/edit`}
          className="border rounded px-4 py-2"
        >
          Edit Story
        </Link>

        <Link
          href={`/stories/${story.id}/chapters`}
          className="border rounded px-4 py-2"
        >
          Manage Chapters
        </Link>

        <Link
          href={`/story/${story.slug}`}
          className="border rounded px-4 py-2"
        >
          View Public Story
        </Link>
      </div>
    </main>
  );
}