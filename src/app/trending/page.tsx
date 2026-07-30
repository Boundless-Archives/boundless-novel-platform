import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import StoryGrid from "@/components/story/StoryGrid";
import SectionHeader from "@/components/layout/SectionHeader";
import EmptyState from "@/components/layout/EmptyState";

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

      <SectionHeader
        icon="🔥"
        title="Trending"
        description="Stories readers can't stop talking about. Ranked using community engagement across the platform."
      />

      {!rankedStories.length ? (

        <EmptyState
          icon="🔥"
          title="No trending stories yet"
          description="Once readers begin engaging with stories, they'll appear here."
        />

      ) : (

        <StoryGrid
          stories={rankedStories}
          variant="ranking"
        />

      )}

    </main>
  );
}