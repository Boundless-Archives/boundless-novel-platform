"use client";

import { useEffect, useRef } from "react";
import { recordChapterCompletion } from "@/app/streaks/actions";
import { tickReadingXP } from "@/app/cultivation/actions";
import {
  MIN_READ_SECONDS,
  SCROLL_COMPLETE_THRESHOLD,
} from "@/lib/streaks";

export default function ReadingTracker() {
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

    const tick = setInterval(() => {
      if (isActiveRef.current) {
        activeSecondsRef.current += 1;

        if (activeSecondsRef.current % 60 === 0) {
          tickReadingXP().catch(() => {});
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

    async function maybeRegister() {
      if (hasRegisteredRef.current) return;

      if (
        activeSecondsRef.current >= MIN_READ_SECONDS &&
        reachedScrollEndRef.current
      ) {
        hasRegisteredRef.current = true;

        try {
          await recordChapterCompletion(new Date().getHours());
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
      clearInterval(tick);
    };
  }, []);

  return null;
}