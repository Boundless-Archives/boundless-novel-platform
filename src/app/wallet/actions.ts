"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  AD_REWARD_AMOUNT,
  MAX_ADS_PER_WINDOW,
  AD_COOLDOWN_HOURS,
} from "@/lib/currency";

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  return { supabase, user };
}

/*
 * Get the current user's wallet + recent transaction history.
 * Creates the wallet on first access.
 */
export async function getWalletSummary() {
  const { supabase, user } = await getAuthenticatedUser();

  const adminClient = createAdminClient();

  let { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!wallet) {
    await adminClient
      .from("wallets")
      .insert({ user_id: user.id });

    const refetch = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    wallet = refetch.data;
  }

  const { data: transactions } = await supabase
    .from("wallet_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

    const balance: number = wallet?.balance ?? 0;
   const bonusBalance: number = wallet?.bonus_balance ?? 0;

   return {
     balance,
     // Bonus Embers (streaks etc.) can be gifted and spent, but not cashed out.
     bonusBalance,
     cashableBalance: Math.max(0, balance - bonusBalance),
     lifetimeEarned: wallet?.lifetime_earned ?? 0,
     lifetimePurchased: wallet?.lifetime_purchased ?? 0,
     transactions: transactions ?? [],
   };
}

/*
 * Check the user's ad-earning eligibility: how many ads
 * they've watched in the current cooldown window, and when
 * they'll next be eligible if they've hit the cap.
 */
export async function getAdEarningStatus() {
  const { supabase, user } = await getAuthenticatedUser();

  const windowStart = new Date(
    Date.now() - AD_COOLDOWN_HOURS * 60 * 60 * 1000
  ).toISOString();

  const { data: recentViews } = await supabase
    .from("ad_views")
    .select("viewed_at")
    .eq("user_id", user.id)
    .gte("viewed_at", windowStart)
    .order("viewed_at", { ascending: true });

  const viewsInWindow = recentViews ?? [];
  const watchedCount = viewsInWindow.length;
  const eligible = watchedCount < MAX_ADS_PER_WINDOW;

  let nextEligibleAt: string | null = null;

  if (!eligible && viewsInWindow.length > 0) {
    const oldest = new Date(viewsInWindow[0].viewed_at);
    nextEligibleAt = new Date(
      oldest.getTime() + AD_COOLDOWN_HOURS * 60 * 60 * 1000
    ).toISOString();
  }

  return {
    watchedCount,
    maxPerWindow: MAX_ADS_PER_WINDOW,
    eligible,
    nextEligibleAt,
    rewardAmount: AD_REWARD_AMOUNT,
  };
}

export async function claimAdReward(): Promise<{
  newBalance: number;
  awarded: number;
}> {
  throw new Error("Ad rewards are not available yet.");
}