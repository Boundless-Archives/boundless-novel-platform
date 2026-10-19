"use client";

import { useEffect, useRef } from "react";
import {
  recordChapterCompletion,
  startChapterRead,
} from "@/app/streaks/actions";
import { tickReadingXP } from "@/app/cultivation/actions";
import {
  MIN_READ_SECONDS,
  SCROLL_COMPLETE_THRESHOLD,
} from "@/lib/streaks";

export default function ReadingTracker({
  chapterId,
}: {
  chapterId: string;
}) {
  const activeSecondsRef = useRef(0);
  const reachedScrollEndRef = useRef(false);
  const hasRegisteredRef = useRef(false);
  const isActiveRef = useRef(true);

  useEffect(() => {
    function updateActivity() {
      isActiveRef.current =
        document.visibilityState === "visible" &&
        document.hasFocus();
    }

    document.addEventListener(
      "visibilitychange",
      updateActivity
    );
    window.addEventListener("focus", updateActivity);
    window.addEventListener("blur", updateActivity);

    updateActivity();

    // Tell the server this chapter was just opened. Everything later
    // (reading minutes, "finished", the streak) is measured from here.
    startChapterRead(
      chapterId,
      Intl.DateTimeFormat().resolvedOptions().timeZone
    ).catch(() => {});

    const tick = setInterval(() => {
      if (isActiveRef.current) {
        activeSecondsRef.current += 1;

        if (activeSecondsRef.current % 60 === 0) {
          tickReadingXP(chapterId).catch(() => {});
        }
      }
      maybeRegister();
    }, 1000);

    function handleScroll() {
      const scrollTop = window.scrollY;
      const viewportHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      if (fullHeight <= viewportHeight) {
        reachedScrollEndRef.current = true;
        maybeRegister();
        return;
      }

      const scrolled =
        (scrollTop + viewportHeight) / fullHeight;

      if (scrolled >= SCROLL_COMPLETE_THRESHOLD) {
        reachedScrollEndRef.current = true;
        maybeRegister();
      }
    }

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    // The horizontal page reader reports its progress instead of scrolling
    function handleReaderProgress(e: Event) {
      const value = (e as CustomEvent<{ progress: number }>).detail?.progress;

      if (
        typeof value === "number" &&
        value / 100 >= SCROLL_COMPLETE_THRESHOLD
      ) {
        reachedScrollEndRef.current = true;
        maybeRegister();
      }
    }

    window.addEventListener("reader-progress", handleReaderProgress);

    async function maybeRegister() {
      if (hasRegisteredRef.current) return;

      if (
        activeSecondsRef.current >= MIN_READ_SECONDS &&
        reachedScrollEndRef.current
      ) {
        hasRegisteredRef.current = true;

        try {
          await recordChapterCompletion(
            chapterId,
            new Date().getHours(),
            Intl.DateTimeFormat().resolvedOptions().timeZone
          );
        } catch {
          // Silent — reading streaks are a bonus, not
          // something that should ever interrupt reading.
        }
      }
    }

    return () => {
      document.removeEventListener(
        "visibilitychange",
        updateActivity
      );
      window.removeEventListener("focus", updateActivity);
      window.removeEventListener("blur", updateActivity);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("reader-progress", handleReaderProgress);
      clearInterval(tick);
    };
  }, [chapterId]);

  return null;
}