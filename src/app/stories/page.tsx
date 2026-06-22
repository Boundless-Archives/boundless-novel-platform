import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function StoriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_author")
    .eq("id", user.id)
    .single();

  if (!profile?.is_author) {
    redirect("/profile");
  }

  const { data: stories } = await supabase
    .from("stories")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold">
        My Stories
      </h1>

      <div className="mt-6">
        <Link
          href="/stories/new"
          className="border rounded px-4 py-2"
        >
          Create New Story
        </Link>
      </div>

      <div className="mt-8 space-y-4">
        {stories?.length === 0 && (
          <p>No stories yet.</p>
        )}

        {stories?.map((story) => (
          <div
            key={story.id}
            className="border rounded p-4"
          >
            <Link
              href={`/stories/${story.id}`}
              className="text-xl font-semibold underline"
            >
              {story.title}
            </Link>

            <p className="mt-2">
              Status: {story.status}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}