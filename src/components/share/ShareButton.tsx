"use client";

import { useState } from "react";
import SharePanel from "./SharePanel";

/* A "Share" button that opens a small menu. `path` is a site path such as /story/my-book. */
export default function ShareButton({
  path,
  title,
  label = "Share",
  className = "",
}: {
  path: string;
  title: string;
  label?: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`rounded-lg border px-4 py-2 font-medium transition hover:opacity-80 ${className}`}
        style={{ borderColor: "var(--card-border)" }}
      >
        🔗 {label}
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close share menu"
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute left-0 z-50 mt-2 w-72 max-w-[85vw] rounded-xl border p-3 shadow-lg"
            style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card)" }}
          >
            <SharePanel path={path} title={title} />
          </div>
        </>
      )}
    </div>
  );
}
