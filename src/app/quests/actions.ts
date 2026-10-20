"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { getPublicSettings } from "@/lib/platform";

/*
 * Browser-facing entry points for quests. The user always comes from
 * the session, never from the caller, and every number that earns
 * Sparks is worked out by the database from real events (a verified
 * chapter read, a saved comment, a published chapter...), not from
 * anything sent here.
 */

export type Quest = {
  slug: string;
  title: string;
  description: string;
  target: number;
  reward: number;
  progress: number;
  done: boolean;
};

export type QuestsOverview = {
  daily: Quest[];
  daily_bonus: number;
  daily_bonus_done: boolean;
  daily_resets_at: string;
  weekly: Quest[];
  weekly_bonus: number;
  weekly_bonus_done: boolean;
  weekly_resets_at: string;
  starter: Quest[];
};

export type RestoreOffer = {
  streak_type: "reader" | "writer";
  broken_streak: number;
  spark_price: number;
  ember_price: number;
  expires_at: string;
};

export async function getQuests() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const adminClient = createAdminClient();
  const settings = await getPublicSettings();

  // Opening the Quests page counts as showing up, and catches up the
  // quests that are counted from what the user has already done.
  await adminClient.rpc("quest_checkin", {
    p_user: user.id,
    p_tz: null,
  });

  const { data, error } = await adminClient.rpc("quests_overview", {
    p_user: user.id,
  });

  if (error) {
    throw new Error(error.message);
  }

  const { data: wallet } = await supabase
    .from("wallets")
    .select("spark_balance")
    .eq("user_id", user.id)
    .maybeSingle();

  return {
    overview: data as QuestsOverview,
    sparks: (wallet?.spark_balance as number) ?? 0,
    paused: !settings.quests_enabled,
    multiplier: settings.sparks_multiplier,
  };
}

/*
 * Called once in a while (not on every page) by the site-wide beacon:
 * remembers the user's time zone, counts today's visit for the "Show
 * up" quest, and reports any streak the user could still restore.
 * Quietly returns null for visitors who aren't signed in.
 */
export async function dailyCheckIn(timeZone?: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const adminClient = createAdminClient();

  await adminClient.rpc("quest_checkin", {
    p_user: user.id,
    p_tz: typeof timeZone === "string" ? timeZone : null,
  });

  const { data } = await adminClient.rpc("restore_offers", {
    p_user: user.id,
  });

  return { restore: (data ?? []) as RestoreOffer[] };
}
