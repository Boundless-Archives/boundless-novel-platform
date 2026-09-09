"use client";

import { useState, useTransition } from "react";
import { reviewTierSubmission } from "@/app/tier-submissions/actions";

type Props = {
  submissionId: string;
};

export default function TierSubmissionActions({
  submissionId,
}: Props) {
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function handleReview(approve: boolean) {
    startTransition(async () => {
      try {
        await reviewTierSubmission(
          submissionId,
          approve,
          notes
        );
        setDone(true);
      } catch (error) {
        console.error(error);
      }
    });
  }

  if (done) {
    return (
      <span className="text-sm opacity-60">Reviewed ✓</span>
    );
  }

  return (
    <div className="mt-3">
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Reviewer notes (optional, shared with the author)"
        rows={2}
        className="w-full border rounded-lg p-2 text-sm"
      />

      <div className="flex gap-2 mt-2">
        <button
          type="button"
          onClick={() => handleReview(true)}
          disabled={isPending}
          className="
            px-3
            py-1.5
            rounded-lg
            text-sm
            font-medium
            disabled:opacity-50
          "
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          Approve
        </button>

        <button
          type="button"
          onClick={() => handleReview(false)}
          disabled={isPending}
          className="
            px-3
            py-1.5
            rounded-lg
            border
            text-sm
            font-medium
            disabled:opacity-50
          "
          style={{ borderColor: "var(--card-border)" }}
        >
          Reject
        </button>
      </div>
    </div>
  );
}