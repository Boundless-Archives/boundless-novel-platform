import { saveWritingGoals } from "@/app/stories/goalActions";
import type { WritingProgress } from "@/lib/writingGoals";
import { MIN_STREAK_WORDS } from "@/lib/writing";

const fmt = (n: number) => n.toLocaleString("en-US");

function Bar({
  label,
  value,
  goal,
}: {
  label: string;
  value: number;
  goal: number | null;
}) {
  const pct = goal ? Math.min(100, Math.round((value / goal) * 100)) : 0;
  const done = !!goal && value >= goal;

  return (
    <div>
      <div className="flex items-baseline justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="opacity-70">
          {fmt(value)} words
          {goal ? ` of ${fmt(goal)}` : ""}
          {done ? " ✓" : ""}
        </span>
      </div>
      {goal ? (
        <div
          className="mt-2 h-2 rounded-full"
          style={{ backgroundColor: "var(--card-border)" }}
        >
          <div
            className="h-2 rounded-full"
            style={{
              width: `${Math.max(pct, value > 0 ? 3 : 0)}%`,
              backgroundColor: done ? "#1baf7a" : "var(--accent)",
            }}
          />
        </div>
      ) : (
        <p className="mt-1 text-xs opacity-50">No goal set</p>
      )}
    </div>
  );
}

export default function WritingGoalCard({
  progress,
}: {
  progress: WritingProgress;
}) {
  return (
    <section
      className="mb-10 rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold">Writing goals</h2>
          <p className="mt-1 text-sm opacity-60">
            Counts words in chapters you publish, in your own time zone (
            {progress.timeZone}). Private to you.
          </p>
        </div>
        <p className="text-sm opacity-70">
          {progress.chaptersWeek} chapter
          {progress.chaptersWeek === 1 ? "" : "s"} this week
        </p>
      </div>

      <div className="mt-5 grid gap-6 md:grid-cols-2">
        <Bar label="Today" value={progress.wordsToday} goal={progress.dailyGoal} />
        <Bar label="This week" value={progress.wordsWeek} goal={progress.weeklyGoal} />
      </div>

      <form
        action={saveWritingGoals}
        className="mt-6 flex flex-wrap items-end gap-3"
      >
        <label className="text-sm">
          <span className="mb-1 block opacity-70">Daily goal (words)</span>
          <input
            name="daily_words"
            type="number"
            min={100}
            max={50000}
            step={50}
            defaultValue={progress.dailyGoal ?? ""}
            placeholder="e.g. 1000"
            className="w-36 rounded-lg border bg-transparent px-3 py-2"
            style={{ borderColor: "var(--card-border)" }}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block opacity-70">Weekly goal (words)</span>
          <input
            name="weekly_words"
            type="number"
            min={100}
            max={300000}
            step={100}
            defaultValue={progress.weeklyGoal ?? ""}
            placeholder="e.g. 5000"
            className="w-36 rounded-lg border bg-transparent px-3 py-2"
            style={{ borderColor: "var(--card-border)" }}
          />
        </label>
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-semibold"
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          Save goals
        </button>
      </form>

      <p className="mt-4 text-xs opacity-50">
        Your writing streak counts a day when you publish a chapter of at
        least {MIN_STREAK_WORDS} words. Author&apos;s notes don&apos;t count.
      </p>
    </section>
  );
}
