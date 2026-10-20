import type { SupabaseClient } from "@supabase/supabase-js";

export type ContinueItem = {
  storyId: string;
  title: string;
  slug: string;
  coverUrl: string | null;
  chapterId: string;
  chapterNumber: number;
  chapterTitle: string;
  progress: number;
  // True when the last chapter was finished and a newer one is waiting.
  isNext: boolean;
};

type Row = {
  story_id: string;
  chapter_id: string | null;
  progress: number | null;
  stories:
    | { title: string; slug: string; cover_url: string | null; status: string }
    | { title: string; slug: string; cover_url: string | null; status: string }[]
    | null;
  chapters:
    | { title: string; chapter_number: number }
    | { title: string; chapter_number: number }[]
    | null;
};

const one = <T,>(v: T | T[] | null): T | null =>
  Array.isArray(v) ? (v[0] ?? null) : v;

/*
 * The stories a reader is in the middle of, newest first. A story whose
 * current chapter is finished jumps to the next published chapter, and
 * stories on the "finished" or "dropped" shelves (or fully caught up)
 * are left out.
 */
export async function getContinueReading(
  supabase: SupabaseClient,
  userId: string,
  limit = 6
): Promise<ContinueItem[]> {
  const { data } = await supabase
    .from("reading_history")
    .select(
      "story_id, chapter_id, progress, stories ( title, slug, cover_url, status ), chapters ( title, chapter_number )"
    )
    .eq("user_id", userId)
    .not("chapter_id", "is", null)
    .order("last_read_at", { ascending: false })
    .limit(limit * 2);

  const rows = ((data ?? []) as unknown as Row[]).filter(
    (r) => one(r.stories) && one(r.chapters)
  );

  if (rows.length === 0) return [];

  const ids = rows.map((r) => r.story_id);

  const { data: shelved } = await supabase
    .from("library")
    .select("story_id, shelf")
    .eq("user_id", userId)
    .in("story_id", ids);

  const hidden = new Set(
    (shelved ?? [])
      .filter((l) => l.shelf === "finished" || l.shelf === "dropped")
      .map((l) => l.story_id as string)
  );

  const finishedIds = rows
    .filter((r) => (r.progress ?? 0) >= 95 && !hidden.has(r.story_id))
    .map((r) => r.story_id);

  const nextByStory = new Map<
    string,
    { id: string; chapter_number: number; title: string }
  >();

  if (finishedIds.length > 0) {
    const { data: later } = await supabase
      .from("chapters")
      .select("id, story_id, chapter_number, title")
      .in("story_id", finishedIds)
      .eq("status", "Published")
      .order("chapter_number", { ascending: true });

    for (const r of rows) {
      const cur = one(r.chapters)!.chapter_number;
      const next = (later ?? []).find(
        (c) => c.story_id === r.story_id && c.chapter_number > cur
      );
      if (next) nextByStory.set(r.story_id, next);
    }
  }

  const items: ContinueItem[] = [];

  for (const r of rows) {
    if (hidden.has(r.story_id)) continue;

    const story = one(r.stories)!;
    const chapter = one(r.chapters)!;
    const finishedChapter = (r.progress ?? 0) >= 95;
    const next = nextByStory.get(r.story_id);

    // Finished the latest chapter: nothing to continue until a new one lands.
    if (finishedChapter && !next) continue;

    items.push({
      storyId: r.story_id,
      title: story.title,
      slug: story.slug,
      coverUrl: story.cover_url,
      chapterId: next ? next.id : (r.chapter_id as string),
      chapterNumber: next ? next.chapter_number : chapter.chapter_number,
      chapterTitle: next ? next.title : chapter.title,
      progress: next ? 0 : Math.max(0, Math.min(100, r.progress ?? 0)),
      isNext: !!next,
    });

    if (items.length >= limit) break;
  }

  return items;
}
