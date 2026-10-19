"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { XP_PER_EMBER } from "@/lib/cultivation";
import {
  awardCultivationXP,
  awardWritingXPForChapter,
  announceBreakthrough,
  type BreakthroughResult,
} from "@/lib/cultivationXp";

export async function choosePath(path: "qi" | "mana") {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient.rpc(
    "choose_cultivation_path",
    {
      p_user_id: user.id,
      p_path: path,
    }
  );

  if (error) {
    throw new Error(error.message);
  }
}

export async function getMyCultivationProfile() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return getCultivationProfileFor(user.id);
}

export async function getCultivationProfileFor(
  userId: string
) {
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("cultivation_profiles")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (!profile) return null;

  const { data: majorRow } = await supabase
    .from("cultivation_realms")
    .select("major_name")
    .eq("path", profile.path)
    .eq("major_number", profile.current_major)
    .limit(1)
    .maybeSingle();

  let minorName: string | null = null;

  if (profile.current_minor >= 1) {
    const { data: minorRow } = await supabase
      .from("cultivation_realms")
      .select("minor_name")
      .eq("path", profile.path)
      .eq("major_number", profile.current_major)
      .eq("minor_number", profile.current_minor)
      .maybeSingle();

    minorName = minorRow?.minor_name ?? null;
  }

  const { data: nextRealm } = await supabase
    .from("cultivation_realms")
    .select("*")
    .eq("path", profile.path)
    .gt("xp_required_cumulative", profile.total_xp)
    .order("xp_required_cumulative", { ascending: true })
    .limit(1)
    .maybeSingle();

  const { data: prevRealms } = await supabase
    .from("cultivation_realms")
    .select(
      "major_number, major_name, minor_number, minor_name, xp_required_cumulative"
    )
    .eq("path", profile.path)
    .lte("xp_required_cumulative", profile.total_xp)
    .order("xp_required_cumulative", { ascending: false })
    .limit(1);

  const current = prevRealms?.[0] ?? null;
  const prevThreshold = current?.xp_required_cumulative ?? 0;
  const nextThreshold =
    nextRealm?.xp_required_cumulative ?? profile.total_xp;

  const progressInStep =
    nextThreshold > prevThreshold
      ? (profile.total_xp - prevThreshold) /
        (nextThreshold - prevThreshold)
      : 1;

  return {
    path: profile.path as "qi" | "mana",
    totalXp: profile.total_xp as number,
    xpInCurrentStage: profile.total_xp - prevThreshold,
    xpNeededForStage: nextThreshold - prevThreshold,
    majorNumber: (current?.major_number as number) ?? 1,
    minorNumber: (current?.minor_number as number) ?? 0,
    majorName:
      (current?.major_name as string) ??
      (majorRow?.major_name as string) ??
      null,
    minorName: (current?.minor_name as string) ?? null,
    nextMajorName: (nextRealm?.major_name as string) ?? null,
    nextMinorName: (nextRealm?.minor_name as string) ?? null,
    nextThreshold,
    isMaxRealm: !nextRealm,
    progressInStep: Math.min(Math.max(progressInStep, 0), 1),
  };
}

/*
 * One reading-XP tick, called about once a minute by ReadingTracker
 * while a reader is actively reading a chapter.
 *
 * The database checks that this reader really has this chapter open,
 * that about a minute has passed since the last tick, and that the
 * per-chapter daily limit isn't used up, so calling this in a loop
 * earns nothing extra.
 */
export async function tickReadingXP(chapterId: string) {
  if (typeof chapterId !== "string" || chapterId.length === 0) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const adminClient = createAdminClient();

  const { data: ok } = await adminClient.rpc("tick_reading", {
    p_user: user.id,
    p_chapter: chapterId,
  });

  if (!ok) return null;

  await awardCultivationXP(user.id, 1, "reading");

  return { ok: true };
}

/*
 * Claim writing XP for a chapter the signed-in user just published.
 * Everything is checked on the server: it must be the user's own
 * published chapter, recent, and not already paid.
 */
export async function claimWritingXP(chapterId: string) {
  if (typeof chapterId !== "string" || chapterId.length === 0) {
    return null;
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  await awardWritingXPForChapter(chapterId, user.id);

  return { ok: true };
}

/*
 * Spend Embers to accelerate cultivation XP. Only works once
 * a user has reached realm 7 — enforced server-side in the
 * SQL function, not just here.
 */
export async function spendEmbersForCultivation(
  embersAmount: number
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  if (!Number.isInteger(embersAmount) || embersAmount <= 0) {
    throw new Error("Enter a valid amount.");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("spend_embers_for_cultivation", {
      p_user_id: user.id,
      p_embers: embersAmount,
      p_xp_per_ember: XP_PER_EMBER,
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const result = data as BreakthroughResult & {
    new_wallet_balance: number;
  };

  await announceBreakthrough(user.id, result);

  return result;
}
