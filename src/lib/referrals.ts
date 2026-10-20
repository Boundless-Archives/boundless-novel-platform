import { USERNAME_PATTERN } from "@/lib/username";

/*
 * Referral settings, shared by the app.
 *
 * REFERRAL_PUBLISH_REWARD and REFERRAL_PUBLISH_MIN_WORDS must match the
 * constants at the top of the referral_publish_bonus() function in the
 * database, which is what actually pays that reward. Keep them in step.
 */
export const REFERRAL_SIGNUP_REWARD = 50;
export const REFERRAL_PUBLISH_REWARD = 250;
export const REFERRAL_PUBLISH_MIN_WORDS = 500;

// Most signup rewards one person can earn in any 24 hours
export const REFERRAL_DAILY_CAP = 10;

export const REFERRAL_COOKIE = "bl_ref";

/* A referral code is just the referrer's username. */
export function isValidReferralCode(code: string): boolean {
  return USERNAME_PATTERN.test(code);
}