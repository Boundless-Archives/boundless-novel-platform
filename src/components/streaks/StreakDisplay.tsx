import { Flame, BookOpen, PenLine } from "lucide-react";
import {
  getNextStreakMilestone,
  type StreakType,
} from "@/lib/streaks";

type Streak = {
  current_streak: number;
  longest_streak: number;
  last_counted_date: string | null;
} | null;

type Props = {
  reader: Streak;
  writer: Streak;
};

function StreakCard({
  label,
  Icon,
  streak,
  kind,
}: {
  label: string;
  Icon: typeof BookOpen;
  streak: Streak;
  kind: StreakType;
}) {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const next = getNextStreakMilestone(kind, current);

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: "var(--card)",
      }}
    >
      <div className="flex items-center gap-2 opacity-70">
        <Icon size={16} />
        <span className="text-sm font-medium">{label}</span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Flame
          size={28}
          style={{
            color:
              current > 0 ? "var(--accent)" : "inherit",
            opacity: current > 0 ? 1 : 0.3,
          }}
        />

        <span className="font-serif text-3xl font-bold">
          {current}
        </span>

        <span className="text-sm opacity-60">
          day{current === 1 ? "" : "s"}
        </span>
      </div>

      <p className="mt-2 text-xs opacity-50">
        Best: {longest} day{longest === 1 ? "" : "s"}
      </p>

      <p className="mt-1 text-xs opacity-50">
        Next reward: {next.reward} embers at day {next.day}
      </p>
    </div>
  );
}

export default function StreakDisplay({
  reader,
  writer,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StreakCard
        label="Reader Streak"
        Icon={BookOpen}
        streak={reader}
        kind="reader"
      />

      <StreakCard
        label="Writer Streak"
        Icon={PenLine}
        streak={writer}
        kind="writer"
      />
    </div>
  );
}