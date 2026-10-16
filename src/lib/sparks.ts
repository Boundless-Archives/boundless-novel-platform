import { createAdminClient } from "@/utils/supabase/admin";

/*
 * Credit or debit a user's Sparks. Positive amount = credit,
 * negative = debit. Server-side only.
 *
 * Like src/lib/wallet.ts, this lives in src/lib (NOT in a
 * "use server" file) on purpose: everything exported from a
 * "use server" file is a public endpoint, and a function that can
 * mint Sparks for any user must never be one.
 *
 * Sparks are the free, in-app-only currency. They can't be gifted or
 * withdrawn; they're spent in the Spark Shop.
 */
export async function awardSparks(
  userId: string,
  amount: number,
  type: string,
  description?: string
) {
  const adminClient = createAdminClient();

  const { data, error } = await adminClient.rpc("award_sparks", {
    p_user_id: userId,
    p_amount: amount,
    p_type: type,
    p_description: description ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as number;
}