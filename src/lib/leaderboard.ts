import { createAdminClient } from "@/utils/supabase/admin";

/* Weekly leaderboards. The scoring lives in the database
   (get_leaderboard); these helpers just read it as the app. */

export type Board = "reader" | "author";

export type LeaderboardRow = {
  rank: number;
  user_id: string;
  score: number;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
};

export type AuthorDetail = {
  chapters: number;
  chapter_pts: number;
  words: number;
  word_pts: number;
  views: number;
  view_pts: number;
  finishes: number;
  finish_pts: number;
  reviews: number;
  review_pts: number;
  comments: number;
  comment_pts: number;
  followers: number;
  follower_pts: number;
};

export type LeaderboardData = {
  week_start: string;
  week_end: string;
  enabled: boolean;
  prizes: number[];
  participants: number;
  rows: LeaderboardRow[];
  me: {
    rank: number;
    score: number;
    detail: AuthorDetail | { chapters: number };
  } | null;
};

export type Winner = {
  week_start: string;
  board: Board;
  rank: number;
  score: number;
  sparks: number;
  username: string | null;
  display_name: string | null;
};

export function mondayOf(date: Date): string {
  const d = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
  );
  const day = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - day);
  return d.toISOString().slice(0, 10);
}

export function previousMonday(): string {
  const d = new Date(mondayOf(new Date()) + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() - 7);
  return d.toISOString().slice(0, 10);
}

export async function fetchLeaderboard(
  board: Board,
  week: string | null,
  userId: string | null
): Promise<LeaderboardData | null> {
  const { data } = await createAdminClient().rpc("get_leaderboard", {
    p_board: board,
    p_week: week,
    p_user: userId,
    p_limit: 20,
  });

  return (data ?? null) as LeaderboardData | null;
}

export async function fetchLastWinners(): Promise<Winner[]> {
  const { data } = await createAdminClient().rpc("leaderboard_last_winners");
  return (data ?? []) as Winner[];
}
