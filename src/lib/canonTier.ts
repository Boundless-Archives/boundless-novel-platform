export const CANON_TIERS = ["B", "A", "S"] as const;

export type CanonTier = (typeof CANON_TIERS)[number];

type CanonTierInfo = {
  label: string;
  shortLabel: string;
  description: string;
  bgClass: string;
  textClass: string;
};

export const CANON_TIER_INFO: Record<CanonTier, CanonTierInfo> = {
  B: {
    label: "B-Tier · Independent",
    shortLabel: "B-Tier",
    description:
      "Author fully owns the universe. No canon impact.",
    bgClass: "bg-slate-500",
    textClass: "text-white",
  },
  A: {
    label: "A-Tier · Signed",
    shortLabel: "A-Tier",
    description:
      "Co-owned with Boundless for publishing/feature use. Eligible for crossovers.",
    bgClass: "bg-blue-600",
    textClass: "text-white",
  },
  S: {
    label: "S-Tier · Telos Canon",
    shortLabel: "S-Tier",
    description:
      "Official canon. Integrated permanently into the Telos Verse.",
    bgClass: "bg-purple-600",
    textClass: "text-white",
  },
};

export function getCanonTierInfo(
  tier: string | null | undefined
): CanonTierInfo {
  if (tier === "A" || tier === "S") {
    return CANON_TIER_INFO[tier];
  }

  return CANON_TIER_INFO.B;
}