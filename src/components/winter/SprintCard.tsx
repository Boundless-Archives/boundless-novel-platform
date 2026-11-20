import Link from "next/link";
import { nowMs } from "@/lib/guilds";
import { TIER_META, getCurrentSprint, getSprintProgress, tierFor } from "@/lib/sprint";
import SprintProgressBar from "@/components/winter/SprintProgressBar";

/* A compact sprint card for the writer dashboard. Hidden when no sprint is open. */
export default async function SprintCard({ userId }: { userId: string }) {
  const current = await getCurrentSprint(new Date(nowMs()).toISOString());
  if (!current?.live) return null;

  const { sprint } = current;
  const progress = await getSprintProgress(sprint.id, userId);
  const tier = tierFor(sprint, progress.chapters);

  return (
    <section
      className="winter-banner mb-8 rounded-2xl border p-5"
      style={{ borderColor: "var(--card-border)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-semibold">❄️ {sprint.title}</h2>
          <p className="text-sm opacity-70">
            {progress.joined
              ? `${progress.chapters} ${progress.chapters === 1 ? "chapter" : "chapters"} so far${
                  tier > 0 ? ` · ${TIER_META[tier - 1].icon} ${TIER_META[tier - 1].name}` : ""
                }`
              : "Publish chapters through 5 January and earn winter badges."}
          </p>
        </div>
        <Link
          href="/sprint"
          className="rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}
        >
          {progress.joined ? "View sprint" : "Join the sprint"}
        </Link>
      </div>

      {progress.joined && <SprintProgressBar sprint={sprint} chapters={progress.chapters} />}
    </section>
  );
}
