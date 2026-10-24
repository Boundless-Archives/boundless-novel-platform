"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ReportButton from "@/components/moderation/ReportButton";

export type ReviewItem = {
  id: string;
  userId: string;
  name: string | null;
  username: string | null;
  rating: number;
  text: string;
  dateLabel: string;
  createdAt: string;
};

const PREVIEW = 3;

type Sort = "newest" | "highest" | "lowest";

/*
 * Reviews on a story page. Long review lists no longer push everything
 * below them out of reach: three reviews show first (the reader's own,
 * then the most substantial ones), and "Show all" opens a scrolling list
 * with a rating breakdown you can click to filter, and sorting.
 */
export default function ReviewList({
  reviews,
  myUserId,
}: {
  reviews: ReviewItem[];
  myUserId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");
  const [stars, setStars] = useState<number | null>(null);

  const total = reviews.length;

  const featured = useMemo(() => {
    const mine = reviews.filter((r) => r.userId === myUserId);
    const rest = reviews
      .filter((r) => r.userId !== myUserId)
      .sort(
        (a, b) =>
          b.text.trim().length - a.text.trim().length ||
          b.createdAt.localeCompare(a.createdAt)
      );
    return [...mine, ...rest].slice(0, PREVIEW);
  }, [reviews, myUserId]);

  const counts = useMemo(() => {
    const c = [0, 0, 0, 0, 0, 0];
    for (const r of reviews) c[Math.min(5, Math.max(1, r.rating))] += 1;
    return c;
  }, [reviews]);

  const all = useMemo(() => {
    const list = reviews.filter((r) => stars === null || r.rating === stars);
    return list.sort((a, b) =>
      sort === "highest"
        ? b.rating - a.rating || b.createdAt.localeCompare(a.createdAt)
        : sort === "lowest"
          ? a.rating - b.rating || b.createdAt.localeCompare(a.createdAt)
          : b.createdAt.localeCompare(a.createdAt)
    );
  }, [reviews, sort, stars]);

  if (total === 0) return null;

  const small = total <= PREVIEW;
  const shown = open || small ? all : featured;

  return (
    <div className="mt-10">
      {open && !small && (
        <div className="mb-4 space-y-3">
          <div className="space-y-1.5">
            {[5, 4, 3, 2, 1].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setStars(stars === n ? null : n)}
                className="flex w-full items-center gap-3 text-sm"
                aria-pressed={stars === n}
              >
                <span className="w-8 text-left">{n} ★</span>
                <span
                  className="h-2 flex-1 rounded-full"
                  style={{ backgroundColor: "var(--card-border)" }}
                >
                  <span
                    className="block h-2 rounded-full"
                    style={{
                      width: `${(counts[n] / total) * 100}%`,
                      backgroundColor:
                        stars === null || stars === n
                          ? "var(--accent)"
                          : "var(--card-border)",
                    }}
                  />
                </span>
                <span className="w-6 text-right opacity-60">{counts[n]}</span>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              aria-label="Sort reviews"
              className="rounded-lg border bg-transparent px-3 py-2 text-sm"
              style={{ borderColor: "var(--card-border)" }}
            >
              <option value="newest">Newest</option>
              <option value="highest">Highest rated</option>
              <option value="lowest">Lowest rated</option>
            </select>

            {stars !== null && (
              <button
                type="button"
                onClick={() => setStars(null)}
                className="text-sm underline opacity-70"
              >
                Clear {stars}★ filter
              </button>
            )}
          </div>
        </div>
      )}

      <div
        className={`space-y-5 ${
          open && !small ? "max-h-[32rem] overflow-y-auto pr-1" : ""
        }`}
      >
        {shown.length === 0 ? (
          <p className="py-4 text-sm opacity-60">No reviews match that.</p>
        ) : (
          shown.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border p-5"
              style={{
                borderColor: "var(--card-border)",
                backgroundColor: "var(--card)",
              }}
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="font-semibold">
                    {review.username ? (
                      <Link
                        href={`/author/${review.username}`}
                        className="hover:underline"
                      >
                        {review.name ?? review.username}
                      </Link>
                    ) : (
                      "Unknown Reader"
                    )}
                    {review.userId === myUserId && (
                      <span className="ml-2 text-xs font-normal opacity-60">
                        · your review
                      </span>
                    )}
                  </h3>

                  <div className="mt-1 text-yellow-500">
                    {"★".repeat(review.rating)}
                    {"☆".repeat(5 - review.rating)}
                  </div>
                </div>

                <div className="shrink-0 text-sm opacity-60">
                  {review.dateLabel}
                </div>
              </div>

              {review.text.trim() && (
                <p className="mt-4 whitespace-pre-wrap opacity-90">
                  {review.text}
                </p>
              )}

              {myUserId && review.userId !== myUserId && (
                <div className="mt-3">
                  <ReportButton type="review" targetId={review.id} />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {!small && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 w-full rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: "var(--card-border)" }}
        >
          Show all {total} reviews
        </button>
      )}

      {!small && open && (
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setStars(null);
          }}
          className="mt-4 w-full rounded-xl border px-4 py-3 text-sm font-semibold"
          style={{ borderColor: "var(--card-border)" }}
        >
          Show fewer
        </button>
      )}
    </div>
  );
}
