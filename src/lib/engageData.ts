import { createAdminClient } from "@/utils/supabase/admin";
import type { PollView, ReactionRow } from "@/lib/engage";

/* Server-side readers for reactions and polls (the tables are closed to
   the browser; these call the database functions as the app). */

export async function fetchReactions(
  chapterId: string,
  userId: string | null
): Promise<ReactionRow[]> {
  const { data } = await createAdminClient().rpc("chapter_reactions", {
    p_chapter: chapterId,
    p_user: userId,
  });

  return (data ?? []) as ReactionRow[];
}

export async function fetchPoll(
  chapterId: string,
  userId: string | null
): Promise<PollView | null> {
  const { data } = await createAdminClient().rpc("get_chapter_poll", {
    p_chapter: chapterId,
    p_user: userId,
  });

  return (data ?? null) as PollView | null;
}
