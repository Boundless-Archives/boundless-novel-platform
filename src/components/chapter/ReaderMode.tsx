"use client";

import { useCallback, useEffect, useState } from "react";
import { BookOpen, Pause, Play, X } from "lucide-react";
import PagedReader from "./PagedReader";

const MODE_KEY = "reader-mode";
const SPEED_KEY = "reader-seconds";

type Props = {
  chapterNumber: number;
  chapterTitle: string;
  storyHref: string;
  prevHref: string | null;
  nextHref: string | null;
};

function currentFraction() {
  const article = document.getElementById("chapter-reading-content");

  if (!article) return 0;

  const top = window.scrollY + article.getBoundingClientRect().top;

  const position = window.scrollY + window.innerHeight / 2 - top;

  return Math.min(1, Math.max(0, position / article.offsetHeight));
}

function remember(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {}
}

/*
 * Reading controls: choose Scroll or Pages, and set an auto-scroll speed.
 * Scroll mode scrolls one screen every N seconds; Page mode turns a page
 * every N seconds. Nothing starts by itself.
 */
export default function ReaderMode({
  chapterNumber,
  chapterTitle,
  storyHref,
  prevHref,
  nextHref,
}: Props) {
  const [ready, setReady] = useState(false);
  const [paged, setPaged] = useState<{
    html: string;
    fraction: number;
  } | null>(null);
  const [seconds, setSeconds] = useState(30);
  const [playing, setPlaying] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  const openPaged = useCallback((fraction: number) => {
    const content = document.getElementById("chapter-html");

    if (!content) return;

    setPlaying(false);
    setPanelOpen(false);
    setPaged({ html: content.innerHTML, fraction });
  }, []);

  const closePaged = useCallback(
    (opts: { fraction: number; toComments?: boolean }) => {
      setPaged(null);
      setPlaying(false);
      remember(MODE_KEY, "scroll");

      setTimeout(() => {
        if (opts.toComments) {
          document
            .getElementById("comments")
            ?.scrollIntoView({ block: "start" });
          return;
        }

        const article = document.getElementById("chapter-reading-content");

        if (!article) return;

        const top = window.scrollY + article.getBoundingClientRect().top;

        window.scrollTo({
          top: Math.max(
            0,
            top + opts.fraction * article.offsetHeight - window.innerHeight / 2
          ),
        });
      }, 50);
    },
    []
  );

  // Load the saved choices. Open Page mode again if that was the last choice,
  // unless the link points at a comment (notification links stay in Scroll mode).
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        const savedSeconds = Number(localStorage.getItem(SPEED_KEY));

        if (savedSeconds >= 5 && savedSeconds <= 120) {
          setSeconds(savedSeconds);
        }

        const wantsComments = /^#(comments|comment-|para-)/.test(
          window.location.hash
        );

        if (localStorage.getItem(MODE_KEY) === "paged" && !wantsComments) {
          openPaged(0);
        }
      } catch {}

      setReady(true);
    }, 0);

    return () => clearTimeout(timer);
  }, [openPaged]);

  // Auto-scroll for Scroll mode: one screen every N seconds
  useEffect(() => {
    if (!playing || paged) return;

    let frame = 0;
    let last = performance.now();
    let carry = 0;

    const step = (now: number) => {
      const dt = Math.min(now - last, 100);

      last = now;
      carry += (window.innerHeight / seconds) * (dt / 1000);

      const whole = Math.floor(carry);

      if (whole >= 1) {
        window.scrollBy(0, whole);
        carry -= whole;
      }

      const article = document.getElementById("chapter-reading-content");

      // stop at the end of the chapter text (never scroll into the comments)
      if (
        article &&
        article.getBoundingClientRect().bottom <= window.innerHeight + 4
      ) {
        setPlaying(false);
        return;
      }

      frame = requestAnimationFrame(step);
    };

    frame = requestAnimationFrame(step);

    // Any touch, scroll wheel or key press means "I want control": pause.
    const pause = (e: Event) => {
      if ((e.target as HTMLElement | null)?.closest?.("[data-reader-ui]")) {
        return;
      }

      setPlaying(false);
    };

    const onHidden = () => {
      if (document.visibilityState === "hidden") setPlaying(false);
    };

    window.addEventListener("wheel", pause, { passive: true });
    window.addEventListener("touchstart", pause, { passive: true });
    window.addEventListener("keydown", pause);
    document.addEventListener("visibilitychange", onHidden);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("wheel", pause);
      window.removeEventListener("touchstart", pause);
      window.removeEventListener("keydown", pause);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [playing, paged, seconds]);

  const changeSeconds = useCallback((value: number) => {
    setSeconds(value);
    remember(SPEED_KEY, String(value));
  }, []);

  if (paged) {
    return (
      <PagedReader
        html={paged.html}
        chapterNumber={chapterNumber}
        chapterTitle={chapterTitle}
        storyHref={storyHref}
        prevHref={prevHref}
        nextHref={nextHref}
        startFraction={paged.fraction}
        seconds={seconds}
        playing={playing}
        onSecondsChange={changeSeconds}
        onPlayingChange={setPlaying}
        onExit={closePaged}
      />
    );
  }

  if (!ready) return null;

  return (
    <>
      {panelOpen && (
        <div
          data-reader-ui
          role="dialog"
          aria-label="Reading options"
          className="fixed bottom-20 right-4 z-40 w-72 rounded-xl border border-card-border bg-card p-4 text-sm text-foreground shadow-xl"
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold">Reading</p>

            <button
              onClick={() => setPanelOpen(false)}
              aria-label="Close"
              className="opacity-60 hover:opacity-100"
            >
              <X size={16} />
            </button>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <button
              className="rounded-lg px-3 py-2 font-medium"
              style={{
                backgroundColor: "var(--button)",
                color: "var(--button-text)",
              }}
            >
              Scroll
            </button>

            <button
              onClick={() => {
                remember(MODE_KEY, "paged");
                openPaged(currentFraction());
              }}
              className="rounded-lg border border-card-border px-3 py-2"
            >
              Pages
            </button>
          </div>

          <div className="mt-5 border-t border-card-border pt-4">
            <p className="font-semibold">Auto-scroll</p>

            <label className="mt-3 block text-xs opacity-80">
              One screen every {seconds} seconds
              <input
                type="range"
                min={5}
                max={120}
                step={5}
                value={seconds}
                onChange={(e) => changeSeconds(Number(e.target.value))}
                className="mt-2 w-full"
              />
            </label>

            <div className="mt-1 flex justify-between text-[11px] opacity-60">
              <span>Faster</span>
              <span>Slower</span>
            </div>

            <button
              onClick={() => {
                setPlaying(true);
                setPanelOpen(false);
              }}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border border-card-border px-3 py-2 font-medium"
            >
              <Play size={14} />
              Start auto-scroll
            </button>

            <p className="mt-3 text-[11px] leading-snug opacity-60">
              It pauses when you touch the screen, and stops at the end of the
              chapter.
            </p>
          </div>
        </div>
      )}

      <button
        data-reader-ui
        onClick={() => {
          if (playing) {
            setPlaying(false);
          } else {
            setPanelOpen((open) => !open);
          }
        }}
        aria-label={playing ? "Pause auto-scroll" : "Reading options"}
        className="fixed bottom-4 right-4 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-card-border bg-card text-foreground shadow-md transition hover:-translate-y-0.5"
        style={playing ? { boxShadow: "0 0 0 2px var(--accent, #c9a44c)" } : undefined}
      >
        {playing ? <Pause size={18} /> : <BookOpen size={18} />}
      </button>
    </>
  );
}