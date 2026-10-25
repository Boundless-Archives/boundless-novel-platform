"use server";

import { createClient } from "@/utils/supabase/server";

export type OfflineChapter = {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
};

/*
 * Fetches the full text of a story's published chapters, only when
 * someone presses "Download for offline". The story page itself no longer
 * carries the whole book. Runs as the signed-in reader, so the same access
 * rules as reading apply.
 */
export async function getBookForOffline(
  storyId: string
): Promise<OfflineChapter[]> {
  if (typeof storyId !== "string" || storyId.length > 64) return [];

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chapters")
    .select("id, chapter_number, title, content")
    .eq("story_id", storyId)
    .eq("status", "Published")
    .order("chapter_number");

  if (error) {
    console.error("getBookForOffline failed:", error.message);
    return [];
  }

  return (data ?? []) as OfflineChapter[];
}
