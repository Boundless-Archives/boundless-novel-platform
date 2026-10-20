"use client";

import { useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";

export default function CopyLinkButton({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  async function share() {
    try {
      await navigator.share({
        title: "Join me on Boundless",
        text: "Read and write original stories on Boundless.",
        url: link,
      });
    } catch {}
  }

  const canShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  return (
    <div className="mt-3 flex flex-wrap gap-2">
      <button
        onClick={copy}
        className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
        style={{
          backgroundColor: "var(--button)",
          color: "var(--button-text)",
        }}
      >
        {copied ? <Check size={15} /> : <Copy size={15} />}
        {copied ? "Copied!" : "Copy link"}
      </button>

      {canShare && (
        <button
          onClick={share}
          className="inline-flex items-center gap-2 rounded-lg border border-card-border px-4 py-2 text-sm font-medium"
        >
          <Share2 size={15} />
          Share
        </button>
      )}
    </div>
  );
}