"use client";

import { useState } from "react";

/*
 * A date-and-time picker that works in the admin's own time zone but
 * submits an exact moment (ISO, UTC), so the saved time never drifts
 * with the server's time zone. Leave it empty for "no date".
 */
export default function LocalDateTimeInput({
  name,
  defaultValue,
}: {
  name: string;
  defaultValue?: string | null;
}) {
  const [local, setLocal] = useState(() => toLocalInput(defaultValue));

  const iso = local ? new Date(local).toISOString() : "";

  return (
    <>
      <input
        type="datetime-local"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none"
        style={{ borderColor: "var(--card-border)" }}
      />
      <input type="hidden" name={name} value={iso} />
      {local ? (
        <button
          type="button"
          onClick={() => setLocal("")}
          className="mt-1 text-xs underline opacity-60"
        >
          Clear
        </button>
      ) : null}
    </>
  );
}

function toLocalInput(value?: string | null) {
  if (!value) return "";

  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(
    d.getDate()
  )}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
