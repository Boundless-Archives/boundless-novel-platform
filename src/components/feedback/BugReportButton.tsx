"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bug, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function BugReportButton() {
  const supabase = createClient();

  const [open, setOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // Check sign-in state each time the form is opened.
  useEffect(() => {
    if (!open) return;

    let cancelled = false;

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!cancelled) setLoggedIn(Boolean(user));
    });

    return () => {
      cancelled = true;
    };
  }, [open, supabase]);

  function close() {
    setOpen(false);
    setSent(false);
    setError("");
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (sending) return;

    setError("");

    const cleanTitle = title.trim();
    const cleanDescription = description.trim();

    if (cleanTitle.length < 3) {
      setError("Please give the bug a short title.");
      return;
    }

    if (cleanDescription.length < 10) {
      setError("Please describe what went wrong (at least a sentence).");
      return;
    }

    setSending(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoggedIn(false);
      setSending(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("bug_reports")
      .insert({
        user_id: user.id,
        title: cleanTitle,
        description: cleanDescription,
        page_url: window.location.href.slice(0, 500),
        user_agent: navigator.userAgent.slice(0, 500),
      });

    setSending(false);

    if (insertError) {
      setError(insertError.message);
      return;
    }

    setTitle("");
    setDescription("");
    setSent(true);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Report a bug"
        title="Report a bug"
        className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full border border-card-border bg-card px-3 py-2 text-xs font-medium text-foreground shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <Bug size={14} />
        <span className="hidden sm:inline">Report a bug</span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={close}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Report a bug"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 text-foreground shadow-xl"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">Report a bug</h2>
                <p className="mt-1 text-xs opacity-60">
                  Tell us what went wrong. We automatically include the
                  page you&apos;re on.
                </p>
              </div>

              <button
                type="button"
                onClick={close}
                aria-label="Close"
                className="rounded-lg p-1 opacity-60 transition hover:opacity-100"
              >
                <X size={18} />
              </button>
            </div>

            {sent ? (
              <div className="space-y-4">
                <p className="text-sm">
                  Thank you! Your report has been sent to the team.
                </p>

                <button
                  type="button"
                  onClick={close}
                  className="w-full rounded-xl border border-card-border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
                >
                  Close
                </button>
              </div>
            ) : loggedIn === false ? (
              <p className="text-sm">
                Please{" "}
                <Link href="/auth/login" className="underline">
                  log in
                </Link>{" "}
                to report a bug.
              </p>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Short title"
                  maxLength={120}
                  disabled={sending}
                  className="w-full rounded-xl border border-card-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2"
                  required
                />

                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What happened? What did you expect to happen?"
                  rows={5}
                  maxLength={4000}
                  disabled={sending}
                  className="w-full rounded-xl border border-card-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2"
                  required
                />

                {error && (
                  <p role="alert" className="text-sm text-red-500">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={sending}
                  className="w-full rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90 disabled:opacity-60"
                >
                  {sending ? "Sending..." : "Send report"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}