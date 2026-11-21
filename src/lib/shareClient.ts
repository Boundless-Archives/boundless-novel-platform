"use client";

import type { SupabaseClient } from "@supabase/supabase-js";
import { rememberPublished } from "./share";

/*
 * Call after a chapter has been published from the browser. It looks up the
 * chapter and its story, then asks the layout to show the congratulation
 * popup. It never throws: a failed lookup just means no popup.
 */
export async function celebratePublish(supabase: SupabaseClient, chapterId: string) {
  try {
    const { data } = await supabase
      .from("chapters")
      .select("id, title, chapter_number, stories ( title, slug )")
      .eq("id", chapterId)
      .maybeSingle();

    if (!data) return;

    const rel = data.stories as unknown;
    const story = (Array.isArray(rel) ? rel[0] : rel) as { title?: string; slug?: string } | null;
    if (!story?.slug) return;

    rememberPublished({
      chapterId,
      chapterTitle: (data.title as string) || "Your chapter",
      chapterNumber: (data.chapter_number as number | null) ?? null,
      storyTitle: story.title ?? "your story",
      storySlug: story.slug,
    });
  } catch {
    /* never block publishing */
  }
}
