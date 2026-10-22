import type { SupabaseClient } from "@supabase/supabase-js";
import { countWords } from "@/lib/wordCount";

export type WritingProgress = {
  dailyGoal: number | null;
  weeklyGoal: number | null;
  wordsToday: number;
  wordsWeek: number;
  chaptersWeek: number;
  timeZone: string;
};

function localDate(ts: string | number | Date, timeZone: string) {
  return new Date(ts).toLocaleDateString("en-CA", { timeZone });
}

function safeZone(zone: string | null | undefined) {
  try {
    if (zone) {
      new Intl.DateTimeFormat("en-US", { timeZone: zone });
      return zone;
    }
  } catch {
    /* fall through */
  }
  return "UTC";
}

/*
 * Words the author has published today and this week (Monday to Sunday),
 * in their own time zone, next to the goals they set.
 */
export async function getWritingProgress(
  supabase: SupabaseClient,
  userId: string
): Promise<WritingProgress> {
  const [{ data: goals }, { data: profile }] = await Promise.all([
    supabase
      .from("writing_goals")
      .select("daily_words, weekly_words")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase.from("profiles").select("timezone").eq("id", userId).maybeSingle(),
  ]);

  const timeZone = safeZone(profile?.timezone);
  const today = localDate(Date.now(), timeZone);

  // Monday of this week, as a YYYY-MM-DD string.
  const weekday = new Date().toLocaleDateString("en-US", {
    timeZone,
    weekday: "short",
  });
  const back = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].indexOf(weekday);
  const monday = new Date(`${today}T00:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - Math.max(0, back));
  const weekStart = monday.toISOString().slice(0, 10);

  // Look back 8 days so the time-zone edges are covered, then filter.
  const since = new Date(Date.now() - 8 * 86400000).toISOString();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("content, published_at, stories!inner ( author_id )")
    .eq("status", "Published")
    .eq("stories.author_id", userId)
    .gte("published_at", since);

  let wordsToday = 0;
  let wordsWeek = 0;
  let chaptersWeek = 0;

  for (const c of chapters ?? []) {
    if (!c.published_at) continue;
    const day = localDate(c.published_at, timeZone);
    if (day < weekStart) continue;

    const words = countWords(c.content ?? "");
    wordsWeek += words;
    chaptersWeek += 1;
    if (day === today) wordsToday += words;
  }

  return {
    dailyGoal: goals?.daily_words ?? null,
    weeklyGoal: goals?.weekly_words ?? null,
    wordsToday,
    wordsWeek,
    chaptersWeek,
    timeZone,
  };
}
