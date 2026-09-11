"use server";

import { createClient } from "@/utils/supabase/server";

/*
 * Checks the given user's stats against every
 * achievement-type badge condition, and awards
 * any badge they've newly earned. Safe to call
 * often — already-awarded badges are skipped.
 *
 * Call this after any action that could complete
 * a badge condition (publishing a chapter, creating
 * an entity, a tier upgrade, an accepted crossover).
 */
export async function checkAndAwardBadges(userId: string) {
  const supabase = await createClient();

  const { data: achievementBadges } = await supabase
    .from("badges")
    .select("id, slug")
    .eq("badge_type", "achievement")
    .not("slug", "is", null);

  if (!achievementBadges || achievementBadges.length === 0) {
    return [];
  }

  const { data: alreadyAwarded } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  const alreadyAwardedIds = new Set(
    (alreadyAwarded ?? []).map((row) => row.badge_id)
  );

  const badgesBySlug = new Map(
    achievementBadges
      .filter((badge) => !alreadyAwardedIds.has(badge.id))
      .map((badge) => [badge.slug as string, badge.id])
  );

  if (badgesBySlug.size === 0) {
    return [];
  }

  const earnedSlugs: string[] = [];

  // storyteller — published at least one story
  if (badgesBySlug.has("storyteller")) {
    const { count } = await supabase
      .from("stories")
      .select("id", { count: "exact", head: true })
      .eq("author_id", userId)
      .neq("status", "Draft");

    if ((count ?? 0) >= 1) earnedSlugs.push("storyteller");
  }

  // first_chapter / prolific_writer — published chapter counts
  if (
    badgesBySlug.has("first_chapter") ||
    badgesBySlug.has("prolific_writer")
  ) {
    const { data: myStories } = await supabase
      .from("stories")
      .select("id")
      .eq("author_id", userId);

    const storyIds = (myStories ?? []).map((s) => s.id);

    let publishedChapterCount = 0;

    if (storyIds.length > 0) {
      const { count } = await supabase
        .from("chapters")
        .select("id", { count: "exact", head: true })
        .in("story_id", storyIds)
        .eq("status", "Published");

      publishedChapterCount = count ?? 0;
    }

    if (
      badgesBySlug.has("first_chapter") &&
      publishedChapterCount >= 1
    ) {
      earnedSlugs.push("first_chapter");
    }

    if (
      badgesBySlug.has("prolific_writer") &&
      publishedChapterCount >= 10
    ) {
      earnedSlugs.push("prolific_writer");
    }
  }

  // world_builder / archivist — entity counts in the user's universe
  if (
    badgesBySlug.has("world_builder") ||
    badgesBySlug.has("archivist")
  ) {
    const { data: universe } = await supabase
      .from("universes")
      .select("id")
      .eq("owner_id", userId)
      .eq("multiverse", "telos")
      .maybeSingle();

    if (universe) {
      const { count } = await supabase
        .from("entities")
        .select("id", { count: "exact", head: true })
        .eq("universe_id", universe.id);

      const entityCount = count ?? 0;

      if (
        badgesBySlug.has("world_builder") &&
        entityCount >= 1
      ) {
        earnedSlugs.push("world_builder");
      }

      if (badgesBySlug.has("archivist") && entityCount >= 10) {
        earnedSlugs.push("archivist");
      }
    }
  }

  // rising_star / canon_maker — highest tier reached
  if (
    badgesBySlug.has("rising_star") ||
    badgesBySlug.has("canon_maker")
  ) {
    const { data: tierStories } = await supabase
      .from("stories")
      .select("canon_tier")
      .eq("author_id", userId);

    const tiers = new Set(
      (tierStories ?? []).map((s) => s.canon_tier)
    );

    if (
      badgesBySlug.has("rising_star") &&
      (tiers.has("A") || tiers.has("S"))
    ) {
      earnedSlugs.push("rising_star");
    }

    if (badgesBySlug.has("canon_maker") && tiers.has("S")) {
      earnedSlugs.push("canon_maker");
    }
  }

  // crossover_pioneer — first accepted crossover, either direction
  if (badgesBySlug.has("crossover_pioneer")) {
    const { count } = await supabase
      .from("crossover_requests")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requested_by.eq.${userId},target_author_id.eq.${userId}`);

    if ((count ?? 0) >= 1) {
      earnedSlugs.push("crossover_pioneer");
    }
  }

  const uniqueEarnedSlugs = Array.from(new Set(earnedSlugs));

  if (uniqueEarnedSlugs.length === 0) {
    return [];
  }

  const rowsToInsert = uniqueEarnedSlugs
    .map((slug) => badgesBySlug.get(slug))
    .filter((badgeId): badgeId is string => Boolean(badgeId))
    .map((badgeId) => ({
      user_id: userId,
      badge_id: badgeId,
      awarded_at: new Date().toISOString(),
    }));

  if (rowsToInsert.length === 0) {
    return [];
  }

  const { error } = await supabase
    .from("user_badges")
    .insert(rowsToInsert);

  if (error) {
    // Don't let a badge-award failure break the action
    // that triggered this check.
    console.error("Badge award failed:", error.message);
    return [];
  }

  const { data: newBadgeDetails } = await supabase
    .from("badges")
    .select("name")
    .in(
      "id",
      rowsToInsert.map((row) => row.badge_id)
    );

  if (newBadgeDetails && newBadgeDetails.length > 0) {
    await supabase.from("notifications").insert(
      newBadgeDetails.map((badge) => ({
        user_id: userId,
        type: "badge_earned",
        title: "New badge earned!",
        message: `You've earned the "${badge.name}" badge.`,
        link: "/profile",
      }))
    );
  }

  return uniqueEarnedSlugs;
}