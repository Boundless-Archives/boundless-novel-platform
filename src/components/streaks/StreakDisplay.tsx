import Link from "next/link";
import { BookOpen, PenLine, Snowflake } from "lucide-react";
import StreakFlame from "@/components/streaks/StreakFlame";
import {
  getNextStreakMilestone,
  type StreakType,
} from "@/lib/streaks";
import { SPARK_NAME } from "@/lib/currency";
import type { Cosmetic } from "@/lib/cosmetics";

type Streak = {
  current_streak: number;
  longest_streak: number;
  last_counted_date: string | null;
  freezes?: number;
  done_today?: boolean;
} | null;

type Props = {
  reader: Streak;
  writer: Streak;
  flame?: Cosmetic | null;
};

function StreakCard({
  label,
  Icon,
  streak,
  kind,
  flame,
}: {
  label: string;
  Icon: typeof BookOpen;
  streak: Streak;
  kind: StreakType;
  flame?: Cosmetic | null;
}) {
  const current = streak?.current_streak ?? 0;
  const longest = streak?.longest_streak ?? 0;
  const freezes = streak?.freezes ?? 0;
  const next = getNextStreakMilestone(kind, current);

  const flameColor =
    typeof flame?.style.color === "string" ? flame.style.color : null;
  const flameGlow =
    typeof flame?.style.glow === "string" ? flame.style.glow : null;

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
        <StreakFlame
          size={28}
          streak={current}
          doneToday={streak?.done_today ?? false}
          color={flameColor}
          glow={flameGlow}
        />

        <span className="font-serif text-3xl font-bold">
          {current}
        </span>

        <span className="text-sm opacity-60">
          day{current === 1 ? "" : "s"}
        </span>
      </div>

      {current > 0 && (
        <p className="mt-2 text-xs font-medium opacity-80">
          {streak?.done_today
            ? "🔥 Extended today"
            : kind === "reader"
            ? "Read a chapter today to keep it going"
            : "Publish a chapter today to keep it going"}
        </p>
      )}

      <p className="mt-2 text-xs opacity-50">
        Best: {longest} day{longest === 1 ? "" : "s"}
      </p>

      <p className="mt-1 text-xs opacity-50">
        Next reward: {next.reward.toLocaleString()} {SPARK_NAME} at
        day {next.day}
      </p>

      <p className="mt-2 flex items-center gap-1.5 text-xs opacity-70">
        <Snowflake size={13} />
        {freezes > 0 ? (
          <span>
            {freezes} freeze{freezes === 1 ? "" : "s"} ready — used
            automatically if you miss a day
          </span>
        ) : (
          <Link
            href="/shop"
            className="underline underline-offset-4"
          >
            Protect it with a Streak Freeze
          </Link>
        )}
      </p>
    </div>
  );
}

export default function StreakDisplay({
  reader,
  writer,
  flame,
}: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <StreakCard
        label="Reader Streak"
        Icon={BookOpen}
        streak={reader}
        kind="reader"
        flame={flame}
      />

      <StreakCard
        label="Writer Streak"
        Icon={PenLine}
        streak={writer}
        kind="writer"
        flame={flame}
      />
    </div>
  );
}