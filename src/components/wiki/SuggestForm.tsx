import { ENTITY_TYPES, getEntityTypeLabel } from "@/lib/entityTypes";
import { submitSuggestionAction } from "@/app/wiki/communityActions";

const FIELD = "w-full rounded-lg border p-3 text-sm";

export const SUGGEST_MESSAGES: Record<string, string> = {
  ok: "✓ Sent! The universe's author will review it.",
  limit: "You have too many suggestions waiting. Try again once some are reviewed.",
  invalid: "That suggestion was incomplete or too long.",
  own: "You can edit this universe directly.",
  missing: "That entry no longer exists.",
  failed: "Something went wrong. Please try again.",
};

/* A reader's suggestion for a new entry, or an edit to an existing one. */
export default function SuggestForm({
  kind,
  universeId,
  entityId,
  returnTo,
  defaultSummary,
}: {
  kind: "new" | "edit";
  universeId: string;
  entityId?: string;
  returnTo: string;
  defaultSummary?: string;
}) {
  return (
    <details
      className="rounded-xl border p-4"
      style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}
    >
      <summary className="cursor-pointer text-sm font-semibold">
        {kind === "new" ? "💡 Suggest a new entry" : "✏️ Suggest an edit"}
      </summary>

      <form action={submitSuggestionAction} className="mt-4 space-y-3">
        <input type="hidden" name="kind" value={kind} />
        <input type="hidden" name="universeId" value={universeId} />
        <input type="hidden" name="returnTo" value={returnTo} />
        {entityId && <input type="hidden" name="entityId" value={entityId} />}

        {kind === "new" && (
          <>
            <input
              name="name"
              required
              maxLength={80}
              placeholder="Name"
              className={FIELD}
              style={{ borderColor: "var(--card-border)" }}
            />
            <select
              name="entityType"
              className={FIELD}
              style={{ borderColor: "var(--card-border)" }}
              defaultValue="character"
            >
              {ENTITY_TYPES.map((t) => (
                <option key={t} value={t}>
                  {getEntityTypeLabel(t)}
                </option>
              ))}
            </select>
          </>
        )}

        <textarea
          name="summary"
          required={kind === "new"}
          maxLength={400}
          rows={2}
          defaultValue={defaultSummary}
          placeholder={kind === "new" ? "One or two sentences about it" : "New summary (leave empty to keep the current one)"}
          className={FIELD}
          style={{ borderColor: "var(--card-border)" }}
        />

        <textarea
          name="content"
          maxLength={6000}
          rows={5}
          placeholder={
            kind === "new"
              ? "Full entry (optional). Supports **bold**, *italic* and ## headings."
              : "New full entry (leave empty to keep the current one)"
          }
          className={FIELD}
          style={{ borderColor: "var(--card-border)" }}
        />

        <input
          name="note"
          maxLength={500}
          placeholder="Note to the author (optional)"
          className={FIELD}
          style={{ borderColor: "var(--card-border)" }}
        />

        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}
        >
          Send suggestion
        </button>
        <p className="text-xs opacity-60">The author decides whether to accept it. Up to 3 can be waiting at a time.</p>
      </form>
    </details>
  );
}
