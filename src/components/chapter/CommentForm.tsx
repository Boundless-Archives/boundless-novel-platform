"use client";

import { useState, useTransition } from "react";
import { createComment } from "@/app/actions/chapterComments";

type Props = {
  chapterId: string;
};

export default function CommentForm({
  chapterId,
}: Props) {
  const [comment, setComment] = useState("");

  const [pending, startTransition] =
    useTransition();

  return (
    <div
      className="
        rounded-xl
        border
        p-5
      "
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >

      <h3 className="text-xl font-semibold">
        Join the Discussion
      </h3>

      <textarea
        value={comment}
        onChange={(e) =>
          setComment(e.target.value)
        }
        rows={5}
        placeholder="Share your thoughts about this chapter..."
        className="
          mt-5
          w-full
          rounded-lg
          border
          p-4
          resize-none
        "
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "var(--background)",
        }}
      />

      <button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await createComment(
              chapterId,
              comment
            );

            setComment("");
          })
        }
        className="
          mt-5
          rounded-lg
          px-5
          py-3
          font-medium
        "
        style={{
          backgroundColor: "var(--button)",
          color: "var(--button-text)",
        }}
      >
        {pending
          ? "Posting..."
          : "Post Comment"}
      </button>

    </div>
  );
}