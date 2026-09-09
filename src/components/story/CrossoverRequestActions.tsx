"use client";

import { useState, useTransition } from "react";
import {
  respondToCrossoverRequest,
  cancelCrossoverRequest,
} from "@/app/crossovers/actions";

type Props = {
  requestId: string;
  mode: "incoming" | "outgoing";
};

export default function CrossoverRequestActions({
  requestId,
  mode,
}: Props) {
  const [isPending, startTransition] = useTransition();
  const [done, setDone] = useState(false);

  function respond(accept: boolean) {
    startTransition(async () => {
      try {
        await respondToCrossoverRequest(requestId, accept);
        setDone(true);
      } catch (error) {
        console.error(error);
      }
    });
  }

  function cancel() {
    startTransition(async () => {
      try {
        await cancelCrossoverRequest(requestId);
        setDone(true);
      } catch (error) {
        console.error(error);
      }
    });
  }

  if (done) {
    return (
      <span className="text-sm opacity-60">Updated ✓</span>
    );
  }

  if (mode === "outgoing") {
    return (
      <button
        type="button"
        onClick={cancel}
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
        Cancel
      </button>
    );
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        onClick={() => respond(true)}
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
        Accept
      </button>

      <button
        type="button"
        onClick={() => respond(false)}
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
        Decline
      </button>
    </div>
  );
}