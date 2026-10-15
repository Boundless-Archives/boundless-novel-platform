"use server";

import { createClient } from "@/utils/supabase/server";
import { awardBadgeBySlug } from "@/lib/badgeAward";

/*
 * Called by the hidden code listener (src/components/easter/SecretCode.tsx)
 * when someone enters the secret sequence.
 */
export async function unlockSecretBadge() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { awarded: false, loggedIn: false };

  const awarded = await awardBadgeBySlug(user.id, "secret_code");

  return { awarded, loggedIn: true };
}