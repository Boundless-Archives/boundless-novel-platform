import { getCanonTierInfo } from "@/lib/canonTier";

type CanonTierBadgeProps = {
  tier: string | null | undefined;
  size?: "sm" | "md";
};

export default function CanonTierBadge({
  tier,
  size = "md",
}: CanonTierBadgeProps) {
  const info = getCanonTierInfo(tier);

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-xs"
      : "px-3 py-1 text-sm";

  return (
    <span
      title={info.description}
      className={`
        rounded-full
        font-semibold
        tracking-wide
        ${sizeClasses}
        ${info.bgClass}
        ${info.textClass}
      `}
    >
      {info.shortLabel}
    </span>
  );
}