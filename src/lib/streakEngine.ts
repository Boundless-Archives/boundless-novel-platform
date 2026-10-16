import { createAdminClient } from "@/utils/supabase/admin";
import { awardCoins } from "@/lib/wallet";
import { checkAndAwardBadges } from "@/app/badges/actions";
import { getStreakReward, type StreakType } from "@/lib/streaks";

/*
 * Core streak engine. Server-side only.
 *
 * Lives in src/lib (NOT in a "use server" file) because it takes a
 * userId and pays out Embers: as a server action anyone could call it
 * for any user. The browser-facing entry points are in
 * src/app/streaks/actions.ts, and they work out the user for
 * themselves.
 *
 * A streak "day" is the user's own calendar day. `timeZone` is an IANA
 * name like "Africa/Lagos" (the database ignores anything invalid and
 * falls back to the zone it already has for the user).
 *
 * Idempotent per day: only the first call of a day advances the streak;
 * later calls that day are harmless no-ops. Embers are paid only when
 * the streak lands on a milestone day (see src/lib/streaks.ts).
 */
export async function registerStreakDay(
  userId: string,
  streakType: StreakType,
  timeZone?: string | null
) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("register_streak_day", {
      p_user_id: userId,
      p_streak_type: streakType,
      p_tz: timeZone ?? undefined,
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