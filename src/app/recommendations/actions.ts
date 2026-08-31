"use server";

import { createClient } from "@/utils/supabase/server";

export async function getPersonalizedRecommendations(
  limit: number = 12
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  /*
   * Get reading history.
   *
   * More recent activity receives more weight.
   */
  const { data: history } = await supabase
    .from("reading_history")
    .select("story_id, last_read_at")
    .eq("user_id", user.id)
    .order("last_read_at", {
      ascending: false,
    });

  /*
   * Get stories saved in the library.
   */
  const { data: library } = await supabase
    .from("library")
    .select("story_id")
    .eq("user_id", user.id);

  const historyStoryIds =
    history?.map((item) => item.story_id) ?? [];

  const libraryStoryIds =
    library?.map((item) => item.story_id) ?? [];

  /*
   * Stories already read or saved should not
   * appear as recommendations.
   */
  const excludedStoryIds = [
    ...new Set([
      ...historyStoryIds,
      ...libraryStoryIds,
    ]),
  ];

  /*
   * Build the user's genre preferences.
   *
   * Reading activity is weighted more strongly
   * than simply saving a story.
   */
  const genreWeights =
    new Map<string, number>();

  /*
   * Build the user's tag preferences.
   */
  const tagWeights =
    new Map<string, number>();

  /*
   * Genres/tags from reading history.
   */
  if (historyStoryIds.length > 0) {
    const { data: historyGenres } =
      await supabase
        .from("story_genres")
        .select("story_id, genre_id")
        .in(
          "story_id",
          historyStoryIds
        );

    const { data: historyTags } =
      await supabase
        .from("story_tags")
        .select("story_id, tag_id")
        .in(
          "story_id",
          historyStoryIds
        );

    /*
     * Each reading event contributes a weight.
     *
     * Recent reads are worth more than old reads.
     */
    history?.forEach((item) => {
      const lastRead =
        item.last_read_at
          ? new Date(
              item.last_read_at
            ).getTime()
          : Date.now();

      const ageInDays =
        Math.max(
          0,
          (Date.now() - lastRead) /
            86400000
        );

      const recencyWeight =
        Math.max(
          1,
          6 - ageInDays / 30
        );

      historyGenres
        ?.filter(
          (row) =>
            row.story_id ===
            item.story_id
        )
        .forEach((row) => {
          genreWeights.set(
            row.genre_id,
            (genreWeights.get(
              row.genre_id
            ) ?? 0) +
              recencyWeight
          );
        });

      historyTags
        ?.filter(
          (row) =>
            row.story_id ===
            item.story_id
        )
        .forEach((row) => {
          tagWeights.set(
            row.tag_id,
            (tagWeights.get(
              row.tag_id
            ) ?? 0) +
              recencyWeight
          );
        });
    });
  }

  /*
   * Saved stories contribute a smaller preference
   * signal than stories the user actually reads.
   */
  if (libraryStoryIds.length > 0) {
    const { data: libraryGenres } =
      await supabase
        .from("story_genres")
        .select("story_id, genre_id")
        .in(
          "story_id",
          libraryStoryIds
        );

    const { data: libraryTags } =
      await supabase
        .from("story_tags")
        .select("story_id, tag_id")
        .in(
          "story_id",
          libraryStoryIds
        );

    libraryGenres?.forEach((row) => {
      genreWeights.set(
        row.genre_id,
        (genreWeights.get(
          row.genre_id
        ) ?? 0) + 2
      );
    });

    libraryTags?.forEach((row) => {
      tagWeights.set(
        row.tag_id,
        (tagWeights.get(
          row.tag_id
        ) ?? 0) + 1
      );
    });
  }

  /*
   * Get candidate stories.
   */
  let storyQuery = supabase
    .from("stories")
    .select(`
      id,
      title,
      slug,
      description,
      cover_url,
      status,
      created_at
    `)
    .neq("status", "Draft")
    .order("created_at", {
      ascending: false,
    })
    .limit(100);

  if (excludedStoryIds.length > 0) {
    storyQuery = storyQuery.not(
      "id",
      "in",
      `(${excludedStoryIds.join(",")})`
    );
  }

  const {
    data: stories,
    error,
  } = await storyQuery;

  if (error) {
    throw new Error(error.message);
  }

  if (!stories?.length) {
    return [];
  }

  /*
   * Get genres and tags belonging to candidates.
   */
  const candidateIds =
    stories.map(
      (story) => story.id
    );

  const { data: candidateGenres } =
    await supabase
      .from("story_genres")
      .select(
        "story_id, genre_id"
      )
      .in(
        "story_id",
        candidateIds
      );

  const { data: candidateTags } =
    await supabase
      .from("story_tags")
      .select(
        "story_id, tag_id"
      )
      .in(
        "story_id",
        candidateIds
      );

  /*
   * Score candidates.
   *
   * Genre preference:
   *   user's genre weight × 3
   *
   * Tag preference:
   *   user's tag weight × 2
   *
   * Freshness:
   *   small bonus for newer stories
   */
  const now = Date.now();

  const scoredStories =
    stories.map((story) => {
      const storyGenreRows =
        candidateGenres?.filter(
          (row) =>
            row.story_id ===
            story.id
        ) ?? [];

      const storyTagRows =
        candidateTags?.filter(
          (row) =>
            row.story_id ===
            story.id
        ) ?? [];

      const genreScore =
        storyGenreRows.reduce(
          (total, row) =>
            total +
            (genreWeights.get(
              row.genre_id
            ) ?? 0) *
              3,
          0
        );

      const tagScore =
        storyTagRows.reduce(
          (total, row) =>
            total +
            (tagWeights.get(
              row.tag_id
            ) ?? 0) *
              2,
          0
        );

      /*
       * Freshness bonus is intentionally small
       * so relevance remains more important.
       */
      const ageInDays =
        Math.max(
          0,
          (now -
            new Date(
              story.created_at
            ).getTime()) /
            86400000
        );

      const freshnessBonus =
        Math.max(
          0,
          2 -
            ageInDays / 30
        );

      const score =
        genreScore +
        tagScore +
        freshnessBonus;

      return {
        ...story,
        recommendation_score:
          score,
      };
    });

  /*
   * Highest personalized relevance first.
   */
  scoredStories.sort(
    (a, b) => {
      if (
        b.recommendation_score !==
        a.recommendation_score
      ) {
        return (
          b.recommendation_score -
          a.recommendation_score
        );
      }

      /*
       * If two stories have the same score,
       * prefer the newer one.
       */
      return (
        new Date(
          b.created_at
        ).getTime() -
        new Date(
          a.created_at
        ).getTime()
      );
    }
  );

  return scoredStories.slice(
    0,
    limit
  );
}