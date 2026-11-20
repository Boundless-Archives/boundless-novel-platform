import { TIER_META, type Sprint } from "@/lib/sprint";

/* Progress toward the three tiers, with a marker at each goal. */
export default function SprintProgressBar({
  sprint,
  chapters,
}: {
  sprint: Sprint;
  chapters: number;
}) {
  const goals = [sprint.tier1_goal, sprint.tier2_goal, sprint.tier3_goal];
  const max = sprint.tier3_goal;
  const pct = Math.min(100, (chapters / max) * 100);

  return (
    <div>
      <div className="relative mt-6 h-3 rounded-full" style={{ backgroundColor: "var(--card-border)" }}>
        <div
          className="h-3 rounded-full"
          style={{
            width: `${Math.max(pct, chapters > 0 ? 2 : 0)}%`,
            background: "linear-gradient(90deg, #8ec9ff, #e8b84a)",
          }}
        />
        {goals.map((g, i) => (
          <span
            key={g}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 text-lg"
            style={{ left: `${(g / max) * 100}%` }}
            title={`${TIER_META[i].name}: ${g} chapters`}
          >
            {chapters >= g ? TIER_META[i].icon : "◦"}
          </span>
        ))}
      </div>

      <div className="relative mt-5 h-8 text-xs opacity-70">
        {goals.map((g, i) => (
          <span
            key={g}
            className="absolute -translate-x-1/2 text-center"
            style={{ left: `${(g / max) * 100}%` }}
          >
            {TIER_META[i].name}
            <br />
            {g}
          </span>
        ))}
      </div>
    </div>
  );
}
