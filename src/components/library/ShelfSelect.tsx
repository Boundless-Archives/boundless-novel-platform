"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { SHELVES, isShelf, type Shelf } from "@/lib/shelves";

/* Moves one saved story to another shelf. */
export default function ShelfSelect({
  storyId,
  initial,
  onChange,
}: {
  storyId: string;
  initial: Shelf;
  onChange?: (shelf: Shelf) => void;
}) {
  const [shelf, setShelf] = useState<Shelf>(initial);
  const [busy, setBusy] = useState(false);

  async function move(next: string) {
    if (!isShelf(next) || next === shelf) return;

    setBusy(true);
    const previous = shelf;
    setShelf(next);

    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = user
      ? await supabase
          .from("library")
          .update({ shelf: next })
          .eq("user_id", user.id)
          .eq("story_id", storyId)
      : { error: new Error("Not signed in") };

    setBusy(false);

    if (error) {
      setShelf(previous);
      alert("Couldn't move that story. Please try again.");
      return;
    }

    onChange?.(next);
  }

  return (
    <select
      value={shelf}
      disabled={busy}
      onChange={(e) => move(e.target.value)}
      aria-label="Shelf"
      className="rounded-lg border bg-transparent px-3 py-2 text-sm"
      style={{ borderColor: "var(--card-border)" }}
    >
      {SHELVES.map((s) => (
        <option key={s.value} value={s.value}>
          {s.icon} {s.label}
        </option>
      ))}
    </select>
  );
}
