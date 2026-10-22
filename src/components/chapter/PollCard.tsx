"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { votePoll } from "@/app/actions/chapterPolls";
import type { PollView } from "@/lib/engage";

/* The reader-facing poll at the end of a chapter. */
export default function PollCard({
  chapterId,
  initial,
  signedIn,
}: {
  chapterId: string;
  initial: PollView;
  signedIn: boolean;
}) {
  const [poll, setPoll] = useState<PollView>(initial);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const showResults = poll.counts !== null;
  const total = poll.total ?? 0;

  function vote(index: number) {
    setError("");

    startTransition(async () => {
      const res = await votePoll(chapterId, poll.id, index);

      if (res.error) {
        setError(res.error);
        return;
      }

      if (res.poll) setPoll(res.poll);
    });
  }

  return (
    <section
      className="mx-auto mt-10 max-w-3xl rounded-2xl border p-6 text-base leading-normal whitespace-normal"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <p className="text-xs font-semibold uppercase tracking-wide opacity-60">
        {poll.closed ? "Poll (closed)" : "Poll from the author"}
      </p>

      <h3 className="mt-2 text-xl font-bold">{poll.question}</h3>

      <ul className="mt-4 space-y-2">
        {poll.options.map((option, i) => {
          const n = poll.counts?.[i] ?? 0;
          const share = total > 0 ? Math.round((n / total) * 100) : 0;
          const mine = poll.my_vote === i;

          if (showResults) {
            return (
              <li
                key={i}
                className="relative overflow-hidden rounded-xl border px-4 py-3"
                style={{
                  borderColor: mine ? "var(--accent)" : "var(--card-border)",
                }}
              >
                <div
                  className="absolute inset-y-0 left-0 opacity-20"
                  style={{
                    width: `${share}%`,
                    backgroundColor: "var(--accent)",
                  }}
                />
                <div className="relative flex items-center justify-between gap-3 text-sm">
                  <span className="font-medium">
                    {option}
                    {mine && (
                      <span className="ml-2 text-xs opacity-60">· your vote</span>
                    )}
                  </span>
                  <span className="shrink-0 tabular-nums opacity-70">
                    {share}% · {n}
                  </span>
                </div>
              </li>
            );
          }

          return (
            <li key={i}>
              <button
                type="button"
                disabled={pending || !signedIn || poll.closed}
                onClick={() => vote(i)}
                className="w-full rounded-xl border px-4 py-3 text-left text-sm font-medium transition hover:-translate-y-0.5 disabled:opacity-60"
                style={{ borderColor: "var(--card-border)" }}
              >
                {option}
              </button>
            </li>
          );
        })}
      </ul>

      {showResults ? (
        <p className="mt-3 text-xs opacity-60">
          {total} vote{total === 1 ? "" : "s"}
          {poll.is_author ? " · only you see results until readers vote" : ""}
        </p>
      ) : !signedIn ? (
        <p className="mt-3 text-sm opacity-80">
          <Link href="/auth/login" className="underline">
            Sign in
          </Link>{" "}
          to vote and see the results.
        </p>
      ) : (
        <p className="mt-3 text-xs opacity-60">
          Vote to see how everyone else answered. You can&apos;t change your
          vote.
        </p>
      )}

      {poll.closes_at && !poll.closed && (
        <p className="mt-1 text-xs opacity-50">
          Closes{" "}
          {new Date(poll.closes_at).toLocaleString("en-US", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          })}{" "}
          UTC
        </p>
      )}

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
    </section>
  );
}
