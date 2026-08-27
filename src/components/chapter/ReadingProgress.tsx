"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";

type Props = {
  storyId: string;
  chapterId: string;
};

export default function ReadingProgress({
  storyId,
  chapterId,
}: Props) {
  const supabase = createClient();

  const lastSavedProgress = useRef(-1);
  const saveTimeout = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    async function saveProgress(progress: number) {
      if (cancelled) return;

      if (progress === lastSavedProgress.current) {
        return;
      }

      lastSavedProgress.current = progress;

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user || cancelled) return;

      await supabase
        .from("reading_history")
        .upsert(
          {
            user_id: user.id,
            story_id: storyId,
            chapter_id: chapterId,
            progress,
            last_read_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,story_id",
          }
        );
    }

    function calculateProgress() {
      const content = document.getElementById(
        "chapter-reading-content"
      );

      if (!content) {
        return;
      }

      const rect = content.getBoundingClientRect();

      const contentTop =
        window.scrollY + rect.top;

      const contentBottom =
        contentTop + content.offsetHeight;

      const viewportBottom =
        window.scrollY + window.innerHeight;

      const totalReadingDistance =
        contentBottom - contentTop - window.innerHeight;

      if (totalReadingDistance <= 0) {
        saveProgress(100);
        return;
      }

      const currentReadingDistance =
        viewportBottom - contentTop;

      const progress = Math.min(
        100,
        Math.max(
          0,
          Math.round(
            (currentReadingDistance /
              totalReadingDistance) *
              100
          )
        )
      );

      if (
        progress === 0 ||
        progress === 25 ||
        progress === 50 ||
        progress === 75 ||
        progress === 100
      ) {
        saveProgress(progress);
        return;
      }

      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }

      saveTimeout.current = setTimeout(() => {
        saveProgress(progress);
      }, 2000);
    }

    window.addEventListener(
      "scroll",
      calculateProgress,
      { passive: true }
    );

    calculateProgress();

    return () => {
      cancelled = true;

      window.removeEventListener(
        "scroll",
        calculateProgress
      );

      if (saveTimeout.current) {
        clearTimeout(saveTimeout.current);
      }
    };
  }, [storyId, chapterId, supabase]);

  return null;
}