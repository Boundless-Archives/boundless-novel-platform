"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function createComment(
  chapterId: string,
  comment: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  if (!comment.trim()) return;

  await supabase
    .from("chapter_comments")
    .insert({
      chapter_id: chapterId,
      user_id: user.id,
      comment: comment.trim(),
    });

  const { data: chapter, error: chapterError } = await supabase
    .from("chapters")
    .select("title, story_id, stories ( author_id, title )")
    .eq("id", chapterId)
    .maybeSingle();

  if (chapterError) {
    console.error("Chapter lookup failed:", chapterError.message);
  }

  const story = Array.isArray(chapter?.stories)
    ? chapter?.stories[0]
    : chapter?.stories;

  if (story && story.author_id !== user.id) {
    const { data: commenter } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle();

    const commenterName =
      commenter?.display_name ?? commenter?.username ?? "Someone";

    const { error: notifyError } = await createAdminClient()
      .from("notifications")
      .insert({
        user_id: story.author_id,
        actor_id: user.id,
        type: "chapter_comment",
        title: "New comment",
        message: `${commenterName} commented on "${
          chapter?.title ?? story.title
        }".`,
        link: `/chapter/${chapterId}`,
      });

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