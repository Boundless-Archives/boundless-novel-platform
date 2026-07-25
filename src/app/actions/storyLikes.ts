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

  if (existingLike) {
    await supabase
      .from("story_likes")
      .delete()
      .eq("id", existingLike.id);

    await supabase.rpc("decrement_story_likes", {
      story_uuid: storyId,
    });
  } else {
    await supabase
      .from("story_likes")
      .insert({
        story_id: storyId,
        user_id: user.id,
      });

    await supabase.rpc("increment_story_likes", {
      story_uuid: storyId,
    });
  }

  revalidatePath("/");
  revalidatePath(`/story/${storySlug}`);
}