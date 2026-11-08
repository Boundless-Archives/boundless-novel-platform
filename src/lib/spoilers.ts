import type { SupabaseClient } from "@supabase/supabase-js";

/*
 * Spoiler-safe wiki: an author can hide an entry until the reader has
 * reached chapter N of the entry's origin story. Authors and co-authors
 * always see everything.
 */

export type LockableEntity = {
  origin_story_id: string | null;
  reveal_chapter: number | null;
};

/* Highest chapter number the viewer has reached, per story. */
export async function getReadingProgress(
  supabase: SupabaseClient,
  userId: string | null | undefined,
  storyIds: string[]
): Promise<Map<string, number>> {
  const progress = new Map<string, number>();
  if (!userId || storyIds.length === 0) return progress;

  const { data } = await supabase
    .from("reading_history")
    .select("story_id, chapters ( chapter_number )")
    .eq("user_id", userId)
    .in("story_id", storyIds);

  for (const row of data ?? []) {
    const chapter = Array.isArray(row.chapters) ? row.chapters[0] : row.chapters;
    if (chapter?.chapter_number != null) {
      progress.set(row.story_id, chapter.chapter_number);
    }
  }

  return progress;
}

/* The chapter that unlocks the entry for this viewer, or null if visible. */
export function lockedUntil(
  entity: LockableEntity,
  progress: Map<string, number>,
  canSeeAll: boolean
): number | null {
  if (canSeeAll || !entity.reveal_chapter || !entity.origin_story_id) return null;
  const reached = progress.get(entity.origin_story_id) ?? 0;
  return reached >= entity.reveal_chapter ? null : entity.reveal_chapter;
}
