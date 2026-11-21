"use client";

import { useEffect, useSyncExternalStore } from "react";
import Link from "next/link";
import SharePanel from "./SharePanel";
import {
  PUBLISHED_EVENT,
  clearPublished,
  parsePublished,
  readPublishedRaw,
} from "@/lib/share";

function subscribe(cb: () => void) {
  window.addEventListener(PUBLISHED_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(PUBLISHED_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}

/*
 * Mounted once in the layout. After a writer publishes a chapter, the
 * publish screen leaves a note in sessionStorage and this pops up with a
 * congratulation and ready-made share options.
 */
export default function PublishCelebration() {
  const raw = useSyncExternalStore(subscribe, readPublishedRaw, () => "");
  const info = parsePublished(raw);
  const open = info !== null;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") clearPublished();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!info) return null;

  const path = `/chapter/${info.chapterId}`;
  const label = info.chapterNumber ? `Chapter ${info.chapterNumber}: ${info.chapterTitle}` : info.chapterTitle;

  return (
    <div
      className="fixed inset-0 z-[10001] flex items-end justify-center bg-black/60 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="publish-celebration-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) clearPublished();
      }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 shadow-2xl"
        style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card)" }}
      >
        <p className="text-4xl">🎉</p>
        <h2 id="publish-celebration-title" className="mt-2 text-2xl font-bold">
          Chapter published. Congratulations!
        </h2>
        <p className="mt-2 text-sm opacity-85">
          <span className="font-semibold">{label}</span> of <span className="font-semibold">{info.storyTitle}</span> is
          live. The first readers usually come from you, so tell a few people about it now.
        </p>

        <div className="mt-4">
          <SharePanel path={path} title={`${info.storyTitle}: ${label}`} />
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href={path} onClick={clearPublished} className="font-semibold underline underline-offset-4">
            View the chapter
          </Link>
          <button type="button" onClick={clearPublished} className="opacity-70 hover:opacity-100">
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
