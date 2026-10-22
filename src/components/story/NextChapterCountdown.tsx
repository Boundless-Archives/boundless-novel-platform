"use client";

import { useEffect, useState } from "react";

function format(ms: number): string {
  const mins = Math.max(0, Math.floor(ms / 60000));
  const d = Math.floor(mins / 1440);
  const h = Math.floor((mins % 1440) / 60);
  const m = mins % 60;
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${Math.max(m, 1)}m`;
}

export default function NextChapterCountdown({
  scheduledAt,
  chapterNumber,
}: {
  scheduledAt: string;
  chapterNumber: number;
}) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = new Date(scheduledAt).getTime();
    const tick = () => setLeft(target - Date.now());
    tick();
    const id = setInterval(tick, 30000);
    return () => clearInterval(id);
  }, [scheduledAt]);

  if (left === null || left <= 0) return null;

  return (
    <div className="mb-3 flex items-center gap-2 rounded border px-3 py-2 text-sm">
      <span aria-hidden>⏳</span>
      <span>
        Chapter {chapterNumber} arrives in{" "}
        <span className="font-semibold">{format(left)}</span>
      </span>
    </div>
  );
}
