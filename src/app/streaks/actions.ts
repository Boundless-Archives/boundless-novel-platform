"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { registerStreakDay } from "@/lib/streakEngine";
import { countWords } from "@/lib/wordCount";
import { MIN_STREAK_WORDS } from "@/lib/writing";
import { awardBadgeBySlug } from "@/lib/badgeAward";

async function syncQuests(userId: string) {
  try {
    const adminClient = createAdminClient();
    await adminClient.rpc("quest_sync", { p_user: userId });
  } catch (e) {
    console.error("Quest sync failed:", e);
  }
}

/*
 * Called when a reader opens a chapter. It tells the server "this
 * reader started this chapter now", which is what the later checks
 * (reading time, quests, streak) are measured against. Returns false
 * when the chapter doesn't count (a draft, or the reader's own).
 */
export async function startChapterRead(
  chapterId: string,
  timeZone?: string
) {
  if (typeof chapterId !== "string" || chapterId.length === 0) {
    return false;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return false;

  const adminClient = createAdminClient();

  const { data } = await adminClient.rpc("start_chapter_read", {
    p_user: user.id,
    p_chapter: chapterId,
    p_tz: timeZone ?? null,
  });

  return data === true;
}

/*
 * Called from the chapter reading page once a reader has spent enough
 * active time and reached the end of a chapter.
 *
 * The server only believes it if this reader really opened this
 * chapter at least ~90 seconds ago (see startChapterRead), so calling
 * it directly earns nothing.
 *
 * `localHour` and `timeZone` come from the reader's own browser:
 *  - "Night Owl" (finished a chapter between midnight and 4 AM)
 *    follows the reader's clock, and
 *  - the streak day rolls over at the reader's own midnight.
 */
export async function recordChapterCompletion(
  chapterId: string,
  localHour?: number,
  timeZone?: string
) {
  if (typeof chapterId !== "string" || chapterId.length === 0) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("finish_chapter_read", {
      p_user: user.id,
      p_chapter: chapterId,
    })
    .single();

  const check = data as { verified: boolean; counted: boolean } | null;

  if (error || !check?.verified) return null;

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

  const result = await registerStreakDay(user.id, "reader", timeZone);

  await syncQuests(user.id);

  // Repaint the navbar so the flame lights up the moment today counts.
  revalidatePath("/", "layout");

  return result;
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

  const { data: recent } = await supabase
    .from("chapters")
    .select("content, stories!inner ( author_id )")
    .eq("status", "Published")
    .eq("stories.author_id", user.id)
    .gte("published_at", since);

  // Only a real chapter keeps the streak: a short note doesn't.
  const qualifies = (recent ?? []).some(
    (c) => countWords(c.content ?? "") >= MIN_STREAK_WORDS
  );

  if (!qualifies) return null;

  const result = await registerStreakDay(user.id, "writer", timeZone);

  await syncQuests(user.id);

  return result;
}

type StreakRow = {
  current_streak: number;
  longest_streak: number;
  last_counted_date: string | null;
  // Streak Freezes the user holds for this streak type.
  freezes: number;
  // Has today (in the user's own timezone) already been counted?
  done_today: boolean;
};

/*
 * Get the current user's reader + writer streak state,
 * for display on their profile/dashboard.
 *
 * A streak that has been missed for more days than the user holds
 * Streak Freezes for (in the user's own time zone) is shown as 0
 * straight away, even before the hourly cleanup job has reset it in
 * the database. A streak that a freeze will cover stays alive.
 */
export async function getMyStreaks() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { reader: null, writer: null };
  }

  const [{ data }, { data: profile }, { data: items }] =
    await Promise.all([
      supabase.from("streaks").select("*").eq("user_id", user.id),
      supabase
        .from("profiles")
        .select("timezone")
        .eq("id", user.id)
        .maybeSingle(),
      supabase
        .from("user_items")
        .select("item_slug, quantity")
        .eq("user_id", user.id)
        .in("item_slug", [
          "streak-freeze-reader",
          "streak-freeze-writer",
        ]),
    ]);

  let today: string;

  try {
    today = new Date().toLocaleDateString("en-CA", {
      timeZone: profile?.timezone ?? "UTC",
    });
  } catch {
    today = new Date().toISOString().slice(0, 10);
  }

  const todayMs = Date.parse(`${today}T00:00:00Z`);

  function freezesFor(type: "reader" | "writer") {
    return (
      items?.find((i) => i.item_slug === `streak-freeze-${type}`)
        ?.quantity ?? 0
    );
  }

  function effective(
    row:
      | {
          current_streak: number;
          longest_streak: number;
          last_counted_date: string | null;
        }
      | undefined,
    freezes: number
  ): StreakRow | null {
    if (!row) {
      return freezes > 0
        ? {
            current_streak: 0,
            longest_streak: 0,
            last_counted_date: null,
            freezes,
            done_today: false,
          }
        : null;
    }

    let alive = false;

    if (row.last_counted_date) {
      const gapDays = Math.round(
        (todayMs - Date.parse(`${row.last_counted_date}T00:00:00Z`)) /
          86_400_000
      );

      // Days missed = gapDays - 1; each one needs a freeze.
      alive = gapDays - 1 <= freezes;
    }

    const doneToday = alive && row.last_counted_date === today;

    return alive
      ? { ...row, freezes, done_today: doneToday }
      : { ...row, current_streak: 0, freezes, done_today: false };
  }

  const reader = effective(
    data?.find((s) => s.streak_type === "reader"),
    freezesFor("reader")
  );

  const writer = effective(
    data?.find((s) => s.streak_type === "writer"),
    freezesFor("writer")
  );

  return { reader, writer };
}