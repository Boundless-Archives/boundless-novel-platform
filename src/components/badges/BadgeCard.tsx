type BadgeCardProps = {
  name: string;
  description: string;
  icon: string;
  badgeType: "achievement" | "limited";
  awardNumber?: number | null;
  maxAwards?: number | null;
};

export default function BadgeCard({
  name,
  description,
  icon,
  badgeType,
  awardNumber,
  maxAwards,
}: BadgeCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 transition hover:border-white/20 hover:bg-white/[0.06]">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/[0.08] text-3xl">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-white">
              {name}
            </h3>

            {badgeType === "limited" && (
              <span className="rounded-full border border-amber-400/20 bg-amber-400/10 px-2.5 py-1 text-xs font-medium text-amber-300">
                Limited Edition
              </span>
            )}
          </div>

          <p className="mt-1 text-sm leading-6 text-white/60">
            {description}
          </p>

          {badgeType === "limited" && awardNumber && (
            <p className="mt-3 text-sm font-medium text-amber-300">
              #{String(awardNumber).padStart(3, "0")}
              {maxAwards ? ` of ${maxAwards}` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}