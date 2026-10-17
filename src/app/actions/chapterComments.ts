"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  makeSnippet,
  resolveParagraphIndex,
  splitParagraphs,
} from "@/lib/paragraphs";

/*
 * Create a comment, a reply (replyToCommentId), or a paragraph comment
 * (paragraphIndex). Replies are one level deep: replying to a reply attaches
 * it to the same top-level comment, so threads stay readable on phones.
 */
export async function createComment(
  chapterId: string,
  comment: string,
  replyToCommentId?: string | null,
  paragraphIndex?: number | null
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const text = comment.trim();

  if (!text) return;

  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("title, content, story_id, stories ( author_id, title )")
    .eq("id", chapterId)
    .maybeSingle();

  if (chapterError) {
    console.error("Chapter lookup failed:", chapterError.message);
  }

  if (!chapter) return;

  const paragraphs = splitParagraphs(chapter.content ?? "");

  let parentId: string | null = null;
  let replyTarget: { id: string; user_id: string } | null = null;
  let pIndex: number | null = null;
  let pSnippet: string | null = null;

  if (replyToCommentId) {
    const { data: target } = await supabase
      .from("chapter_comments")
      .select(
        "id, user_id, parent_id, chapter_id, paragraph_index, paragraph_snippet"
      )
      .eq("id", replyToCommentId)
      .maybeSingle();

    if (!target || target.chapter_id !== chapterId) return;

    parentId = target.parent_id ?? target.id;
    replyTarget = { id: target.id, user_id: target.user_id };

    // a reply stays in the same paragraph thread as the comment it answers
    pIndex = target.paragraph_index ?? null;
    pSnippet = target.paragraph_snippet ?? null;
  } else if (
    typeof paragraphIndex === "number" &&
    Number.isInteger(paragraphIndex) &&
    paragraphs[paragraphIndex]
  ) {
    pIndex = paragraphIndex;
    pSnippet = makeSnippet(paragraphs[paragraphIndex]);
  }

  const { data: inserted, error: insertError } = await supabase
    .from("chapter_comments")
    .insert({
      chapter_id: chapterId,
      user_id: user.id,
      comment: text,
      parent_id: parentId,
      paragraph_index: pIndex,
      paragraph_snippet: pSnippet,
    })
    .select("id")
    .single();

  if (insertError || !inserted) {
    console.error("Comment insert failed:", insertError?.message);
    return;
  }

  const story = Array.isArray(chapter.stories)
    ? chapter.stories[0]
    : chapter.stories;

  const chapterName = chapter.title ?? story?.title ?? "a chapter";

  const toNotify: { user_id: string; title: string; message: string }[] = [];

  const { data: commenter } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const commenterName =
    commenter?.display_name ?? commenter?.username ?? "Someone";

  // Tell the person being replied to
  if (replyTarget && replyTarget.user_id !== user.id) {
    toNotify.push({
      user_id: replyTarget.user_id,
      title: "New reply",
      message: `${commenterName} replied to your comment on "${chapterName}".`,
    });
  }

  // Tell the author (unless they are the commenter, or already notified above)
  if (
    story &&
    story.author_id !== user.id &&
    story.author_id !== replyTarget?.user_id
  ) {
    const onParagraph = !replyTarget && pIndex !== null;

    toNotify.push({
      user_id: story.author_id,
      title: replyTarget ? "New reply" : "New comment",
      message: replyTarget
        ? `${commenterName} replied in a discussion on "${chapterName}".`
        : onParagraph
          ? `${commenterName} commented on a paragraph in "${chapterName}".`
          : `${commenterName} commented on "${chapterName}".`,
    });
  }

  if (toNotify.length > 0) {
    // Paragraph comments open their paragraph; others jump to the comment
    const resolved =
      pIndex === null
        ? null
        : resolveParagraphIndex(paragraphs, pIndex, pSnippet);

    const link =
      resolved !== null
        ? `/chapter/${chapterId}#para-${resolved}-${inserted.id}`
        : `/chapter/${chapterId}#comment-${inserted.id}`;

    const { error: notifyError } = await createAdminClient()
      .from("notifications")
      .insert(
        toNotify.map((n) => ({
          user_id: n.user_id,
          actor_id: user.id,
          type: "chapter_comment",
          title: n.title,
          message: n.message,
          link,
        }))
      );

    if (notifyError) {
      console.error("Notification failed:", notifyError.message);
    }
  }

  revalidatePath(`/chapter/${chapterId}`);
}

export async function updateComment(
  commentId: string,
  chapterId: string,
  comment: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("chapter_comments")
    .update({
      comment: comment.trim(),
    })
    .eq("id", commentId)
    .eq("user_id", user.id);

  revalidatePath(`/chapter/${chapterId}`);
}

export async function deleteComment(
  commentId: string,
  chapterId: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("chapter_comments")
    .delete()
    .eq("id", commentId)
    .eq("user_id", user.id);

  revalidatePath(`/chapter/${chapterId}`);
}