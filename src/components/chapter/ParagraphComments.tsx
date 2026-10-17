"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
} from "react";
import { MessageSquare, Plus, X } from "lucide-react";
import { createComment } from "@/app/actions/chapterComments";
import CommentList from "./CommentList";

type PComment = {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  parent_id?: string | null;
  paragraph_index?: number | null;
  paragraph_snippet?: string | null;
  resolved_paragraph?: number | null;
};

type ProfileMap = Map<
  string,
  {
    display_name: string | null;
    username: string | null;
  }
>;

type Props = {
  chapterId: string;
  currentUserId?: string;
  comments: PComment[]; // only comments that belong to a paragraph
  profiles: ProfileMap;
};

const PREF_KEY = "paragraph-comment-markers";

function getParagraph(index: number) {
  return document.querySelector<HTMLElement>(
    `#chapter-reading-content [data-pi="${index}"]`
  );
}

function isPhone() {
  return window.innerWidth < 768;
}

/*
 * Paragraph comments. Render this as the first child of the chapter
 * <article id="chapter-reading-content" class="relative ...">.
 * It never edits the chapter text: markers float in the side margin, and the
 * discussion opens in a side panel (desktop) or bottom sheet (phone).
 */
export default function ParagraphComments({
  chapterId,
  currentUserId,
  comments,
  profiles,
}: Props) {
  const [ready, setReady] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [hover, setHover] = useState<number | null>(null);
  const [open, setOpen] = useState<{ index: number; quote: string } | null>(
    null
  );
  const [positions, setPositions] = useState<Record<number, number>>({});
  const [draft, setDraft] = useState("");
  const [pending, startTransition] = useTransition();

  const counts = useMemo(() => {
    const map: Record<number, number> = {};

    for (const c of comments) {
      if (c.resolved_paragraph == null) continue;
      map[c.resolved_paragraph] = (map[c.resolved_paragraph] ?? 0) + 1;
    }

    return map;
  }, [comments]);

  const openIndex = open?.index ?? null;

  const openParagraph = useCallback(
    (index: number, scroll: boolean) => {
      const el = getParagraph(index);

      if (!el) return;

      const text = (el.textContent ?? "").trim();

      setOpen({
        index,
        quote: text.length > 140 ? `${text.slice(0, 140)}…` : text,
      });

      if (scroll || isPhone()) {
        el.scrollIntoView({
          behavior: "smooth",
          block: isPhone() ? "start" : "center",
        });
      }
    },
    []
  );

  // Read the reader's on/off choice (default: on) and handle #para-N links
  useEffect(() => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let flashTimer: ReturnType<typeof setTimeout> | undefined;

    timer = setTimeout(() => {
      try {
        setEnabled(localStorage.getItem(PREF_KEY) !== "off");
      } catch {}

      setReady(true);

      const match = window.location.hash.match(/^#para-(\d+)(?:-(.+))?$/);

      if (!match) return;

      const index = Number(match[1]);
      const commentId = match[2];

      const attempt = () => {
        if (!getParagraph(index)) {
          tries += 1;
          if (tries < 12) timer = setTimeout(attempt, 150);
          return;
        }

        openParagraph(index, true);

        if (commentId) {
          flashTimer = setTimeout(() => {
            const card = document.getElementById(`pc-${commentId}`);

            if (!card) return;

            card.classList.add("comment-flash");
            setTimeout(() => card.classList.remove("comment-flash"), 2600);
          }, 500);
        }
      };

      attempt();
    }, 0);

    return () => {
      clearTimeout(timer);
      clearTimeout(flashTimer);
    };
  }, [openParagraph]);

  // "On a paragraph" chips in the discussion ask us to open a paragraph
  useEffect(() => {
    const handler = (e: Event) => {
      const index = (e as CustomEvent<{ index: number }>).detail?.index;

      if (typeof index === "number") openParagraph(index, true);
    };

    window.addEventListener("open-paragraph", handler);

    return () => window.removeEventListener("open-paragraph", handler);
  }, [openParagraph]);

    // Hover (desktop) or tap (phone) reveals a "+" for paragraphs with no comments yet.
  // Pointer events work for mouse and touch, including iPhones.
  useEffect(() => {
    const article = document.getElementById("chapter-reading-content");

    if (!article) return;

    let touchTimer: ReturnType<typeof setTimeout> | undefined;

    const onOver = (e: PointerEvent) => {
      const p = (e.target as HTMLElement).closest?.("[data-pi]");
      const value = p?.getAttribute("data-pi");

      if (value == null) return;

      setHover(Number(value));

      clearTimeout(touchTimer);

      // on phones, tuck the "+" away again after a few seconds
      if (e.pointerType === "touch") {
        touchTimer = setTimeout(() => setHover(null), 4000);
      }
    };

    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === "mouse") setHover(null);
    };

    article.addEventListener("pointerover", onOver);
    article.addEventListener("pointerleave", onLeave);

    return () => {
      clearTimeout(touchTimer);
      article.removeEventListener("pointerover", onOver);
      article.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  // Keep markers lined up with their paragraphs
  const measure = useCallback(() => {
    const article = document.getElementById("chapter-reading-content");

    if (!article) return;

    const articleTop = article.getBoundingClientRect().top;

    const wanted = new Set<number>(Object.keys(counts).map(Number));

    if (hover !== null) wanted.add(hover);
    if (openIndex !== null) wanted.add(openIndex);

    const next: Record<number, number> = {};

    wanted.forEach((i) => {
      const p = getParagraph(i);

      if (p) next[i] = Math.round(p.getBoundingClientRect().top - articleTop);
    });

    setPositions((prev) =>
      JSON.stringify(prev) === JSON.stringify(next) ? prev : next
    );
  }, [counts, hover, openIndex]);

  useEffect(() => {
    if (!ready || !enabled) return;

    const article = document.getElementById("chapter-reading-content");

    let frame = requestAnimationFrame(measure);

    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(measure);
    };

    window.addEventListener("resize", schedule);

    const observer =
      typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(schedule)
        : null;

    if (article && observer) observer.observe(article);

    document.fonts?.ready.then(schedule);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", schedule);
      observer?.disconnect();
    };
  }, [ready, enabled, measure]);

  // Softly highlight the open paragraph
  useEffect(() => {
    if (openIndex === null) return;

    const el = getParagraph(openIndex);

    el?.classList.add("pc-active");

    return () => el?.classList.remove("pc-active");
  }, [openIndex]);

  // Escape closes the panel
  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(null);
    };

    window.addEventListener("keydown", onKey);

    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex]);

  function toggle() {
    const next = !enabled;

    setEnabled(next);

    try {
      localStorage.setItem(PREF_KEY, next ? "on" : "off");
    } catch {}
  }

  const panelComments =
    openIndex === null
      ? []
      : comments.filter((c) => c.resolved_paragraph === openIndex);

  return (
    <>
      {/* On/off switch for the margin markers */}
      <div className="mb-6 flex justify-end">
        <button
          onClick={toggle}
          aria-pressed={ready ? enabled : true}
          className="inline-flex items-center gap-1.5 text-xs leading-none opacity-60 transition hover:opacity-100"
        >
          <MessageSquare size={13} />
          Paragraph comments: {ready && !enabled ? "Off" : "On"}
        </button>
      </div>

      {/* Margin markers (never inside the text) */}
      <div className="pointer-events-none absolute inset-0">
        {ready &&
          enabled &&
          Object.entries(positions).map(([key, top]) => {
            const index = Number(key);
            const count = counts[index] ?? 0;

            if (count === 0 && hover !== index && openIndex !== index) {
              return null;
            }

            return (
              <button
                key={key}
                onClick={() => openParagraph(index, false)}
                aria-label={
                  count > 0
                    ? `${count} comment${count === 1 ? "" : "s"} on this paragraph`
                    : "Comment on this paragraph"
                }
                className="
                  pointer-events-auto
                  absolute
                  -right-[22px]
                  flex
                  h-5
                  min-w-5
                  items-center
                  justify-center
                  gap-0.5
                  rounded-full
                  border
                  px-1
                  text-[10px]
                  leading-none
                  opacity-60
                  transition
                  before:absolute
                  before:-inset-2
                  before:content-['']
                  hover:opacity-100
                  md:-right-12
                "
                style={{
                  top: top + 8,
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                }}
              >
                {count > 0 ? (
                  <>
                    <MessageSquare size={10} />
                    {count > 9 ? "9+" : count}
                  </>
                ) : (
                  <Plus size={12} />
                )}
              </button>
            );
          })}
      </div>

      {/* Side panel (desktop) / bottom sheet (phone) */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 md:hidden"
            onClick={() => setOpen(null)}
          />

          <aside
            role="dialog"
            aria-label="Paragraph comments"
            className="
              fixed
              inset-x-0
              bottom-0
              z-50
              flex
              max-h-[65vh]
              flex-col
              rounded-t-2xl
              border
              text-base
              leading-normal
              whitespace-normal
              shadow-2xl
              md:inset-y-0
              md:left-auto
              md:right-0
              md:max-h-none
              md:w-[26rem]
              md:rounded-none
              md:rounded-l-2xl
            "
            style={{
              backgroundColor: "var(--background)",
              borderColor: "var(--card-border)",
            }}
          >
            <header
              className="flex items-start gap-3 border-b p-4"
              style={{ borderColor: "var(--card-border)" }}
            >
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-medium uppercase tracking-wide opacity-60">
                  Paragraph comments
                </p>

                <p className="mt-1 line-clamp-3 text-sm italic opacity-80">
                  “{open.quote}”
                </p>
              </div>

              <button
                onClick={() => setOpen(null)}
                aria-label="Close"
                className="shrink-0 opacity-70 hover:opacity-100"
              >
                <X size={20} />
              </button>
            </header>

            <div className="flex-1 space-y-5 overflow-y-auto p-4">
              {panelComments.length > 0 ? (
                <CommentList
                  chapterId={chapterId}
                  currentUserId={currentUserId}
                  comments={panelComments}
                  profiles={profiles}
                  idPrefix="pc"
                  showParagraphChip={false}
                />
              ) : (
                <p className="text-sm opacity-70">
                  No comments on this paragraph yet.
                </p>
              )}

              {currentUserId ? (
                <div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={3}
                    placeholder="Comment on this paragraph..."
                    className="w-full resize-none rounded-lg border p-3 text-sm"
                    style={{
                      borderColor: "var(--card-border)",
                      backgroundColor: "var(--background)",
                    }}
                  />

                  <button
                    disabled={pending || !draft.trim()}
                    onClick={() =>
                      startTransition(async () => {
                        await createComment(
                          chapterId,
                          draft,
                          null,
                          open.index
                        );

                        setDraft("");
                      })
                    }
                    className="mt-3 rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--button)",
                      color: "var(--button-text)",
                    }}
                  >
                    {pending ? "Posting..." : "Post Comment"}
                  </button>
                </div>
              ) : (
                <p className="text-sm opacity-80">
                  <Link href="/auth/login" className="underline">
                    Sign in
                  </Link>{" "}
                  to comment on this paragraph.
                </p>
              )}
            </div>
          </aside>
        </>
      )}
    </>
  );
}