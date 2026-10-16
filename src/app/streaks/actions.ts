"use server";

import { createClient } from "@/utils/supabase/server";
import { registerStreakDay } from "@/lib/streakEngine";
import { awardBadgeBySlug } from "@/lib/badgeAward";

/*
 * Called from the chapter reading page once a reader has
 * spent enough active time and reached the end of a chapter.
 *
 * `localHour` and `timeZone` come from the reader's own browser:
 *  - "Night Owl" (finished a chapter between midnight and 4 AM)
 *    follows the reader's clock, and
 *  - the streak day rolls over at the reader's own midnight.
 */
export async function recordChapterCompletion(
  localHour?: number,
  timeZone?: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  if (
    typeof localHour === "number" &&
    Number.isInteger(localHour) &&
    localHour >= 0 &&
    localHour < 4
  ) {
    try {
      await awardBadgeBySlug(user.id, "night_owl");
    } catch (e) {
      console.error("Night Owl badge failed:", e);
    }
  }

  return registerStreakDay(user.id, "reader", timeZone);
}

/*
 * Called by the new-chapter and edit-chapter pages right after a
 * chapter is published. Only counts if this user really has a chapter
 * they published in the last 30 minutes, so it can't be called on its
 * own to collect streak days.
 */
export async function registerMyWriterStreak(timeZone?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const since = new Date(Date.now() - 30 * 60 * 1000).toISOString();

  const { count } = await supabase
    .from("chapters")
    .select("id, stories!inner ( author_id )", {
      count: "exact",
      head: true,
    })
    .eq("status", "Published")
    .eq("stories.author_id", user.id)
    .gte("published_at", since);

  if ((count ?? 0) < 1) return null;

  return registerStreakDay(user.id, "writer", timeZone);
}

/*
 * Get the current user's reader + writer streak state,
 * for display on their profile/dashboard.
 *
 * A streak that wasn't continued yesterday (in the user's own time
 * zone) is shown as 0 straight away, even before the hourly cleanup
 * job has reset it in the database.
 */
export async function getMyStreaks() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { reader: null, writer: null };
  }

  const [{ data }, { data: profile }] = await Promise.all([
    supabase.from("streaks").select("*").eq("user_id", user.id),
    supabase
      .from("profiles")
      .select("timezone")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  let today: string;

  try {
    today = new Date().toLocaleDateString("en-CA", {
      timeZone: profile?.timezone ?? "UTC",
    });
  } catch {
    today = new Date().toISOString().slice(0, 10);
  }

  const yesterday = new Date(`${today}T00:00:00Z`);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  function effective<
    T extends {
      current_streak: number;
      last_counted_date: string | null;
    },
  >(row: T | undefined) {
    if (!row) return null;

    const alive =
      row.last_counted_date !== null &&
      row.last_counted_date >= yesterdayStr;

    return alive ? row : { ...row, current_streak: 0 };
  }

  const reader = effective(
    data?.find((s) => s.streak_type === "reader")
  );

  const writer = effective(
    data?.find((s) => s.streak_type === "writer")
  );

  return { reader, writer };
}