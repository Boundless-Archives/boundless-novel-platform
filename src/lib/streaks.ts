// Minimum active (non-idle, tab-visible) seconds on a chapter
// page before a read can count toward the reader streak.
export const MIN_READ_SECONDS = 90;

// How far down the chapter content a reader must scroll
// (0-1) before a read can count.
export const SCROLL_COMPLETE_THRESHOLD = 0.9;

/*
 * STREAK REWARDS
 *
 * Embers are paid ONLY when a streak reaches a milestone day:
 * the days listed in `milestones`, then every `repeatEvery` days
 * after the last one (150, 200, 250, ... with the numbers below).
 * Ordinary streak days pay nothing.
 *
 * These amounts are placeholders. Change any number here and it
 * takes effect everywhere.
 */
export type StreakType = "reader" | "writer";

type RewardTable = {
  // streak day -> embers
  milestones: Record<number, number>;
  // embers for every `repeatEvery`-th day after the last milestone
  repeatReward: number;
};

export const STREAK_REPEAT_EVERY = 50;

export const STREAK_REWARDS: Record<StreakType, RewardTable> = {
  reader: {
    milestones: { 10: 50, 25: 150, 50: 400, 100: 1000 },
    repeatReward: 500,
  },
  writer: {
    milestones: { 10: 150, 25: 450, 50: 1200, 100: 3000 },
    repeatReward: 1500,
  },
};

function lastMilestoneDay(type: StreakType) {
  return Math.max(
    ...Object.keys(STREAK_REWARDS[type].milestones).map(Number)
  );
}

/* Embers owed for reaching `day` of a streak (0 if not a milestone day). */
export function getStreakReward(
  type: StreakType,
  day: number
): number {
  const table = STREAK_REWARDS[type];

  if (table.milestones[day] !== undefined) {
    return table.milestones[day];
  }

  const last = lastMilestoneDay(type);

  if (day > last && (day - last) % STREAK_REPEAT_EVERY === 0) {
    return table.repeatReward;
  }

  return 0;
}

/* The next milestone after `currentDay`, for the streak card. */
export function getNextStreakMilestone(
  type: StreakType,
  currentDay: number
): { day: number; reward: number } {
  const table = STREAK_REWARDS[type];

  const upcoming = Object.keys(table.milestones)
    .map(Number)
    .sort((a, b) => a - b)
    .find((day) => day > currentDay);

  if (upcoming !== undefined) {
    return { day: upcoming, reward: table.milestones[upcoming] };
  }

  const last = lastMilestoneDay(type);
  const steps =
    Math.floor((currentDay - last) / STREAK_REPEAT_EVERY) + 1;

  return {
    day: last + steps * STREAK_REPEAT_EVERY,
    reward: table.repeatReward,
  };
}