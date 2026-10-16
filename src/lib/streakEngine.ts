import { createAdminClient } from "@/utils/supabase/admin";
import { awardSparks } from "@/lib/sparks";
import { checkAndAwardBadges } from "@/app/badges/actions";
import { getStreakReward, type StreakType } from "@/lib/streaks";

/*
 * Core streak engine. Server-side only.
 *
 * Lives in src/lib (NOT in a "use server" file) because it takes a
 * userId and pays out Sparks: as a server action anyone could call it
 * for any user. The browser-facing entry points are in
 * src/app/streaks/actions.ts, and they work out the user for
 * themselves.
 *
 * A streak "day" is the user's own calendar day. `timeZone` is an IANA
 * name like "Africa/Lagos" (the database ignores anything invalid and
 * falls back to the zone it already has for the user).
 *
 * Idempotent per day: only the first call of a day advances the streak;
 * later calls that day are harmless no-ops. Sparks are paid only when
 * the streak lands on a milestone day (see src/lib/streaks.ts).
 *
 * Missed days are covered automatically by Streak Freezes the user
 * holds (the database does this); when that happens we tell the user.
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
    freezes_used: number;
  };

  if (result.is_new_day) {
    if (result.freezes_used > 0) {
      const { error: notifyError } = await adminClient
        .from("notifications")
        .insert({
          user_id: userId,
          type: "system",
          title: "Streak Freeze used",
          message: `You missed ${
            result.freezes_used === 1
              ? "a day"
              : `${result.freezes_used} days`
          }, so ${
            result.freezes_used === 1
              ? "a Streak Freeze"
              : `${result.freezes_used} Streak Freezes`
          } kept your ${streakType} streak alive at ${
            result.new_streak
          } days.`,
          link: "/shop",
        });

      if (notifyError) {
        console.error(
          "Streak freeze notification failed:",
          notifyError.message
        );
      }
    }

    const reward = getStreakReward(streakType, result.new_streak);

    if (reward > 0) {
      await awardSparks(
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