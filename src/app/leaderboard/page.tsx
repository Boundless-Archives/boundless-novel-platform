import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import SectionHeader from "@/components/layout/SectionHeader";
import EmptyState from "@/components/layout/EmptyState";
import Card from "@/components/ui/Card";
import {
  fetchLastWinners,
  fetchLeaderboard,
  previousMonday,
  type AuthorDetail,
  type Board,
} from "@/lib/leaderboard";

export const metadata = { title: "Leaderboard" };

const MEDALS = ["🥇", "🥈", "🥉"];

function fmtDay(iso: string) {
  return new Date(iso + "T00:00:00Z").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ board?: string; week?: string }>;
}) {
  const sp = await searchParams;
  const board: Board = sp.board === "author" ? "author" : "reader";
  const last = sp.week === "last";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [data, winners] = await Promise.all([
    fetchLeaderboard(board, last ? previousMonday() : null, user?.id ?? null),
    fetchLastWinners(),
  ]);

  const unit = board === "reader" ? "chapters" : "pts";
  const href = (b: Board, w: boolean) =>
    `/leaderboard?board=${b}${w ? "&week=last" : ""}`;

  const tab = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition ${
      active ? "" : "opacity-60 hover:opacity-100"
    }`;
  const tabStyle = (active: boolean) =>
    active
      ? { backgroundColor: "var(--button)", color: "var(--button-text)" }
      : { borderColor: "var(--card-border)" };

  const hasPrizes = (data?.prizes ?? []).some((p) => p > 0);
  const lastWinners = winners.filter((w) => w.board === board);

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <SectionHeader
        icon="🏆"
        title="Leaderboard"
        description="Resets every Monday (UTC). Readers climb by finishing chapters; authors earn points for writing and for what readers do with it."
      />

      <div className="mb-3 flex flex-wrap gap-2">
        <Link
          href={href("reader", last)}
          className={tab(board === "reader")}
          style={tabStyle(board === "reader")}
        >
          📖 Readers
        </Link>
        <Link
          href={href("author", last)}
          className={tab(board === "author")}
          style={tabStyle(board === "author")}
        >
          ✍️ Authors
        </Link>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        <Link
          href={href(board, false)}
          className={tab(!last)}
          style={tabStyle(!last)}
        >
          This week
        </Link>
        <Link
          href={href(board, true)}
          className={tab(last)}
          style={tabStyle(last)}
        >
          Last week
        </Link>
      </div>

      {!data || !data.enabled ? (
        <EmptyState
          icon="🏆"
          title="Leaderboard is resting"
          description="It's switched off for now. Check back soon."
        />
      ) : (
        <>
          <p className="mb-4 text-sm opacity-70">
            {fmtDay(data.week_start)} – {fmtDay(data.week_end)}
            {hasPrizes && (
              <>
                {" · "}Top 3 win{" "}
                {data.prizes
                  .map((p, i) => (p > 0 ? `${MEDALS[i]} ${p}` : null))
                  .filter(Boolean)
                  .join("  ")}{" "}
                Sparks
              </>
            )}
          </p>

          {user && (
            <Card padding="md" className="mb-4">
              {data.me ? (
                <div>
                  <p className="font-semibold">
                    You&apos;re #{data.me.rank} with {data.me.score} {unit}
                  </p>
                  {board === "author" && (
                    <AuthorBreakdown d={data.me.detail as AuthorDetail} />
                  )}
                </div>
              ) : (
                <p className="text-sm opacity-80">
                  {board === "reader"
                    ? "Finish a chapter this week to join the board."
                    : "Publish a chapter or earn some readers this week to join the board."}
                </p>
              )}
            </Card>
          )}

          {!data.rows.length ? (
            <EmptyState
              icon="🌱"
              title="Nobody here yet"
              description={
                board === "reader"
                  ? "Finish a chapter and you'll take the top spot."
                  : "Publish a chapter and you'll take the top spot."
              }
            />
          ) : (
            <ol className="space-y-2">
              {data.rows.map((r) => {
                const name = r.display_name || r.username || "Reader";
                const mine = r.user_id === user?.id;

                const inner = (
                  <div
                    className="flex items-center gap-3 rounded-xl border px-4 py-3"
                    style={{
                      borderColor: mine
                        ? "var(--button)"
                        : "var(--card-border)",
                      backgroundColor: "var(--card)",
                    }}
                  >
                    <span className="w-8 text-center text-lg font-bold">
                      {r.rank <= 3 ? MEDALS[r.rank - 1] : r.rank}
                    </span>

                    {r.avatar_url ? (
                      <Image
                        src={r.avatar_url}
                        alt=""
                        width={36}
                        height={36}
                        unoptimized
                        className="h-9 w-9 rounded-full object-cover"
                      />
                    ) : (
                      <span
                        className="flex h-9 w-9 items-center justify-center rounded-full border text-sm font-semibold"
                        style={{ borderColor: "var(--card-border)" }}
                      >
                        {name.slice(0, 1).toUpperCase()}
                      </span>
                    )}

                    <span className="min-w-0 flex-1 truncate font-medium">
                      {name}
                      {mine && (
                        <span className="ml-2 text-xs opacity-60">(you)</span>
                      )}
                    </span>

                    <span className="font-semibold tabular-nums">
                      {r.score}{" "}
                      <span className="text-xs font-normal opacity-60">
                        {unit}
                      </span>
                    </span>
                  </div>
                );

                return (
                  <li key={r.user_id}>
                    {r.username ? (
                      <Link href={`/author/${r.username}`}>{inner}</Link>
                    ) : (
                      inner
                    )}
                  </li>
                );
              })}
            </ol>
          )}

          {lastWinners.length > 0 && (
            <div className="mt-10">
              <h2 className="mb-3 text-lg font-semibold">
                Last week&apos;s podium
              </h2>
              <ul className="space-y-1 text-sm">
                {lastWinners.map((w) => (
                  <li key={`${w.board}-${w.rank}`}>
                    {MEDALS[w.rank - 1]}{" "}
                    <span className="font-medium">
                      {w.display_name || w.username}
                    </span>{" "}
                    <span className="opacity-60">
                      · {w.score} {unit}
                      {w.sparks > 0 && ` · ${w.sparks} Sparks`}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <details className="mt-10 text-sm">
            <summary className="cursor-pointer font-semibold">
              How scoring works
            </summary>

            {board === "reader" ? (
              <ul className="mt-3 list-disc space-y-1 pl-5 opacity-80">
                <li>
                  1 point for each chapter you finish. A chapter counts once a
                  week, however many times you read it.
                </li>
                <li>
                  A chapter only counts after real reading time, so skimming
                  past doesn&apos;t help.
                </li>
                <li>Your own stories don&apos;t count.</li>
                <li>
                  Profiles hidden from search aren&apos;t ranked. Placing
                  needs at least 3 chapters.
                </li>
              </ul>
            ) : (
              <ul className="mt-3 list-disc space-y-1 pl-5 opacity-80">
                <li>
                  Chapters published (300+ words): 10 pts each, up to 5 a
                  week.
                </li>
                <li>Words written: 1 pt per 500 words, up to 20.</li>
                <li>
                  Readers who open your stories: 1 pt each, up to 50.
                </li>
                <li>
                  Chapters finished by readers: 1 pt each, up to 100.
                </li>
                <li>New reviews: 5 pts each, up to 10 reviews.</li>
                <li>
                  Comments from readers: 1 pt each, up to 5 per reader, 50
                  total.
                </li>
                <li>New followers: 3 pts each, up to 20.</li>
                <li>
                  Your own reading, reviews, comments and follows never count.
                  Placing needs at least 10 points.
                </li>
              </ul>
            )}
          </details>
        </>
      )}
    </main>
  );
}

function AuthorBreakdown({ d }: { d: AuthorDetail }) {
  const items: [string, number, number][] = [
    ["Chapters", d.chapters, d.chapter_pts],
    ["Words", d.words, d.word_pts],
    ["Readers", d.views, d.view_pts],
    ["Finished", d.finishes, d.finish_pts],
    ["Reviews", d.reviews, d.review_pts],
    ["Comments", d.comments, d.comment_pts],
    ["Followers", d.followers, d.follower_pts],
  ];

  return (
    <ul className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
      {items.map(([label, n, pts]) => (
        <li key={label} className="flex justify-between gap-2">
          <span className="opacity-70">
            {label} ({n})
          </span>
          <span className="font-medium tabular-nums">+{pts}</span>
        </li>
      ))}
    </ul>
  );
}
