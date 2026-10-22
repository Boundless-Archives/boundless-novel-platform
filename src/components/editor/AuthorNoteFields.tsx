"use client";

import { AUTHOR_NOTE_MAX, MIN_STREAK_WORDS } from "@/lib/writing";
import { countWords } from "@/lib/wordCount";

/*
 * The optional author's note plus a live word count for the chapter.
 * The note is stored separately from the chapter text, so it never
 * counts toward words, XP or your writing streak.
 */
export default function AuthorNoteFields({
  content,
  note,
  position,
  onNote,
  onPosition,
}: {
  content: string;
  note: string;
  position: "before" | "after";
  onNote: (value: string) => void;
  onPosition: (value: "before" | "after") => void;
}) {
  const words = countWords(content);

  return (
    <>
      <p className="-mt-3 text-sm opacity-70">
        {words.toLocaleString("en-US")} words
        {words < MIN_STREAK_WORDS
          ? ` · ${MIN_STREAK_WORDS}+ words are needed for this chapter to count toward your writing streak`
          : " · counts toward your writing streak"}
      </p>

      <div>
        <label className="mb-2 block font-medium">
          Author&apos;s note (optional)
        </label>

        <textarea
          value={note}
          onChange={(e) => onNote(e.target.value.slice(0, AUTHOR_NOTE_MAX))}
          rows={4}
          placeholder="A message to your readers: thanks, news, a release schedule..."
          className="w-full rounded-lg border bg-transparent p-3"
          style={{ borderColor: "var(--card-border)" }}
        />

        <div className="mt-2 flex flex-wrap items-center justify-between gap-3 text-xs opacity-70">
          <label className="flex items-center gap-2">
            Show it
            <select
              value={position}
              onChange={(e) =>
                onPosition(e.target.value === "before" ? "before" : "after")
              }
              className="rounded border bg-transparent px-2 py-1"
              style={{ borderColor: "var(--card-border)" }}
            >
              <option value="after">after the chapter</option>
              <option value="before">before the chapter</option>
            </select>
          </label>

          <span>
            {note.length}/{AUTHOR_NOTE_MAX}. Shown separately from the story
            and not counted as words.
          </span>
        </div>
      </div>
    </>
  );
}
