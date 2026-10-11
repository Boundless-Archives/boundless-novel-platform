"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { countWords } from "@/lib/wordCount";
import { XP_PER_EMBER } from "@/lib/cultivation";

const XP_PER_WORD_DIVISOR = 40;
const READING_XP_PER_TICK = 1;

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

type BreakthroughResult = {
  new_total_xp: number;
  old_major: number;
  old_minor: number;
  new_major: number;
  new_minor: number;
  is_major_breakthrough: boolean;
  is_minor_breakthrough: boolean;
  new_major_name: string | null;
  new_minor_name: string | null;
  cultivation_path: string | null;
};

/*
 * Core XP-award function. Call this any time a user does
 * something that earns cultivation XP — reading time ticks,
 * published word counts, Embers spent to accelerate (realm
 * 7+, not wired yet). Handles breakthrough detection and the
 * resulting celebration (notification, badge for major
 * breakthroughs). The site-wide announcement for realm 7+ is
 * intentionally not wired yet, pending the real announcements
 * table schema.
 */
export async function awardCultivationXP(
  userId: string,
  xp: number,
  source: string
) {
  if (xp <= 0) return null;

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("award_cultivation_xp", {
      p_user_id: userId,
      p_xp: xp,
      p_source: source,
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const result = data as BreakthroughResult;

  if (!result || result.cultivation_path === null) {
    // User hasn't chosen a path yet — nothing to award.
    return null;
  }

  if (result.is_major_breakthrough) {
    await handleMajorBreakthrough(userId, result);
  } else if (result.is_minor_breakthrough) {
    await handleMinorBreakthrough(userId, result);
  }

  return result;
}

async function handleMinorBreakthrough(
  userId: string,
  result: BreakthroughResult
) {
  const adminClient = createAdminClient();

  const label = result.new_minor_name
    ? `${result.new_major_name}, ${result.new_minor_name}`
    : `${result.new_major_name}, Stage ${result.new_minor}`;

  const { error } = await adminClient
    .from("notifications")
    .insert({
      user_id: userId,
      type: "cultivation_breakthrough",
      title: "Cultivation Advanced",
      message: `You've advanced to ${label}.`,
      link: "/profile",
    });

  if (error) {
    console.error(
      "Cultivation notification failed:",
      error.message
    );
  }
}

async function handleMajorBreakthrough(
  userId: string,
  result: BreakthroughResult
) {
  const adminClient = createAdminClient();

  const { error: notifyError } = await adminClient
    .from("notifications")
    .insert({
      user_id: userId,
      type: "cultivation_breakthrough",
      title: "Realm Breakthrough!",
      message: `You've broken through to ${result.new_major_name} (Realm ${result.new_major}).`,
      link: "/profile",
    });

  if (notifyError) {
    console.error(
      "Cultivation notification failed:",
      notifyError.message
    );
  }

  const { data: badge } = await adminClient
    .from("badges")
    .select("id, name")
    .eq("slug", `realm_${result.new_major}`)
    .maybeSingle();

  if (badge) {
    const { error: badgeError } = await adminClient
      .from("user_badges")
      .insert({ user_id: userId, badge_id: badge.id });

    if (!badgeError) {
      await adminClient.from("notifications").insert({
        user_id: userId,
        type: "badge_earned",
        title: "New badge earned!",
        message: `You've earned the "${badge.name}" badge.`,
        link: "/profile",
      });
    }
  }

  // Realm 7+ triggers a brief, live, site-wide fanfare —
  // broadcast only, nothing persisted to any table.
  if (result.new_major >= 7) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("username, display_name")
      .eq("id", userId)
      .maybeSingle();

    const name =
      profile?.display_name ?? profile?.username ?? "A cultivator";

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`,
        {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_SECRET_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                topic: "global-events",
                event: "cultivation_breakthrough",
                payload: {
                  name,
                  realmName: result.new_major_name,
                  path: result.cultivation_path,
                },
              },
            ],
          }),
        }
      );
    } catch (e) {
      console.error("Breakthrough broadcast failed:", e);
    }
  }
}

/*
 * Award cultivation XP for a published chapter's word count.
 * Call this from every place a chapter actually goes live —
 * immediate publish (both chapter pages) and the scheduled
 * cron route.
 */
export async function awardWritingXP(
  authorId: string,
  content: string
) {
  const words = countWords(content);
  const xp = Math.floor(words / XP_PER_WORD_DIVISOR);

  if (xp <= 0) return null;

  return awardCultivationXP(authorId, xp, "writing");
}

/*
 * One reading-XP tick, called periodically by ReadingTracker
 * while a user is actively reading a chapter.
 */
export async function tickReadingXP() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return awardCultivationXP(
    user.id,
    READING_XP_PER_TICK,
    "reading"
  );
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

  if (embersAmount <= 0) {
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

  if (result.is_major_breakthrough) {
    await handleMajorBreakthrough(user.id, result);
  } else if (result.is_minor_breakthrough) {
    await handleMinorBreakthrough(user.id, result);
  }

  return result;
}