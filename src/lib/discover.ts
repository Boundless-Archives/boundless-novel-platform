import { createClient } from "@/utils/supabase/server";
import { PUBLIC_STORY_STATUSES } from "@/lib/storyStatus";

export async function getTrendingStories() {
  const supabase = await createClient();

  const { data, error } = await supabase
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
        average_rating,
        last_activity_at
      )
    `)
    .in("status", PUBLIC_STORY_STATUSES);

  if (error) {
    console.error(error);
    return [];
  }

  const ranked =
    (data ?? []).sort((a: any, b: any) => {
      const aStats = a.story_stats?.[0];
      const bStats = b.story_stats?.[0];

      const aScore =
        (aStats?.views ?? 0) * 1 +
        (aStats?.likes ?? 0) * 5 +
        (aStats?.library_adds ?? 0) * 4 +
        (aStats?.reviews ?? 0) * 6 +
        (aStats?.average_rating ?? 0) * 20;

      const bScore =
        (bStats?.views ?? 0) * 1 +
        (bStats?.likes ?? 0) * 5 +
        (bStats?.library_adds ?? 0) * 4 +
        (bStats?.reviews ?? 0) * 6 +
        (bStats?.average_rating ?? 0) * 20;

      return bScore - aScore;
    });

  return ranked.slice(0, 10);
}

export async function getPopularStories() {
  const supabase = await createClient();

  const { data, error } = await supabase
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
        average_rating,
        last_activity_at
      )
    `)
    .in("status", PUBLIC_STORY_STATUSES);

  if (error) {
    console.error(error);
    return [];
  }

  const ranked =
    (data ?? []).sort((a: any, b: any) => {
      const aStats = a.story_stats?.[0];
      const bStats = b.story_stats?.[0];

      const aScore =
        (aStats?.views ?? 0) +
        (aStats?.library_adds ?? 0) * 3;

      const bScore =
        (bStats?.views ?? 0) +
        (bStats?.library_adds ?? 0) * 3;

      return bScore - aScore;
    });

  return ranked.slice(0, 10);
}