"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

export async function notifyFollowersOfNewChapter(
  storyId: string,
  chapterId: string
) {
  const supabase = await createClient();

  const { data: story } = await supabase
    .from("stories")
    .select("id, title, slug, author_id")
    .eq("id", storyId)
    .maybeSingle();

  if (!story) return;

  const { data: chapter } = await supabase
    .from("chapters")
    .select("title, chapter_number")
    .eq("id", chapterId)
    .maybeSingle();

  const { data: followers } = await supabase
    .from("followers")
    .select("follower_id")
    .eq("following_id", story.author_id);

  if (!followers || followers.length === 0) return;

  const adminClient = createAdminClient();

  const { error } = await adminClient.from("notifications").insert(
    followers.map((f) => ({
      user_id: f.follower_id,
      actor_id: story.author_id,
      type: "followed_author_update",
      title: "New chapter published",
      message: `A new chapter${
        chapter?.title ? ` — "${chapter.title}"` : ""
      } is out for "${story.title}".`,
      link: `/story/${story.slug}`,
    }))
  );

  if (error) {
    console.error("Follower notification failed:", error.message);
  }
}