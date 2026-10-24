"use client";

import { useState, useTransition } from "react";
import { reportContent } from "@/app/actions/reports";
import { REPORT_REASONS, type ReportTarget } from "@/lib/reports";

export default function ReportButton({
  type,
  targetId,
  label = "Report",
}: {
  type: ReportTarget;
  targetId: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [details, setDetails] = useState("");
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(
    null
  );
  const [pending, startTransition] = useTransition();

  if (result?.ok) {
    return <span className="text-sm opacity-70">{result.message}</span>;
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm opacity-60 transition hover:opacity-100"
      >
        ⚑ {label}
      </button>
    );
  }

  return (
    <div
      className="mt-3 w-full max-w-md rounded-xl border p-4 text-sm"
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: "var(--card)",
      }}
    >
      <p className="font-semibold">Why are you reporting this?</p>

      <select
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        aria-label="Reason"
        className="mt-3 w-full rounded-lg border bg-transparent px-3 py-2"
        style={{ borderColor: "var(--card-border)" }}
      >
        <option value="">Choose a reason…</option>
        {REPORT_REASONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>

      <textarea
        value={details}
        onChange={(e) => setDetails(e.target.value)}
        rows={3}
        maxLength={1000}
        placeholder="Anything we should know? (optional)"
        className="mt-3 w-full rounded-lg border bg-transparent px-3 py-2"
        style={{ borderColor: "var(--card-border)" }}
      />

      {result && !result.ok && (
        <p className="mt-2 text-red-500">{result.message}</p>
      )}

      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={!reason || pending}
          onClick={() =>
            startTransition(async () => {
              setResult(await reportContent(type, targetId, reason, details));
            })
          }
          className="rounded-lg px-4 py-2 font-semibold disabled:opacity-50"
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          {pending ? "Sending…" : "Send report"}
        </button>

        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setResult(null);
          }}
          className="opacity-70"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
