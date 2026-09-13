"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

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

    const { data: story } = await supabase
      .from("stories")
      .select("author_id, title")
      .eq("id", storyId)
      .maybeSingle();

    if (story && story.author_id !== user.id) {
      const { data: reviewer } = await supabase
        .from("profiles")
        .select("username, display_name")
        .eq("id", user.id)
        .maybeSingle();

      const reviewerName =
        reviewer?.display_name ?? reviewer?.username ?? "Someone";

      const { error: notifyError } = await createAdminClient()
        .from("notifications")
        .insert({
          user_id: story.author_id,
          actor_id: user.id,
          type: "story_review",
          title: "New review",
          message: `${reviewerName} left a ${rating}-star review on "${story.title}".`,
          link: `/story/${storySlug}`,
        });

      if (notifyError) {
        console.error("Notification failed:", notifyError.message);
      }
    }
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