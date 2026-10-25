"use client";

import { useRef } from "react";

/*
 * Date pickers give the viewer's local time with no timezone. This turns
 * them into exact moments (UTC) in hidden fields before sending.
 */
export default function EventForm({
  action,
  guildId,
  guildSlug,
}: {
  action: (formData: FormData) => void | Promise<void>;
  guildId?: string;
  guildSlug?: string;
}) {
  const startRef = useRef<HTMLInputElement>(null);
  const endRef = useRef<HTMLInputElement>(null);
  const startIso = useRef<HTMLInputElement>(null);
  const endIso = useRef<HTMLInputElement>(null);

  const field = "mt-1 w-full rounded-lg border bg-transparent px-3 py-2";
  const border = { borderColor: "var(--card-border)" };

  return (
    <form
      action={action}
      className="space-y-4"
      onSubmit={() => {
        const s = startRef.current?.value;
        const e = endRef.current?.value;
        if (startIso.current) startIso.current.value = s ? new Date(s).toISOString() : "";
        if (endIso.current) endIso.current.value = e ? new Date(e).toISOString() : "";
      }}
    >
      {guildId && <input type="hidden" name="guildId" value={guildId} />}
      {guildSlug && <input type="hidden" name="guildSlug" value={guildSlug} />}
      <input type="hidden" name="startsAt" ref={startIso} />
      <input type="hidden" name="endsAt" ref={endIso} />

      <label className="block text-sm font-semibold">
        Title
        <input name="title" required minLength={3} maxLength={100} className={field} style={border} />
      </label>

      <label className="block text-sm font-semibold">
        Short summary
        <input name="summary" maxLength={200} className={field} style={border} placeholder="One line shown in the list" />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold">
          Starts
          <input ref={startRef} type="datetime-local" required className={field} style={border} />
        </label>
        <label className="block text-sm font-semibold">
          Ends (optional)
          <input ref={endRef} type="datetime-local" className={field} style={border} />
        </label>
      </div>

      <label className="block text-sm font-semibold">
        Details
        <textarea name="body" rows={5} maxLength={3000} className={field} style={border} />
      </label>

      <label className="block text-sm font-semibold">
        Link (optional)
        <input name="link" maxLength={300} className={field} style={border} placeholder="https://… or /story/…" />
      </label>

      <button
        type="submit"
        className="rounded-lg px-5 py-2.5 font-semibold"
        style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}
      >
        Create event
      </button>
    </form>
  );
}
