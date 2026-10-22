"use client";

import {
  POLL_MAX_OPTIONS,
  POLL_OPTION_MAX,
  POLL_QUESTION_MAX,
} from "@/lib/engage";

export type PollDraft = {
  enabled: boolean;
  question: string;
  options: string[];
  closesAt: string; // datetime-local value, or ""
  locked: boolean; // votes exist: options can't change
};

export const EMPTY_POLL: PollDraft = {
  enabled: false,
  question: "",
  options: ["", ""],
  closesAt: "",
  locked: false,
};

/* Optional reader poll shown at the end of a chapter. */
export default function PollEditor({
  poll,
  onChange,
}: {
  poll: PollDraft;
  onChange: (poll: PollDraft) => void;
}) {
  const set = (patch: Partial<PollDraft>) => onChange({ ...poll, ...patch });

  return (
    <div>
      <label className="flex items-center gap-2 font-medium">
        <input
          type="checkbox"
          checked={poll.enabled}
          onChange={(e) => set({ enabled: e.target.checked })}
        />
        Add a reader poll to the end of this chapter (optional)
      </label>

      {poll.enabled && (
        <div
          className="mt-3 space-y-3 rounded-lg border p-4"
          style={{ borderColor: "var(--card-border)" }}
        >
          <input
            value={poll.question}
            onChange={(e) =>
              set({ question: e.target.value.slice(0, POLL_QUESTION_MAX) })
            }
            placeholder="Your question, e.g. What should Kai do next?"
            className="w-full rounded-lg border bg-transparent p-3"
            style={{ borderColor: "var(--card-border)" }}
          />

          {poll.options.map((option, i) => (
            <div key={i} className="flex gap-2">
              <input
                value={option}
                disabled={poll.locked}
                onChange={(e) => {
                  const next = [...poll.options];
                  next[i] = e.target.value.slice(0, POLL_OPTION_MAX);
                  set({ options: next });
                }}
                placeholder={`Option ${i + 1}`}
                className="min-w-0 flex-1 rounded-lg border bg-transparent p-3 disabled:opacity-60"
                style={{ borderColor: "var(--card-border)" }}
              />
              {!poll.locked && poll.options.length > 2 && (
                <button
                  type="button"
                  onClick={() =>
                    set({ options: poll.options.filter((_, j) => j !== i) })
                  }
                  className="rounded-lg border px-3"
                  style={{ borderColor: "var(--card-border)" }}
                  aria-label={`Remove option ${i + 1}`}
                >
                  ×
                </button>
              )}
            </div>
          ))}

          {!poll.locked && poll.options.length < POLL_MAX_OPTIONS && (
            <button
              type="button"
              onClick={() => set({ options: [...poll.options, ""] })}
              className="text-sm underline opacity-80"
            >
              + Add an option
            </button>
          )}

          {poll.locked && (
            <p className="text-xs opacity-60">
              Readers have voted, so the options are locked. You can still
              change the question or the close time.
            </p>
          )}

          <label className="block text-sm">
            <span className="mb-1 block opacity-70">
              Closes at (optional, your local time)
            </span>
            <input
              type="datetime-local"
              value={poll.closesAt}
              onChange={(e) => set({ closesAt: e.target.value })}
              className="rounded-lg border bg-transparent p-2"
              style={{ borderColor: "var(--card-border)" }}
            />
          </label>
        </div>
      )}
    </div>
  );
}
