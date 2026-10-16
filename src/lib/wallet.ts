import { createAdminClient } from "@/utils/supabase/admin";

/*
 * Credit or debit a user's wallet. Positive amount = credit,
 * negative = debit. Server-side only.
 *
 * This lives in src/lib (NOT in a "use server" file) on purpose:
 * everything exported from a "use server" file becomes a public
 * endpoint, and a function that can mint Embers for any user must
 * never be one.
 *
 * The database decides which bucket the Embers go into: money-backed
 * types ('offerwall_reward', 'purchase') are cashable; everything else
 * (streak rewards, admin credits, ...) is bonus. See the
 * award_wallet_coins() SQL function.
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