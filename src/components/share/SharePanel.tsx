"use client";

import { useState } from "react";
import { shareLinks, shareText } from "@/lib/share";

/* The row of share options: native share sheet, copy link, and common apps. */
export default function SharePanel({ path, title }: { path: string; title: string }) {
  const [copied, setCopied] = useState(false);

  const url = new URL(path, window.location.origin).toString();
  const text = shareText(title);
  const canNative = typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  }

  async function nativeShare() {
    try {
      await navigator.share({ title, text, url });
    } catch {
      /* the person closed the share sheet */
    }
  }

  const item = "rounded-lg border px-3 py-2 text-sm font-medium hover:opacity-80";
  const border = { borderColor: "var(--card-border)" };

  return (
    <div className="flex flex-wrap gap-2">
      {canNative && (
        <button type="button" onClick={nativeShare} className={item} style={border}>
          📤 Share…
        </button>
      )}
      <button type="button" onClick={copy} className={item} style={border}>
        {copied ? "✓ Link copied" : "🔗 Copy link"}
      </button>
      {shareLinks(url, text).map((l) => (
        <a key={l.key} href={l.href} target="_blank" rel="noopener noreferrer" className={item} style={border}>
          {l.label}
        </a>
      ))}
    </div>
  );
}
