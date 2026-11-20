import { createAdminClient } from "@/utils/supabase/admin";

export type Sprint = {
  id: string;
  slug: string;
  title: string;
  description: string;
  starts_at: string;
  ends_at: string;
  min_words: number;
  tier1_goal: number;
  tier2_goal: number;
  tier3_goal: number;
  reward_tier1: number;
  reward_tier2: number;
  reward_tier3: number;
};

/* The sprint that is open now, or the most recent one that has finished. */
export async function getCurrentSprint(nowIso: string): Promise<{ sprint: Sprint; live: boolean } | null> {
  const admin = createAdminClient();

  const { data: open } = await admin
    .from("writing_sprints")
    .select("*")
    .lte("starts_at", nowIso)
    .gt("ends_at", nowIso)
    .order("starts_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (open) return { sprint: open as Sprint, live: true };

  const { data: last } = await admin
    .from("writing_sprints")
    .select("*")
    .lte("ends_at", nowIso)
    .order("ends_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return last ? { sprint: last as Sprint, live: false } : null;
}

export type SprintProgress = { joined: boolean; chapters: number };

export async function getSprintProgress(sprintId: string, userId: string): Promise<SprintProgress> {
  const admin = createAdminClient();

  const { data: entry } = await admin
    .from("sprint_entries")
    .select("user_id")
    .eq("sprint_id", sprintId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!entry) return { joined: false, chapters: 0 };

  const { data: count } = await admin.rpc("sprint_chapter_count", {
    p_sprint: sprintId,
    p_user: userId,
  });

  return { joined: true, chapters: Number(count ?? 0) };
}

export function tierFor(sprint: Sprint, chapters: number) {
  if (chapters >= sprint.tier3_goal) return 3;
  if (chapters >= sprint.tier2_goal) return 2;
  if (chapters >= sprint.tier1_goal) return 1;
  return 0;
}

export const TIER_META = [
  { key: 1, name: "Snowfall", icon: "❄️" },
  { key: 2, name: "Blizzard", icon: "🌬️" },
  { key: 3, name: "Aurora", icon: "✨" },
] as const;
