"use client";

import { useState, type ReactNode } from "react";

/* Blurs spoiler content until the reader chooses to reveal it. */
export default function SpoilerGate({
  chapter,
  storyTitle,
  children,
}: {
  chapter: number;
  storyTitle: string;
  children: ReactNode;
}) {
  const [shown, setShown] = useState(false);

  if (shown) return <>{children}</>;

  return (
    <div className="relative mt-6">
      <div aria-hidden className="pointer-events-none select-none blur-md opacity-60">
        {children}
      </div>

      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div
          className="max-w-sm rounded-2xl border p-5 text-center shadow-xl"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}
        >
          <p className="text-2xl">🔒</p>
          <p className="mt-2 font-semibold">Spoilers ahead</p>
          <p className="mt-1 text-sm opacity-75">
            This entry is revealed in chapter {chapter} of {storyTitle}. Keep reading to unlock it
            naturally.
          </p>
          <button
            type="button"
            onClick={() => setShown(true)}
            className="mt-4 rounded-lg border px-4 py-2 text-sm font-medium"
            style={{ borderColor: "var(--card-border)" }}
          >
            Show it anyway
          </button>
        </div>
      </div>
    </div>
  );
}
