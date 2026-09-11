import { Award } from "lucide-react";
import BadgeCard from "./BadgeCard";

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  badge_type: "achievement" | "limited";
  max_awards: number | null;
  award_number: number | null;
};

type BadgeCollectionProps = {
  badges: Badge[];
};

export default function BadgeCollection({
  badges,
}: BadgeCollectionProps) {
  if (badges.length === 0) {
    return (
      <div
        className="rounded-2xl border p-8 text-center"
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "var(--card)",
        }}
      >
        <Award
          size={36}
          className="mx-auto"
          style={{ color: "var(--accent)" }}
        />

        <h3 className="mt-3 text-lg font-semibold">
          No badges yet
        </h3>

        <p className="mt-1 text-sm opacity-60">
          Keep using Boundless and your achievements will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {badges.map((badge) => (
        <BadgeCard
          key={badge.id}
          name={badge.name}
          description={badge.description}
          icon={badge.icon}
          badgeType={badge.badge_type}
          awardNumber={badge.award_number}
          maxAwards={badge.max_awards}
        />
      ))}
    </div>
  );
}