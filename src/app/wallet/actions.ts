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
 * Reusable, provider-agnostic function to credit or debit a
 * user's wallet. Positive amount = credit, negative = debit.
 * Always routes through the atomic award_wallet_coins() DB
 * function via the service-role client, so it's tamper-proof
 * and race-condition-safe no matter what calls it — streaks,
 * gifting, cultivation spend, etc. can all call this directly.
 */
export async function awardCoins(
  userId: string,
  amount: number,
  type: string,
  description?: string
) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc(
    "award_wallet_coins",
    {
      p_user_id: userId,
      p_amount: amount,
      p_type: type,
      p_description: description ?? null,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  return data as number;
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

  return {
    balance: wallet?.balance ?? 0,
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

/*
 * Claim the reward for a completed ad view. This is the
 * function a real ad SDK's completion callback will call
 * once a provider is wired up — right now it's triggered by
 * a placeholder "Watch Ad" button that simulates completion,
 * since no ad provider is integrated yet.
 */
export async function claimAdReward() {
  const { user } = await getAuthenticatedUser();

  const status = await getAdEarningStatus();

  if (!status.eligible) {
    throw new Error(
      "You've hit today's ad limit. Check back later."
    );
  }

  const adminClient = createAdminClient();

  const { error: viewError } = await adminClient
    .from("ad_views")
    .insert({
      user_id: user.id,
      coins_awarded: AD_REWARD_AMOUNT,
    });

  if (viewError) {
    throw new Error(viewError.message);
  }

  const newBalance = await awardCoins(
    user.id,
    AD_REWARD_AMOUNT,
    "ad_reward",
    "Watched a rewarded ad"
  );

  return { newBalance, awarded: AD_REWARD_AMOUNT };
}