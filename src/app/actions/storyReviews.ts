"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function submitStoryReview(
  storyId: string,
  storySlug: string,
  rating: number,
  review: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: existing } = await supabase
    .from("story_reviews")
    .select("id")
    .eq("story_id", storyId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase
      .from("story_reviews")
      .update({
        rating,
        review,
      })
      .eq("id", existing.id);
  } else {
    await supabase
      .from("story_reviews")
      .insert({
        story_id: storyId,
        user_id: user.id,
        rating,
        review,
      });
  }

  await supabase.rpc("sync_story_reviews", {
    story_uuid: storyId,
  });

  revalidatePath("/");
  revalidatePath(`/story/${storySlug}`);
}

export async function deleteStoryReview(
  storyId: string,
  storySlug: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  await supabase
    .from("story_reviews")
    .delete()
    .eq("story_id", storyId)
    .eq("user_id", user.id);

  await supabase.rpc("sync_story_reviews", {
    story_uuid: storyId,
  });

  revalidatePath("/");
  revalidatePath(`/story/${storySlug}`);
}