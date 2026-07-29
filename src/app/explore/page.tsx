import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import StoryGrid from "@/components/story/StoryGrid";

export default async function ExplorePage() {
  const supabase = await createClient();

  const { data: stories } = await supabase
    .from("stories")
    .select(`
      *,
      profiles (
        username,
        display_name
      ),
      story_stats (
        views,
        likes,
        library_adds,
        reviews,
        average_rating
      )
    `)
    .neq("status", "Draft")
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">

      <section className="mb-12">

        <h1 className="text-5xl font-bold">
          Explore
        </h1>

        <p
          className="
            mt-4
            max-w-3xl
            text-lg
            opacity-80
          "
        >
          Discover fresh adventures, hidden gems,
          and stories waiting to become your next
          obsession.
        </p>

      </section>

      {!stories?.length ? (

        <div
          className="
            rounded-2xl
            border
            p-12
            text-center
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >

          <div className="text-6xl mb-5">
            📚
          </div>

          <h2 className="text-3xl font-bold">
            Nothing here yet
          </h2>

          <p className="mt-4 opacity-70">
            New stories will appear here soon.
          </p>

        </div>

      ) : (

        <StoryGrid
          stories={stories}
        />

      )}

    </main>
  );
}