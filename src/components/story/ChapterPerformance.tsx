import Link from "next/link";

export type ChapterStat = {
  id: string;
  number: number;
  title: string;
  published_at: string | null;
  words: number;
  readers: number;
  finished: number;
  comments: number;
  retained: number;
  has_next: boolean;
};

export type ChapterAnalytics = {
  tracking_since: string | null;
  chapters: ChapterStat[];
};

const MIN_SAMPLE = 3;

const pct = (a: number, b: number) =>
  b > 0 ? Math.round((a / b) * 100) : null;

function Meter({ value }: { value: number | null }) {
  if (value === null) return <span className="opacity-40">—</span>;

  return (
    <div className="flex items-center gap-2">
      <div
        className="h-1.5 w-16 rounded-full"
        style={{ backgroundColor: "var(--card-border)" }}
      >
        <div
          className="h-1.5 rounded-full"
          style={{
            width: `${Math.max(value, 3)}%`,
            backgroundColor: "var(--accent)",
          }}
        />
      </div>
      <span className="w-9 text-right tabular-nums">{value}%</span>
    </div>
  );
}

export default function ChapterPerformance({
  data,
  storyId,
}: {
  data: ChapterAnalytics;
  storyId: string;
}) {
  const rows = data.chapters;

  if (rows.length === 0) return null;

  const totalReaders = rows.reduce((t, r) => t + r.readers, 0);

  // The chapter after which the biggest share of readers stopped.
  const drop = rows
    .filter((r) => r.has_next && r.readers >= MIN_SAMPLE)
    .map((r) => ({ row: r, keep: r.retained / r.readers }))
    .sort((a, b) => a.keep - b.keep)[0];

  const since = data.tracking_since
    ? new Date(data.tracking_since).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone: "UTC",
      })
    : null;

  return (
    <section className="mt-12">
      <div className="mb-4">
        <h2 className="text-2xl font-bold">Chapter Performance</h2>
        <p className="mt-1 text-sm opacity-60">
          How readers move through your story, chapter by chapter. Counts
          verified reads only (your own reads are left out)
          {since ? `, tracked since ${since}` : ""}.
        </p>
      </div>

      {totalReaders === 0 ? (
        <div
          className="rounded-2xl border p-8 text-center opacity-80"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          No verified reads yet. They appear as readers spend real time on
          your chapters.
        </div>
      ) : (
        <>
          {drop && drop.keep < 0.7 && (
            <div
              className="mb-4 rounded-2xl border p-4 text-sm"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "#f59e0b",
              }}
            >
              <strong>Biggest drop-off:</strong> only{" "}
              {Math.round(drop.keep * 100)}% of the readers who opened
              Chapter {drop.row.number} went on to Chapter{" "}
              {drop.row.number + 1}. A stronger ending, a hook in the last
              paragraphs or a quicker next chapter can help.
            </div>
          )}

          <div
            className="overflow-x-auto rounded-2xl border"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide opacity-60">
                  <th className="p-4">Chapter</th>
                  <th className="p-4">Readers</th>
                  <th className="p-4">Finished it</th>
                  <th className="p-4">Read the next</th>
                  <th className="p-4">Comments</th>
                  <th className="p-4">Words</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    <td className="p-4">
                      <Link
                        href={`/chapter/${r.id}`}
                        className="font-medium hover:underline"
                      >
                        {r.number}. {r.title}
                      </Link>
                    </td>
                    <td className="p-4 tabular-nums">{r.readers}</td>
                    <td className="p-4">
                      <Meter value={pct(r.finished, r.readers)} />
                    </td>
                    <td className="p-4">
                      <Meter
                        value={r.has_next ? pct(r.retained, r.readers) : null}
                      />
                    </td>
                    <td className="p-4 tabular-nums">{r.comments}</td>
                    <td className="p-4 tabular-nums">
                      {r.words.toLocaleString("en-US")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs opacity-50">
            With only a handful of readers per chapter, treat these as hints,
            not verdicts. They get more reliable as readers arrive.{" "}
            <Link href={`/stories/${storyId}/chapters`} className="underline">
              Manage chapters
            </Link>
          </p>
        </>
      )}
    </section>
  );
}
