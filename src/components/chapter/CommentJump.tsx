"use client";

import { useEffect } from "react";

/*
 * Scrolls to a comment (#comment-ID) or the discussion (#comments) when the
 * page opens with that hash, e.g. from a notification. Needed because the
 * browser tries to jump before the comments have rendered.
 */
export default function CommentJump() {
  useEffect(() => {
    const raw = window.location.hash;

    if (!raw) return;

    const id = decodeURIComponent(raw.slice(1));

    if (id !== "comments" && !id.startsWith("comment-")) return;

    let tries = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let flashTimer: ReturnType<typeof setTimeout> | undefined;

    const attempt = () => {
      const target = document.getElementById(id);

      if (target) {
        target.scrollIntoView({
          behavior: "smooth",
          block: id === "comments" ? "start" : "center",
        });

        if (id.startsWith("comment-")) {
          target.classList.add("comment-flash");
          flashTimer = setTimeout(
            () => target.classList.remove("comment-flash"),
            2600
          );
        }

        return;
      }

      tries += 1;

      if (tries < 12) {
        timer = setTimeout(attempt, 150);
        return;
      }

      // the comment was deleted or isn't visible: fall back to the discussion
      document
        .getElementById("comments")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    };

    timer = setTimeout(attempt, 100);

    return () => {
      clearTimeout(timer);
      clearTimeout(flashTimer);
    };
  }, []);

  return null;
}