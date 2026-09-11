import {
  BookOpen,
  FileText,
  Feather,
  Sparkles,
  Library,
  TrendingUp,
  Crown,
  Users,
  Star,
  Flag,
  Award,
  type LucideIcon,
} from "lucide-react";

const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  FileText,
  Feather,
  Sparkles,
  Library,
  TrendingUp,
  Crown,
  Users,
  Star,
  Flag,
};

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
  const Icon = ICON_MAP[icon];

  return (
    <div
      className="
        rounded-2xl
        border
        p-5
        transition
        hover:-translate-y-0.5
        hover:shadow-md
      "
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: "var(--card)",
      }}
    >
      <div className="flex items-start gap-4">
        <div
          className="
            flex
            h-14
            w-14
            shrink-0
            items-center
            justify-center
            rounded-2xl
          "
          style={{
            backgroundColor: "var(--accent-soft)",
            color: "var(--accent)",
          }}
        >
          {Icon ? (
            <Icon size={26} />
          ) : icon ? (
            <span className="text-2xl">{icon}</span>
          ) : (
            <Award size={26} />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{name}</h3>

            {badgeType === "limited" && (
              <span
                className="
                  rounded-full
                  border
                  px-2.5
                  py-1
                  text-xs
                  font-medium
                "
                style={{
                  borderColor: "var(--accent)",
                  backgroundColor: "var(--accent-soft)",
                  color: "var(--accent)",
                }}
              >
                Limited Edition
              </span>
            )}
          </div>

          <p className="mt-1 text-sm leading-6 opacity-70">
            {description}
          </p>

          {badgeType === "limited" && awardNumber && (
            <p
              className="mt-3 text-sm font-semibold"
              style={{ color: "var(--accent)" }}
            >
              #{String(awardNumber).padStart(3, "0")}
              {maxAwards ? ` of ${maxAwards}` : ""}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}