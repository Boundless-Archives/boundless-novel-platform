import Link from "next/link";
import WinterToggle from "@/components/winter/WinterToggle";
import { winterCountdown } from "@/lib/season";

/* The festive strip on the home page during the winter season. */
export default function WinterBanner({
  nowMs,
  sprintLive,
}: {
  nowMs: number;
  sprintLive: boolean;
}) {
  const countdown = winterCountdown(nowMs);

  return (
    <section
      className="winter-banner mt-6 rounded-2xl border p-5 sm:p-6"
      style={{ borderColor: "var(--card-border)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-wide opacity-70">
            ❄️ Winter at Boundless
          </p>
          <h2 className="mt-1 text-xl font-bold sm:text-2xl">
            {sprintLive ? "The Winter Writing Sprint is on" : "Wishing every reader a warm season"}
          </h2>
          <p className="mt-1 text-sm opacity-75">
            {sprintLive
              ? "Publish chapters, earn winter badges and climb the board until 5 January."
              : "Curl up with a good story."}
          </p>
        </div>

        <div className="text-right">
          {countdown.days > 0 ? (
            <>
              <p className="text-3xl font-bold leading-none">{countdown.days}</p>
              <p className="text-xs opacity-70">
                {countdown.days === 1 ? "day" : "days"} {countdown.label}
              </p>
            </>
          ) : (
            <p className="text-lg font-bold">🎄 {countdown.label}</p>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {sprintLive && (
          <Link
            href="/sprint"
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}
          >
            See the sprint
          </Link>
        )}
        <WinterToggle />
      </div>
    </section>
  );
}
