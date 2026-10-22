"use server";

import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { featureBlock } from "@/lib/platform";
import { fetchPoll } from "@/lib/engageData";
import {
  POLL_MAX_OPTIONS,
  POLL_OPTION_MAX,
  POLL_QUESTION_MAX,
  type PollView,
} from "@/lib/engage";

async function sessionUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

/* A reader votes. Returns the poll as they now see it (with results). */
export async function votePoll(
  chapterId: string,
  pollId: string,
  option: number
): Promise<{ error?: string; poll?: PollView | null }> {
  const user = await sessionUser();

  if (!user) return { error: "Please sign in to vote." };

  const blocked = await featureBlock("comments", user.id);
  if (blocked) return { error: blocked };

  if (!Number.isInteger(option) || option < 0 || option >= POLL_MAX_OPTIONS) {
    return { error: "Pick one of the options." };
  }

  const { error } = await createAdminClient().rpc("cast_poll_vote", {
    p_user: user.id,
    p_poll: pollId,
    p_option: option,
  });

  if (error) return { error: error.message };

  return { poll: await fetchPoll(chapterId, user.id) };
}

/* The author's own poll for a chapter, for the editor. */
export async function getMyChapterPoll(
  chapterId: string
): Promise<PollView | null> {
  const user = await sessionUser();

  if (!user) return null;

  const poll = await fetchPoll(chapterId, user.id);

  return poll?.is_author ? poll : null;
}

export async function saveChapterPoll(
  chapterId: string,
  input: {
    question: string;
    options: string[];
    closesAt: string | null;
  }
): Promise<{ error?: string }> {
  const user = await sessionUser();

  if (!user) return { error: "You must be logged in." };

  const question = String(input.question ?? "").trim();

  if (question.length < 3 || question.length > POLL_QUESTION_MAX) {
    return {
      error: `The question needs 3 to ${POLL_QUESTION_MAX} characters.`,
    };
  }

  const options = (input.options ?? [])
    .map((o) => String(o ?? "").trim())
    .filter(Boolean);

  if (options.length < 2) return { error: "A poll needs at least two options." };

  if (
    options.length > POLL_MAX_OPTIONS ||
    options.some((o) => o.length > POLL_OPTION_MAX)
  ) {
    return {
      error: `Up to ${POLL_MAX_OPTIONS} options, ${POLL_OPTION_MAX} characters each.`,
    };
  }

  let closes: string | null = null;

  if (input.closesAt) {
    const d = new Date(input.closesAt);
    if (Number.isNaN(d.getTime())) return { error: "That close time isn't valid." };
    closes = d.toISOString();
  }

  const { error } = await createAdminClient().rpc("save_chapter_poll", {
    p_user: user.id,
    p_chapter: chapterId,
    p_question: question,
    p_options: options,
    p_closes: closes,
  });

  return error ? { error: error.message } : {};
}

export async function removeChapterPoll(
  chapterId: string
): Promise<{ error?: string }> {
  const user = await sessionUser();

  if (!user) return { error: "You must be logged in." };

  const { error } = await createAdminClient().rpc("delete_chapter_poll", {
    p_user: user.id,
    p_chapter: chapterId,
  });

  return error ? { error: error.message } : {};
}
