import { cookies } from "next/headers";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  REFERRAL_COOKIE,
  REFERRAL_DAILY_CAP,
  REFERRAL_SIGNUP_REWARD,
  isValidReferralCode,
} from "@/lib/referrals";

/*
 * Server-only. Called when someone finishes onboarding (verified email,
 * username chosen). If they arrived through a referral link, record it and
 * pay the referrer their signup reward. It never throws, so it can never
 * break signing up.
 */
export async function registerReferralAfterOnboarding(user: {
  id: string;
  user_metadata?: Record<string, unknown> | null;
}) {
  try {
    const jar = await cookies();

    const fromMetadata =
      typeof user.user_metadata?.referral_code === "string"
        ? user.user_metadata.referral_code
        : "";

    const raw = fromMetadata || jar.get(REFERRAL_COOKIE)?.value || "";

    const code = decodeURIComponent(raw).trim().toLowerCase();

    if (!isValidReferralCode(code)) return;

    const admin = createAdminClient();

    const { data: referrer } = await admin
      .from("profiles")
      .select("id")
      .eq("username", code)
      .eq("onboarding_completed", true)
      .maybeSingle();

    if (!referrer || referrer.id === user.id) return;

    const { data: result, error } = await admin.rpc("register_referral", {
      p_referrer: referrer.id,
      p_referred: user.id,
      p_signup_reward: REFERRAL_SIGNUP_REWARD,
      p_daily_cap: REFERRAL_DAILY_CAP,
    });

    if (error) {
      console.error("Referral registration failed:", error.message);
      return;
    }

    if (result?.paid) {
      const { data: newUser } = await admin
        .from("profiles")
        .select("display_name, username")
        .eq("id", user.id)
        .maybeSingle();

      const name = newUser?.display_name ?? newUser?.username ?? "A friend";

      const { error: notifyError } = await admin
        .from("notifications")
        .insert({
          user_id: referrer.id,
          actor_id: user.id,
          type: "system",
          title: "Referral reward",
          message: `${name} joined Boundless through your link. You earned ${REFERRAL_SIGNUP_REWARD} Sparks!`,
          link: "/refer",
        });

      if (notifyError) {
        console.error("Referral notification failed:", notifyError.message);
      }
    }

    try {
      jar.delete(REFERRAL_COOKIE);
    } catch {}
  } catch (e) {
    console.error("Referral registration error:", e);
  }
}