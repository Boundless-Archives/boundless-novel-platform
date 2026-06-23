import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const { q } = await searchParams;

  const supabase = await createClient();

  let stories = [];

  if (q) {
    const { data } = await supabase
      .from("stories")
      .select("*")
      .neq("status", "Draft")
      .ilike("title", `%${q}%`)
      .order("created_at", {
        ascending: false,
      });

    stories = data ?? [];
  }

  return (
    <main className="p-10 max-w-5xl">
      <h1 className="text-4xl font-bold mb-6">
        Search Stories
      </h1>

      <form>
        <input
          name="q"
          defaultValue={q}
          placeholder="Search story titles..."
          className="border p-2 rounded w-full"
        />
      </form>

      <div className="mt-8 space-y-4">
        {stories.map((story) => (
          <div
            key={story.id}
            className="border rounded p-4"
          >
            <Link
              href={`/story/${story.slug}`}
              className="text-xl font-semibold underline"
            >
              {story.title}
            </Link>

            <p className="mt-2">
              {story.description}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}