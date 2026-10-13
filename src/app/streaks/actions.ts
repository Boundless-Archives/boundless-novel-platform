"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { awardCoins } from "@/app/wallet/actions";
import { checkAndAwardBadges } from "@/app/badges/actions";
import { getStreakReward } from "@/lib/streaks";

/*
 * Core streak engine. Call this any time a user does the
 * qualifying action for a streak type (finished a chapter
 * read, published a chapter). Idempotent per UTC day — only
 * the first call of the day actually advances the streak and
 * pays out a reward; later calls that day are harmless no-ops.
 */
export async function registerStreakDay(
  userId: string,
  streakType: "reader" | "writer"
) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("register_streak_day", {
      p_user_id: userId,
      p_streak_type: streakType,
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const result = data as {
    new_streak: number;
    is_new_day: boolean;
  };

  if (result.is_new_day) {
    const reward = getStreakReward(streakType, result.new_streak);

    if (reward > 0) {
      await awardCoins(
        userId,
        reward,
        "streak_reward",
        `${
          streakType === "reader" ? "Reader" : "Writer"
        } streak milestone — ${result.new_streak} days`
      );
    }

    await checkAndAwardBadges(userId);
  }

  return result;
}

/*
 * Called from the chapter reading page once a reader has
 * spent enough active time and reached the end of a chapter.
 */
export async function recordChapterCompletion() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return registerStreakDay(user.id, "reader");
}

/*
 * Get the current user's reader + writer streak state,
 * for display on their profile/dashboard.
 */
export async function getMyStreaks() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { reader: null, writer: null };
  }

  const { data } = await supabase
    .from("streaks")
    .select("*")
    .eq("user_id", user.id);

  const reader =
    data?.find((s) => s.streak_type === "reader") ?? null;

  const writer =
    data?.find((s) => s.streak_type === "writer") ?? null;

  return { reader, writer };
}