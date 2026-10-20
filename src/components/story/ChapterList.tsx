"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type ChapterItem = {
  id: string;
  chapter_number: number;
  title: string;
};

const PREVIEW = 5;

/*
 * The chapter list of a story page. Long lists don't push reviews and
 * recommendations off the page: it shows the first few chapters, and
 * "Show all" opens a scrolling list with jump-to-number and a sort
 * toggle. The reader's current chapter is highlighted.
 */
export default function ChapterList({
  chapters,
  currentChapterId,
}: {
  chapters: ChapterItem[];
  currentChapterId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [newestFirst, setNewestFirst] = useState(false);
  const [jump, setJump] = useState("");

  const total = chapters.length;
  const small = total <= PREVIEW + 3;

  const ordered = useMemo(() => {
    const list = [...chapters].sort(
      (a, b) => a.chapter_number - b.chapter_number
    );
    return newestFirst ? list.reverse() : list;
  }, [chapters, newestFirst]);

  const current = chapters.find((c) => c.id === currentChapterId) ?? null;
  const latest = chapters[chapters.length - 1];

  const query = jump.trim();
  const visible =
    open && query
      ? ordered.filter(
          (c) =>
            String(c.chapter_number) === query ||
            c.title.toLowerCase().includes(query.toLowerCase())
        )
      : open || small
        ? ordered
        : ordered.slice(0, PREVIEW);

  function row(chapter: ChapterItem) {
    const isCurrent = chapter.id === currentChapterId;

    return (
      <Link
        key={chapter.id}
        href={`/chapter/${chapter.id}`}
        className="block rounded-xl border p-4 transition hover:shadow-md"
        style={{
          backgroundColor: "var(--card)",
          borderColor: isCurrent ? "var(--accent)" : "var(--card-border)",
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="font-semibold">
              Chapter {chapter.chapter_number}
              {isCurrent && (
                <span className="ml-2 text-xs font-medium opacity-70">
                  · you are here
                </span>
              )}
            </div>
            <div className="truncate opacity-80">{chapter.title}</div>
          </div>
          <div className="shrink-0 text-sm opacity-70">Read →</div>
        </div>
      </Link>
    );
  }

  return (
    <div className="mt-6">
      {current && (
        <Link
          href={`/chapter/${current.id}`}
          className="mb-4 inline-block rounded-lg border px-4 py-2 text-sm font-semibold"
          style={{ borderColor: "var(--accent)" }}
        >
          Continue: Chapter {current.chapter_number} →
        </Link>
      )}

      {open && !small && (
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <input
            value={jump}
            onChange={(e) => setJump(e.target.value)}
            placeholder="Jump to chapter number or title"
            aria-label="Find a chapter"
            className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "var(--card-border)" }}
          />
          <button
            type="button"
            onClick={() => setNewestFirst((v) => !v)}
            className="rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: "var(--card-border)" }}
          >
            {newestFirst ? "Newest first ↓" : "Oldest first ↑"}
          </button>
        </div>
      )}

      <div
        className={`space-y-3 ${
          open && !small ? "max-h-[28rem] overflow-y-auto pr-1" : ""
        }`}
      >
        {visible.length === 0 ? (
          <p className="py-4 text-sm opacity-60">No chapter matches that.</p>
        ) : (
          visible.map(row)
        )}
      </div>

      {!small && !open && (
        <div className="mt-3 space-y-3">
          {latest && !visible.some((c) => c.id === latest.id) && (
            <div>
              <p className="mb-2 text-xs uppercase tracking-wide opacity-50">
                Latest
              </p>
              {row(latest)}
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen(true)}
            className="w-full rounded-xl border px-4 py-3 text-sm font-semibold"
            style={{ borderColor: "var(--card-border)" }}
          >
            Show all {total} chapters
          </button>
        </div>
      )}

      {!small && open && (
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setJump("");
          }}
          className="mt-3 w-full rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: "var(--card-border)" }}
        >
          Show fewer
        </button>
      )}
    </div>
  );
}
