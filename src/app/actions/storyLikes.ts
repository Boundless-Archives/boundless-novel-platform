"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function toggleStoryLike(
  storyId: string,
  storySlug: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existingLike } = await supabase
    .from("story_likes")
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", user.id)
    .maybeSingle();

  /*
   * The like count on story_stats is kept up to date by database
   * triggers on story_likes, so this only needs to add or remove
   * the like row itself.
   */
  if (existingLike) {
    await supabase
      .from("story_likes")
      .delete()
      .eq("id", existingLike.id);
  } else {
    await supabase
      .from("story_likes")
      .insert({
        story_id: storyId,
        user_id: user.id,
      });
  }

  revalidatePath("/");
  revalidatePath(`/story/${storySlug}`);
}