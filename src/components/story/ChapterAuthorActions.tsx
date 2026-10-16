"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Props = {
  chapterId: string;
  title: string;
  status: string;
};

const buttonStyle = { borderColor: "var(--card-border)" };

/*
 * Unpublish (back to Draft) and Delete for a chapter the author owns.
 * The database only lets a story's author do either.
 */
export default function ChapterAuthorActions({
  chapterId,
  title,
  status,
}: Props) {
  const router = useRouter();
  const supabase = createClient();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function unpublish() {
    if (
      !window.confirm(
        `Move "${title}" back to drafts? Readers will no longer be able to see it.`
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");

    const { data, error: updateError } = await supabase
      .from("chapters")
      .update({
        status: "Draft",
        published_at: null,
        scheduled_at: null,
      })
      .eq("id", chapterId)
      .select("id");

    setBusy(false);

    if (updateError || !data || data.length === 0) {
      setError(updateError?.message ?? "Couldn't unpublish this chapter.");
      return;
    }

    router.refresh();
  }

  async function remove() {
    const warning =
      status === "Published"
        ? `Delete "${title}" permanently? It is published, so readers will lose it too. This can't be undone.`
        : `Delete "${title}" permanently? This can't be undone.`;

    if (!window.confirm(warning)) return;

    setBusy(true);
    setError("");

    const { data, error: deleteError } = await supabase
      .from("chapters")
      .delete()
      .eq("id", chapterId)
      .select("id");

    setBusy(false);

    if (deleteError || !data || data.length === 0) {
      setError(deleteError?.message ?? "Couldn't delete this chapter.");
      return;
    }

    router.refresh();
  }

  return (
    <>
      {status === "Published" && (
        <button
          type="button"
          onClick={unpublish}
          disabled={busy}
          className="border rounded-lg px-4 py-2 disabled:opacity-50"
          style={buttonStyle}
        >
          Unpublish
        </button>
      )}

      <button
        type="button"
        onClick={remove}
        disabled={busy}
        className="border rounded-lg px-4 py-2 text-red-500 disabled:opacity-50"
        style={buttonStyle}
      >
        Delete
      </button>

      {error && (
        <span role="alert" className="w-full text-sm text-red-500">
          {error}
        </span>
      )}
    </>
  );
}

/* "Scheduled · 15 Oct, 12:00" in the viewer's own time zone. */
export function ScheduledPill({ scheduledAt }: { scheduledAt: string }) {
  return (
    <span
      className="px-2 py-1 rounded-full text-xs font-medium border"
      style={buttonStyle}
      suppressHydrationWarning
    >
      Scheduled ·{" "}
      {new Date(scheduledAt).toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short",
      })}
    </span>
  );
}