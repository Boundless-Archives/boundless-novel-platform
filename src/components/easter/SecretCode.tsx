"use client";

import { useEffect, useRef, useState } from "react";
import { unlockSecretBadge } from "@/app/badges/secret";

/*
 * The hidden code. Same idea as the classic Konami code, with a
 * touch version for phones:
 *
 *   Keyboard:  ↑ ↑ ↓ ↓ ← → ← → B A
 *   Touch:     swipe up, up, down, down, left, right, left, right,
 *              then tap, tap
 *
 * Renders nothing until it fires. Each input has to arrive within
 * 4 seconds of the last one or the sequence starts over.
 */

type Token = "U" | "D" | "L" | "R" | "T";

const SEQUENCE: Token[] = [
  "U", "U", "D", "D", "L", "R", "L", "R", "T", "T",
];

const MAX_GAP_MS = 4000;
const MIN_SWIPE_PX = 50;
const MAX_TAP_PX = 10;

const KEY_TO_TOKEN: Record<string, Token> = {
  ArrowUp: "U",
  ArrowDown: "D",
  ArrowLeft: "L",
  ArrowRight: "R",
  b: "T",
  B: "T",
  a: "T",
  A: "T",
};

export default function SecretCode() {
  const bufferRef = useRef<Token[]>([]);
  const lastInputRef = useRef(0);
  const busyRef = useRef(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    function push(token: Token) {
      const now = Date.now();

      if (now - lastInputRef.current > MAX_GAP_MS) {
        bufferRef.current = [];
      }

      lastInputRef.current = now;

      bufferRef.current.push(token);

      if (bufferRef.current.length > SEQUENCE.length) {
        bufferRef.current.shift();
      }

      const matched =
        bufferRef.current.length === SEQUENCE.length &&
        bufferRef.current.every((t, i) => t === SEQUENCE[i]);

      if (matched && !busyRef.current) {
        busyRef.current = true;
        bufferRef.current = [];

        unlockSecretBadge()
          .then((result) => {
            if (result.awarded) {
              setToast("✨ You found a secret. Check your badges!");
              setTimeout(() => setToast(""), 5000);
            }
          })
          .catch(() => {})
          .finally(() => {
            busyRef.current = false;
          });
      }
    }

    function isTyping(target: EventTarget | null) {
      const el = target as HTMLElement | null;

      return Boolean(
        el &&
          (el.tagName === "INPUT" ||
            el.tagName === "TEXTAREA" ||
            el.isContentEditable)
      );
    }

    function onKeyDown(e: KeyboardEvent) {
      if (isTyping(e.target)) return;

      const token = KEY_TO_TOKEN[e.key];

      if (token) push(token);
    }

    let startX = 0;
    let startY = 0;

    function onTouchStart(e: TouchEvent) {
      if (e.touches.length !== 1) return;

      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      if (e.changedTouches.length !== 1) return;
      if (isTyping(e.target)) return;

      const dx = e.changedTouches[0].clientX - startX;
      const dy = e.changedTouches[0].clientY - startY;

      if (Math.abs(dx) < MAX_TAP_PX && Math.abs(dy) < MAX_TAP_PX) {
        push("T");
        return;
      }

      if (Math.max(Math.abs(dx), Math.abs(dy)) < MIN_SWIPE_PX) {
        return;
      }

      if (Math.abs(dy) > Math.abs(dx)) {
        push(dy < 0 ? "U" : "D");
      } else {
        push(dx < 0 ? "L" : "R");
      }
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("touchstart", onTouchStart, {
      passive: true,
    });
    window.addEventListener("touchend", onTouchEnd, {
      passive: true,
    });

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  if (!toast) return null;

  return (
    <div
      role="status"
      className="fixed bottom-16 left-1/2 z-50 -translate-x-1/2 rounded-full border border-card-border bg-card px-4 py-2 text-sm font-medium text-foreground shadow-lg"
    >
      {toast}
    </div>
  );
}