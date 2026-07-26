"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

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