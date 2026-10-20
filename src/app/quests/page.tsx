import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getQuests, type Quest } from "@/app/quests/actions";
import { SPARK_NAME, formatCoins } from "@/lib/currency";

export const metadata = {
  title: "Quests",
};

export const dynamic = "force-dynamic";

const cardStyle = {
  borderColor: "var(--card-border)",
  backgroundColor: "var(--card)",
};

function timeLeft(iso: string) {
  const ms = new Date(iso).getTime() - Date.now();

  if (ms <= 0) return "soon";

  const hours = Math.floor(ms / 3_600_000);
  const minutes = Math.floor((ms % 3_600_000) / 60_000);

  if (hours >= 48) return `${Math.floor(hours / 24)} days`;
  if (hours >= 1) return `${hours}h ${minutes}m`;

  return `${minutes}m`;
}

function QuestRow({ quest }: { quest: Quest }) {
  const percent = Math.round((quest.progress / quest.target) * 100);

  return (
    <li
      className="rounded-xl border p-4"
      style={{
        ...cardStyle,
        opacity: quest.done ? 0.7 : 1,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 font-semibold">
            {quest.done && (
              <CheckCircle2
                size={16}
                style={{ color: "var(--accent)" }}
              />
            )}
            {quest.title}
          </p>
          <p className="mt-0.5 text-sm opacity-70">
            {quest.description}
          </p>
        </div>

        <p
          className="flex shrink-0 items-center gap-1 text-sm font-semibold"
          style={{ color: "var(--accent)" }}
        >
          <Zap size={14} />+{quest.reward}
        </p>
      </div>

      <div
        className="mt-3 h-2 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${percent}%`,
            backgroundColor: "var(--accent)",
          }}
        />
      </div>

      <p className="mt-1 text-xs opacity-60">
        {quest.done
          ? "Done"
          : `${quest.progress} / ${quest.target}`}
      </p>
    </li>
  );
}

function Bonus({
  label,
  reward,
  done,
}: {
  label: string;
  reward: number;
  done: boolean;
}) {
  return (
    <p className="mt-3 text-sm opacity-80">
      {done ? "Bonus earned: " : "Bonus: "}
      {label}{" "}
      <span style={{ color: "var(--accent)" }}>
        +{reward} {SPARK_NAME}
      </span>
      {done && " ✓"}
    </p>
  );
}

export default async function QuestsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const data = await getQuests();

  if (!data) {
    redirect("/auth/login");
  }

  const { overview, sparks, paused, multiplier } = data;

  const starterOpen = overview.starter.filter((q) => !q.done);

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-4xl font-bold">Quests</h1>
          <p className="mt-2 text-sm opacity-70">
            Earn {SPARK_NAME} by reading, writing and taking part.
            Everything here is checked by the site, so it only
            counts when you really do it.
          </p>
        </div>

        <Link
          href="/shop"
          className="flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold"
          style={{ borderColor: "var(--card-border)" }}
        >
          <Zap size={14} style={{ color: "var(--accent)" }} />
          {formatCoins(sparks)} {SPARK_NAME}
        </Link>
      </div>

      {paused ? (
        <p
          className="mt-6 rounded-xl border p-4 text-sm"
          style={{ borderColor: "var(--card-border)" }}
        >
          Quests are paused for now, so progress isn&apos;t counting
          until they&apos;re back.
        </p>
      ) : multiplier > 1 ? (
        <p
          className="mt-6 rounded-xl border p-4 text-sm font-medium"
          style={{ borderColor: "var(--card-border)" }}
        >
          Sparks event: every quest reward is x{multiplier} while it
          lasts.
        </p>
      ) : null}

      <section className="mt-8">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">Today</h2>
          <p className="text-xs opacity-60">
            New quests in {timeLeft(overview.daily_resets_at)}
          </p>
        </div>

        <ul className="mt-3 grid gap-3">
          {overview.daily.map((quest) => (
            <QuestRow key={quest.slug} quest={quest} />
          ))}
        </ul>

        <Bonus
          label="finish all of today's quests"
          reward={overview.daily_bonus}
          done={overview.daily_bonus_done}
        />
      </section>

      <section className="mt-10">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">This week</h2>
          <p className="text-xs opacity-60">
            Resets in {timeLeft(overview.weekly_resets_at)}
          </p>
        </div>

        <ul className="mt-3 grid gap-3">
          {overview.weekly.map((quest) => (
            <QuestRow key={quest.slug} quest={quest} />
          ))}
        </ul>

        <Bonus
          label="finish all the weekly quests"
          reward={overview.weekly_bonus}
          done={overview.weekly_bonus_done}
        />
      </section>

      {starterOpen.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold">Getting started</h2>
          <p className="mt-1 text-sm opacity-60">
            One-time quests. They stay until you finish them.
          </p>

          <ul className="mt-3 grid gap-3">
            {starterOpen.map((quest) => (
              <QuestRow key={quest.slug} quest={quest} />
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
