import { createAdminClient } from "@/utils/supabase/admin";
import type { Sprint } from "./sprint";

export type PrizeSprint = Sprint & {
  prize_enabled: boolean;
  prize_min_words: number;
  prize_min_readers: number;
  vote_min_chapters: number;
  vote_min_account_hours: number;
  prize_closes_at: string | null;
  prize_1: number;
  prize_2: number;
  prize_3: number;
  w_judges: number;
  w_reading: number;
  w_ratings: number;
  w_community: number;
  w_votes: number;
  results_announced: boolean;
};

export type BoardRow = {
  story_id: string;
  user_id: string;
  prompt_id: string;
  genre_slug: string;
  disqualified: boolean;
  words: number;
  readers: number;
  returning_readers: number;
  rating_n: number;
  rating_avg: number | null;
  commenters: number;
  library_adds: number;
  new_followers: number;
  votes: number;
  judge_avg: number | null;
  judge_n: number;
  eligible: boolean;
  s_judges: number;
  s_reading: number;
  s_ratings: number;
  s_community: number;
  s_votes: number;
  total: number;
  genre_rank: number | null;
};

/* When reading and voting stop: the set date, or 10 days after entries close. */
export function prizeCloseMs(s: PrizeSprint) {
  return s.prize_closes_at
    ? new Date(s.prize_closes_at).getTime()
    : new Date(s.ends_at).getTime() + 10 * 86400000;
}

/* The last minute of a day as people say it: closing at 00:00 means "the day before". */
export function lastDayLabel(iso: string) {
  return new Date(new Date(iso).getTime() - 60000).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Africa/Lagos",
  });
}

export const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export async function getPrizeBoard(sprintId: string): Promise<BoardRow[]> {
  const { data, error } = await createAdminClient().rpc("prize_board", { p_sprint: sprintId });
  if (error) {
    console.error("prize_board failed:", error.message);
    return [];
  }
  return (data ?? []) as BoardRow[];
}

export async function getGenreNames(): Promise<Map<string, string>> {
  const { data } = await createAdminClient().from("genres").select("name, slug");
  return new Map((data ?? []).map((g) => [g.slug as string, g.name as string]));
}

export const VOTE_MESSAGES: Record<string, { text: string; bad?: boolean }> = {
  ok: { text: "Vote cast. Thank you for backing this story." },
  moved: { text: "Vote moved. You can only back one story, so your earlier vote was removed." },
  same: { text: "You already vote for this story." },
  closed: { text: "Voting is closed.", bad: true },
  missing: { text: "That story is not in the Prize Track.", bad: true },
  self: { text: "You cannot vote for your own story.", bad: true },
  young: { text: "Your account is too new to vote. Try again once it is a little older.", bad: true },
  noread: { text: "Read the required number of chapters of this story first, then you can vote.", bad: true },
  disq: { text: "This entry has been disqualified and cannot receive votes.", bad: true },
  failed: { text: "Something went wrong. Please try again.", bad: true },
};

export const ENTER_MESSAGES: Record<string, { text: string; bad?: boolean }> = {
  ok: { text: "You're entered! Good luck." },
  closed: { text: "Entries are closed.", bad: true },
  missing: { text: "That story could not be found.", bad: true },
  notyours: { text: "You can only enter your own story.", bad: true },
  nobook: { text: "Publish your story before entering it (drafts cannot enter).", bad: true },
  notnew: { text: "Only stories started on or after the sprint start date can enter.", bad: true },
  noprompt: { text: "Pick a prompt to write to.", bad: true },
  genre: { text: "Your story must carry the same genre as the prompt you picked. Add the genre to your story, or pick another prompt.", bad: true },
  already: { text: "You have already entered a story (one entry per writer).", bad: true },
  withdrawn: { text: "Your entry was withdrawn." },
  failed: { text: "Something went wrong. Please try again.", bad: true },
};
