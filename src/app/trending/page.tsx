import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import StoryGrid from "@/components/story/StoryGrid";

export default async function TrendingPage() {
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
    .neq("status", "Draft");

  const rankedStories =
    (stories ?? [])
      .map((story: any) => {
        const stats = story.story_stats;

        const score =
          (stats?.views ?? 0) +
          (stats?.likes ?? 0) * 5 +
          (stats?.library_adds ?? 0) * 8 +
          (stats?.reviews ?? 0) * 10;

        return {
          ...story,
          trendingScore: score,
        };
      })
      .sort(
        (a, b) =>
          b.trendingScore -
          a.trendingScore
      );

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">

      <section className="mb-12">

        <div className="flex items-center gap-3">

          <span className="text-5xl">
            🔥
          </span>

          <h1 className="text-5xl font-bold">
            Trending
          </h1>

        </div>

        <p
          className="
            mt-4
            max-w-3xl
            text-lg
            opacity-80
          "
        >
          Stories readers can't stop talking about.
          Ranked using community engagement across
          the platform.
        </p>

      </section>

      {!rankedStories.length ? (

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
            🔥
          </div>

          <h2 className="text-3xl font-bold">
            No trending stories yet
          </h2>

          <p className="mt-4 opacity-70">
            Once readers begin engaging with
            stories, they'll appear here.
          </p>

        </div>

      ) : (

        <StoryGrid
          stories={rankedStories}
          variant="ranking"
        />

      )}

    </main>
  );
}