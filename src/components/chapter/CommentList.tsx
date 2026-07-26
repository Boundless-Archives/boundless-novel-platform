"use client";

import { useState, useTransition } from "react";
import {
  updateComment,
  deleteComment,
} from "@/app/actions/chapterComments";

type Comment = {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
};

type ProfileMap = Map<
  string,
  {
    display_name: string | null;
    username: string | null;
  }
>;

type Props = {
  chapterId: string;
  currentUserId?: string;
  comments: Comment[];
  profiles: ProfileMap;
};

export default function CommentList({
  chapterId,
  currentUserId,
  comments,
  profiles,
}: Props) {
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [editingText, setEditingText] =
    useState("");

  const [pending, startTransition] =
    useTransition();

  if (!comments.length) {
    return (
      <div
        className="
          rounded-xl
          border
          p-10
          text-center
        "
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="text-5xl mb-4">
          💬
        </div>

        <h3 className="text-2xl font-semibold">
          No comments yet
        </h3>

        <p className="mt-3 opacity-75">
          Be the first reader to start the discussion.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {comments.map((comment) => {
        const profile =
          profiles.get(comment.user_id);

        const isOwner =
          currentUserId === comment.user_id;

        return (
          <div
            key={comment.id}
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
            <div className="flex justify-between items-start">

              <div>

                <h3 className="font-semibold">
                  {profile?.display_name ??
                    profile?.username ??
                    "Reader"}
                </h3>

                <p className="text-sm opacity-60 mt-1">
                  {new Date(
                    comment.updated_at
                  ).toLocaleDateString()}
                </p>

              </div>

              {isOwner && (
                <div className="flex gap-3 text-sm">

                  <button
                    onClick={() => {
                      setEditingId(comment.id);
                      setEditingText(
                        comment.comment
                      );
                    }}
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() =>
                      startTransition(() =>
                        deleteComment(
                          comment.id,
                          chapterId
                        )
                      )
                    }
                  >
                    🗑 Delete
                  </button>

                </div>
              )}

            </div>

            {editingId === comment.id ? (
              <>
                <textarea
                  value={editingText}
                  onChange={(e) =>
                    setEditingText(
                      e.target.value
                    )
                  }
                  rows={4}
                  className="
                    mt-4
                    w-full
                    rounded-lg
                    border
                    p-3
                  "
                  style={{
                    borderColor:
                      "var(--card-border)",
                    backgroundColor:
                      "var(--background)",
                  }}
                />

                <div className="mt-3 flex gap-3">

                  <button
                    disabled={pending}
                    onClick={() =>
                      startTransition(async () => {
                        await updateComment(
                          comment.id,
                          chapterId,
                          editingText
                        );

                        setEditingId(null);
                      })
                    }
                    className="
                      rounded-lg
                      px-4
                      py-2
                    "
                    style={{
                      backgroundColor:
                        "var(--button)",
                      color:
                        "var(--button-text)",
                    }}
                  >
                    Save
                  </button>

                  <button
                    onClick={() =>
                      setEditingId(null)
                    }
                  >
                    Cancel
                  </button>

                </div>
              </>
            ) : (
              <p className="mt-5 whitespace-pre-wrap leading-8">
                {comment.comment}
              </p>
            )}
          </div>
        );
      })}

    </div>
  );
}