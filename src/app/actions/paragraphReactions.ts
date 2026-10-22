"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { featureBlock } from "@/lib/platform";
import { isReactionEmoji } from "@/lib/engage";
import { splitParagraphs, makeSnippet } from "@/lib/paragraphs";

/*
 * React to a paragraph with an emoji. Passing the emoji you already
 * picked takes it back; passing null clears it. The reader always comes
 * from the session, and the paragraph text is read from the database,
 * never from the caller.
 */
export async function reactToParagraph(
  chapterId: string,
  paragraphIndex: number,
  emoji: string | null
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Please sign in to react." };

  if (emoji !== null && !isReactionEmoji(emoji)) {
    return { error: "That reaction isn't available." };
  }

  if (!Number.isInteger(paragraphIndex) || paragraphIndex < 0) {
    return { error: "That paragraph can't be found." };
  }

  const blocked = await featureBlock("comments", user.id);
  if (blocked) return { error: blocked };

  const admin = createAdminClient();

  const { data: chapter } = await admin
    .from("chapters")
    .select("content, status")
    .eq("id", chapterId)
    .maybeSingle();

  if (!chapter || chapter.status !== "Published") {
    return { error: "That chapter can't be found." };
  }

  const paragraphs = splitParagraphs(
    (chapter.content ?? "").replace(/&nbsp;| /g, " ")
  );

  if (paragraphIndex >= paragraphs.length) {
    return { error: "That paragraph can't be found." };
  }

  const { error } = await admin.rpc("set_paragraph_reaction", {
    p_user: user.id,
    p_chapter: chapterId,
    p_index: paragraphIndex,
    p_snippet: makeSnippet(paragraphs[paragraphIndex]),
    p_emoji: emoji,
  });

  if (error) return { error: error.message };

  return {};
}
