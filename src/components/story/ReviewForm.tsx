"use client";

import { useState, useTransition } from "react";
import StarRating from "./StarRating";
import {
  submitStoryReview,
  deleteStoryReview,
} from "@/app/actions/storyReviews";

type Props = {
  storyId: string;
  storySlug: string;
  initialRating?: number;
  initialReview?: string;
};

export default function ReviewForm({
  storyId,
  storySlug,
  initialRating = 0,
  initialReview = "",
}: Props) {
  const [rating, setRating] =
    useState(initialRating);

  const [review, setReview] =
    useState(initialReview);

  const [pending, startTransition] =
    useTransition();

  return (
    <div
      className="
        rounded-xl
        border
        p-6
        mt-10
      "
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: "var(--card)",
      }}
    >
      <h2 className="text-2xl font-bold mb-5">
        Your Review
      </h2>

      <StarRating
        value={rating}
        onChange={setRating}
      />

      <textarea
        value={review}
        onChange={(e) =>
          setReview(e.target.value)
        }
        rows={6}
        placeholder="Share your thoughts..."
        className="
          mt-5
          w-full
          rounded-lg
          border
          p-4
        "
        style={{
          borderColor: "var(--card-border)",
        }}
      />

      <div className="flex gap-3 mt-5">

        <button
          disabled={pending || rating === 0}
          onClick={() =>
            startTransition(async () => {
              await submitStoryReview(
                storyId,
                storySlug,
                rating,
                review
              );
            })
          }
          className="
            rounded-lg
            px-5
            py-3
            font-semibold
          "
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          Save Review
        </button>

        <button
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              await deleteStoryReview(
                storyId,
                storySlug
              );

              setRating(0);
              setReview("");
            })
          }
          className="
            rounded-lg
            border
            px-5
            py-3
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Delete
        </button>

      </div>
    </div>
  );
}