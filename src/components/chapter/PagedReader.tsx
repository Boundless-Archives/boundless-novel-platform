"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MessageSquare, Pause, Play, X } from "lucide-react";

const GAP = 48; // space between pages (hidden, only used for sliding)
const SPEEDS = [10, 15, 20, 30, 45, 60, 90, 120];
const FONT_KEY = "reader-font-scale";

type Props = {
  html: string;
  chapterNumber: number;
  chapterTitle: string;
  storyHref: string;
  prevHref: string | null;
  nextHref: string | null;
  startFraction: number;
  seconds: number;
  playing: boolean;
  onSecondsChange: (seconds: number) => void;
  onPlayingChange: (playing: boolean) => void;
  onExit: (opts: { fraction: number; toComments?: boolean }) => void;
};

/*
 * Full-screen horizontal page reader. The chapter flows into CSS columns the
 * size of the screen, and turning a page slides the columns sideways.
 */
export default function PagedReader({
  html,
  chapterNumber,
  chapterTitle,
  storyHref,
  prevHref,
  nextHref,
  startFraction,
  seconds,
  playing,
  onSecondsChange,
  onPlayingChange,
  onExit,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  // where we are in the chapter (0..1); survives resizes and font changes
  const fractionRef = useRef(startFraction);

  const [layout, setLayout] = useState({ step: 0, pages: 1 });
  const [page, setPage] = useState(0);

  const [scale, setScale] = useState(() => {
    try {
      const saved = Number(localStorage.getItem(FONT_KEY));
      return saved >= 0.8 && saved <= 1.8 ? saved : 1;
    } catch {
      return 1;
    }
  });

  const measure = useCallback(() => {
    const viewport = viewportRef.current;
    const inner = innerRef.current;

    if (!viewport || !inner) return;

    const width = viewport.clientWidth;
    const height = viewport.clientHeight;

    if (!width || !height) return;

    inner.style.width = `${width}px`;
    inner.style.height = `${height}px`;
    inner.style.columnWidth = `${width}px`;
    inner.style.columnGap = `${GAP}px`;

    const pages = Math.max(
      1,
      Math.round((inner.scrollWidth + GAP) / (width + GAP))
    );

    setLayout((prev) =>
      prev.step === width + GAP && prev.pages === pages
        ? prev
        : { step: width + GAP, pages }
    );

    setPage(Math.min(pages - 1, Math.round(fractionRef.current * (pages - 1))));
  }, []);

  // Work out the pages now, and again whenever size, fonts or images change
  useEffect(() => {
    const viewport = viewportRef.current;
    const inner = innerRef.current;

    const first = setTimeout(measure, 0);
    const second = setTimeout(measure, 400);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measure())
        : null;

    if (viewport && observer) observer.observe(viewport);

    document.fonts?.ready.then(() => measure());

    inner?.addEventListener("load", measure, true);

    return () => {
      clearTimeout(first);
      clearTimeout(second);
      observer?.disconnect();
      inner?.removeEventListener("load", measure, true);
    };
  }, [measure, scale]);

  const goTo = useCallback(
    (target: number) => {
      const clamped = Math.max(0, Math.min(layout.pages - 1, target));

      fractionRef.current =
        layout.pages > 1 ? clamped / (layout.pages - 1) : 0;

      setPage(clamped);
    },
    [layout.pages]
  );

  const next = () => goTo(page + 1);
  const prev = () => goTo(page - 1);

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        goTo(page + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        goTo(page - 1);
      } else if (e.key === "Escape") {
        onExit({ fraction: fractionRef.current });
      }
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [page, goTo, onExit]);

  // Stop the page behind from scrolling while the reader is open
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const previous = { html: html.style.overflow, body: body.style.overflow };

    html.style.overflow = "hidden";
    body.style.overflow = "hidden";

    return () => {
      html.style.overflow = previous.html;
      body.style.overflow = previous.body;
    };
  }, []);

  // Tell the progress / streak trackers how far along the reader is
  useEffect(() => {
    if (layout.step === 0) return;

    const progress =
      layout.pages <= 1 ? 100 : Math.round((page / (layout.pages - 1)) * 100);

    window.dispatchEvent(
      new CustomEvent("reader-progress", { detail: { progress } })
    );
  }, [page, layout]);

  // Auto page turn: every N seconds, restarting after each manual turn
  useEffect(() => {
    if (!playing || layout.step === 0) return;

    const timer = setTimeout(() => {
      if (page < layout.pages - 1) {
        goTo(page + 1);
      } else {
        onPlayingChange(false);
      }
    }, seconds * 1000);

    return () => clearTimeout(timer);
  }, [playing, page, seconds, layout, goTo, onPlayingChange]);

  function changeScale(delta: number) {
    const nextScale = Math.min(1.8, Math.max(0.8, +(scale + delta).toFixed(2)));

    setScale(nextScale);

    try {
      localStorage.setItem(FONT_KEY, String(nextScale));
    } catch {}
  }

  const speedOptions = Array.from(new Set([...SPEEDS, seconds])).sort(
    (a, b) => a - b
  );

  const percent =
    layout.pages <= 1 ? 100 : Math.round((page / (layout.pages - 1)) * 100);

  const lastPage = page >= layout.pages - 1;

  return (
    <div
      data-reader-ui
      className="fixed inset-0 z-[10000] flex flex-col bg-background text-foreground"
    >
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-card-border px-3">
        <button
          onClick={() => onExit({ fraction: fractionRef.current })}
          aria-label="Exit page mode"
          className="flex h-9 w-9 items-center justify-center rounded-lg opacity-80 hover:opacity-100"
        >
          <X size={20} />
        </button>

        <p className="min-w-0 flex-1 truncate text-sm opacity-80">
          Ch. {chapterNumber} · {chapterTitle}
        </p>

        <button
          onClick={() => changeScale(-0.1)}
          aria-label="Smaller text"
          className="h-9 rounded-lg px-2 text-xs opacity-80 hover:opacity-100"
        >
          A−
        </button>

        <button
          onClick={() => changeScale(0.1)}
          aria-label="Larger text"
          className="h-9 rounded-lg px-2 text-base opacity-80 hover:opacity-100"
        >
          A+
        </button>

        <select
          value={seconds}
          onChange={(e) => onSecondsChange(Number(e.target.value))}
          aria-label="Seconds per page for auto page turn"
          title="Seconds per page"
          className="h-8 rounded-lg border border-card-border bg-background px-1 text-xs"
        >
          {speedOptions.map((s) => (
            <option key={s} value={s}>
              {s}s
            </option>
          ))}
        </select>

        <button
          onClick={() => onPlayingChange(!playing)}
          aria-label={playing ? "Pause auto page turn" : "Start auto page turn"}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-card-border"
        >
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </header>

      <div
        className="relative min-h-0 flex-1"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStart.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const start = touchStart.current;
          touchStart.current = null;

          if (!start) return;

          const t = e.changedTouches[0];
          const dx = t.clientX - start.x;
          const dy = t.clientY - start.y;

          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
            if (dx < 0) next();
            else prev();
          }
        }}
      >
        <div className="mx-auto h-full w-full max-w-2xl px-6 py-5">
          <div
            ref={viewportRef}
            className="reader-content h-full w-full overflow-hidden"
          >
            <div
              ref={innerRef}
              className="reader-columns"
              style={{
                fontSize: `${1.125 * scale}rem`,
                lineHeight: 1.9,
                transform: `translateX(${-page * layout.step}px)`,
                transition: layout.step === 0 ? "none" : undefined,
              }}
            >
              <div className="mb-8 text-center">
                <p className="text-sm opacity-60">Chapter {chapterNumber}</p>
                <h1 className="mt-1 text-2xl font-bold">{chapterTitle}</h1>
              </div>

              <div dangerouslySetInnerHTML={{ __html: html }} />

              <div className="reader-end text-center">
                <p className="text-sm opacity-60">
                  End of Chapter {chapterNumber}
                </p>

                <div className="mx-auto mt-6 flex max-w-xs flex-col gap-3 text-base">
                  {nextHref && (
                    <Link
                      href={nextHref}
                      className="rounded-lg px-4 py-3 font-medium"
                      style={{
                        backgroundColor: "var(--button)",
                        color: "var(--button-text)",
                      }}
                    >
                      Next chapter →
                    </Link>
                  )}

                  <button
                    onClick={() =>
                      onExit({ fraction: 1, toComments: true })
                    }
                    className="inline-flex items-center justify-center gap-2 rounded-lg border border-card-border px-4 py-3"
                  >
                    <MessageSquare size={16} />
                    Read comments
                  </button>

                  {prevHref && (
                    <Link
                      href={prevHref}
                      className="rounded-lg border border-card-border px-4 py-3"
                    >
                      ← Previous chapter
                    </Link>
                  )}

                  <Link href={storyHref} className="py-2 text-sm opacity-70">
                    Back to story
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tap the left or right edge to turn the page */}
        <button
          tabIndex={-1}
          aria-label="Previous page"
          onClick={prev}
          className="absolute inset-y-0 left-0 w-1/4"
        />

        <button
          tabIndex={-1}
          aria-label="Next page"
          onClick={next}
          className="absolute inset-y-0 right-0 w-1/4"
        />
      </div>

      <footer className="shrink-0 border-t border-card-border">
        <div className="h-0.5 w-full bg-foreground/10">
          <div
            className="h-full bg-foreground/50 transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>

        <p className="py-2 text-center text-xs opacity-60">
          {layout.step === 0
            ? "Preparing pages..."
            : lastPage
              ? `End · ${layout.pages} pages`
              : `Page ${page + 1} of ${layout.pages}`}
        </p>
      </footer>
    </div>
  );
}