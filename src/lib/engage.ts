export const REACTION_EMOJIS = ["❤️", "😂", "😮", "😢", "🔥"] as const;
export type ReactionEmoji = (typeof REACTION_EMOJIS)[number];

export function isReactionEmoji(value: unknown): value is ReactionEmoji {
  return REACTION_EMOJIS.some((e) => e === value);
}

export const POLL_MAX_OPTIONS = 6;
export const POLL_OPTION_MAX = 80;
export const POLL_QUESTION_MAX = 200;

export type ReactionRow = {
  paragraph_index: number;
  paragraph_snippet: string | null;
  emoji: string;
  n: number;
  mine: boolean;
  resolved_paragraph?: number | null;
};

export type PollView = {
  id: string;
  question: string;
  options: string[];
  closes_at: string | null;
  closed: boolean;
  is_author: boolean;
  my_vote: number | null;
  total: number | null;
  counts: number[] | null;
};
