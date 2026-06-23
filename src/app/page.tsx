import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: stories } = await supabase
    .from("stories")
    .select("*")
    .neq("status", "Draft")
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="p-10 max-w-5xl">
      <h1 className="text-5xl font-bold">
        Boundless
      </h1>

      <p className="mt-4">
        Discover stories from the Boundless
        community.
      </p>

      <form
        action="/search"
        className="mt-6"
      >
        <input
          name="q"
          placeholder="Search stories..."
          className="border p-2 rounded w-full"
        />
      </form>

      <div className="mt-10 space-y-6">
        {stories?.map((story) => (
          <div
            key={story.id}
            className="border rounded p-4"
          >

            {story.cover_url && (
              <Image
                src={story.cover_url}
                alt={story.title}
                width={200}
                height={300}
                className="rounded mb-4"
              />
            )}

            <Link
              href={`/story/${story.slug}`}
              className="text-2xl font-semibold underline"
            >
              {story.title}
            </Link>

            <p className="mt-2">
              Status: {story.status}
            </p>

            <p className="mt-2">
              {story.description}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}