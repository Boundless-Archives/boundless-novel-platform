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
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <div className="text-4xl">🏅</div>

        <h3 className="mt-3 text-lg font-semibold text-white">
          No badges yet
        </h3>

        <p className="mt-1 text-sm text-white/50">
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