"use client";

import { useEffect } from "react";
import { REFERRAL_COOKIE, isValidReferralCode } from "@/lib/referrals";

/*
 * Remembers a referral link (?ref=username) for 30 days, so it still counts
 * when the person signs up later.
 */
export default function ReferralCapture() {
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search)
      .get("ref")
      ?.trim()
      .toLowerCase();

    if (ref && isValidReferralCode(ref)) {
      document.cookie = `${REFERRAL_COOKIE}=${encodeURIComponent(
        ref
      )}; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`;
    }
  }, []);

  return null;
}