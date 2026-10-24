"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  createComment,
  updateComment,
  deleteComment,
} from "@/app/actions/chapterComments";
import { SNIPPET_LENGTH } from "@/lib/paragraphs";
import StyledName from "@/components/cosmetics/StyledName";
import ReportButton from "@/components/moderation/ReportButton";
import type { Cosmetic } from "@/lib/cosmetics";

type Comment = {
  id: string;
  user_id: string;
  comment: string;
  created_at: string;
  updated_at: string;
  parent_id?: string | null;
  paragraph_index?: number | null;
  paragraph_snippet?: string | null;
  resolved_paragraph?: number | null;
};

type ProfileMap = Map<
  string,
  {
    display_name: string | null;
    username: string | null;
    nameColor?: Cosmetic | null;
    title?: Cosmetic | null;
  }
>;

type Props = {
  chapterId: string;
  currentUserId?: string;
  comments: Comment[];
  profiles: ProfileMap;
  idPrefix?: string;
  showParagraphChip?: boolean;
};

export default function CommentList({
  chapterId,
  currentUserId,
  comments,
  profiles,
  idPrefix = "comment",
  showParagraphChip = true,
}: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const [replyingToId, setReplyingToId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [pending, startTransition] = useTransition();

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
        <div className="text-5xl mb-4">💬</div>

        <h3 className="text-2xl font-semibold">No comments yet</h3>

        <p className="mt-3 opacity-75">
          Be the first reader to start the discussion.
        </p>
      </div>
    );
  }

  // Group replies under their top-level comment (oldest reply first)
  const topLevel = comments.filter((c) => !c.parent_id);

  const repliesByParent = new Map<string, Comment[]>();

  for (const c of comments) {
    if (!c.parent_id) continue;
    const list = repliesByParent.get(c.parent_id) ?? [];
    list.push(c);
    repliesByParent.set(c.parent_id, list);
  }

  for (const list of repliesByParent.values()) {
    list.sort(
      (a, b) =>
        new Date(a.created_at).getTime() -
        new Date(b.created_at).getTime()
    );
  }

  function nameOf(userId: string) {
    const p = profiles.get(userId);
    return p?.display_name ?? p?.username ?? "Reader";
  }

  function renderName(userId: string) {
    const p = profiles.get(userId);
    const username = p?.username;

    const styled = (
      <StyledName
        name={nameOf(userId)}
        nameColor={p?.nameColor}
        title={p?.title}
      />
    );

    return username ? (
      <Link href={`/author/${username}`} className="hover:underline">
        {styled}
      </Link>
    ) : (
      styled
    );
  }  

  function startReply(target: Comment, isReply: boolean) {
    setReplyingToId(target.id);
    // replying to a reply: mention who you're answering
    setReplyText(isReply ? `@${nameOf(target.user_id)} ` : "");
  }

  function renderComment(comment: Comment, isReply: boolean) {
    const isOwner = currentUserId === comment.user_id;
    const replyCount = repliesByParent.get(comment.id)?.length ?? 0;

    return (
      <div
        key={comment.id}
        id={`${idPrefix}-${comment.id}`}
        className={`comment-card scroll-mt-24 rounded-xl border ${
          isReply ? "p-4" : "p-5"
        }`}
        style={{
          backgroundColor: isReply ? "transparent" : "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold">{renderName(comment.user_id)}</h3>

            <p className="text-sm opacity-60 mt-1">
              {new Date(comment.updated_at).toLocaleDateString()}
            </p>
          </div>

          {isOwner && (
            <div className="flex gap-3 text-sm">
              <button
                onClick={() => {
                  setEditingId(comment.id);
                  setEditingText(comment.comment);
                }}
              >
                ✏️ Edit
              </button>

              <button
                onClick={() => {
                  if (
                    replyCount > 0 &&
                    !window.confirm(
                      `This will also delete ${replyCount} ${
                        replyCount === 1 ? "reply" : "replies"
                      }. Continue?`
                    )
                  ) {
                    return;
                  }

                  startTransition(() =>
                    deleteComment(comment.id, chapterId)
                  );
                }}
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
              onChange={(e) => setEditingText(e.target.value)}
              rows={4}
              className="
                mt-4
                w-full
                rounded-lg
                border
                p-3
              "
              style={{
                borderColor: "var(--card-border)",
                backgroundColor: "var(--background)",
              }}
            />

            <div className="mt-3 flex gap-3">
              <button
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await updateComment(comment.id, chapterId, editingText);

                    setEditingId(null);
                  })
                }
                className="
                  rounded-lg
                  px-4
                  py-2
                "
                style={{
                  backgroundColor: "var(--button)",
                  color: "var(--button-text)",
                }}
              >
                Save
              </button>

              <button onClick={() => setEditingId(null)}>Cancel</button>
            </div>
          </>
        ) : (
          <p
            className={`whitespace-pre-wrap ${
              isReply ? "mt-3 leading-7" : "mt-5 leading-8"
            }`}
          >
            {comment.comment}
          </p>
        )}

        {showParagraphChip &&
          !isReply &&
          comment.paragraph_index != null &&
          (comment.resolved_paragraph != null ? (
            <button
              className="mt-4 block w-full rounded-lg border px-3 py-2 text-left text-sm opacity-80 transition hover:opacity-100"
              style={{ borderColor: "var(--card-border)" }}
              onClick={() =>
                window.dispatchEvent(
                  new CustomEvent("open-paragraph", {
                    detail: { index: comment.resolved_paragraph },
                  })
                )
              }
            >
              <span className="block text-[11px] uppercase tracking-wide opacity-60">
                On a paragraph
              </span>
              <span className="line-clamp-2 italic">
                “{comment.paragraph_snippet}
                {(comment.paragraph_snippet?.length ?? 0) >= SNIPPET_LENGTH
                  ? "…"
                  : ""}
                ”
              </span>
            </button>
          ) : (
            <p className="mt-4 text-xs opacity-60">
              On a paragraph that has since been edited: “
              {comment.paragraph_snippet}…”
            </p>
          ))}

        {currentUserId && editingId !== comment.id && (
          <div className="mt-3">
            {replyingToId === comment.id ? (
              <div>
                <textarea
                  autoFocus
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={3}
                  placeholder="Write a reply..."
                  className="
                    w-full
                    rounded-lg
                    border
                    p-3
                  "
                  style={{
                    borderColor: "var(--card-border)",
                    backgroundColor: "var(--background)",
                  }}
                />

                <div className="mt-3 flex gap-3">
                  <button
                    disabled={pending || !replyText.trim()}
                    onClick={() =>
                      startTransition(async () => {
                        const res = await createComment(chapterId, replyText, comment.id);

                        if (res?.error) {
                          alert(res.error);
                          return;
                        }

                        setReplyText("");
                        setReplyingToId(null);
                      })
                    }
                    className="
                      rounded-lg
                      px-4
                      py-2
                      text-sm
                      disabled:opacity-50
                    "
                    style={{
                      backgroundColor: "var(--button)",
                      color: "var(--button-text)",
                    }}
                  >
                    {pending ? "Posting..." : "Post Reply"}
                  </button>

                  <button
                    className="text-sm opacity-70"
                    onClick={() => {
                      setReplyingToId(null);
                      setReplyText("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-wrap items-start gap-x-5 gap-y-2">
                <button
                  className="text-sm opacity-70 hover:opacity-100 transition"
                  onClick={() => startReply(comment, isReply)}
                >
                  ↩ Reply
                </button>

                {!isOwner && (
                  <ReportButton type="comment" targetId={comment.id} />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {topLevel.map((comment) => {
        const replies = repliesByParent.get(comment.id) ?? [];

        return (
          <div key={comment.id}>
            {renderComment(comment, false)}

            {replies.length > 0 && (
              <div
                className="mt-3 ml-4 space-y-3 border-l-2 pl-4 sm:ml-8"
                style={{ borderColor: "var(--card-border)" }}
              >
                {replies.map((reply) => renderComment(reply, true))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}