// Minimum active (non-idle, tab-visible) seconds on a chapter
// page before a read can count toward the reader streak.
export const MIN_READ_SECONDS = 90;

// How far down the chapter content a reader must scroll
// (0-1) before a read can count.
export const SCROLL_COMPLETE_THRESHOLD = 0.9;

//  STREAK REWARDS
//  
//  Sparks (the free, in-app-only currency) are paid ONLY when a streak
//  reaches a milestone day: the days listed in `milestones`, then every
//  `repeatEvery` days after the last one (150, 200, 250, ... with the
//  numbers below). Ordinary streak days pay nothing.
//  
//  10 Sparks = 1 Ember of buying power, so a reader's 100-day streak
//  is worth 1,700 Sparks (about 170 Embers) in total; a writer's is
//  worth 3,400. Change any number here and it takes effect everywhere.
//  
export type StreakType = "reader" | "writer";

type RewardTable = {
  // streak day -> sparks
  milestones: Record<number, number>;
  // sparks for every `repeatEvery`-th day after the last milestone
  repeatReward: number;
};

export const STREAK_REPEAT_EVERY = 50;

export const STREAK_REWARDS: Record<StreakType, RewardTable> = {
  reader: {
    milestones: { 10: 100, 25: 200, 50: 400, 100: 1000 },
    repeatReward: 500,
  },
  writer: {
    milestones: { 10: 200, 25: 400, 50: 800, 100: 2000 },
    repeatReward: 1000,
  },
};

function lastMilestoneDay(type: StreakType) {
  return Math.max(
    ...Object.keys(STREAK_REWARDS[type].milestones).map(Number)
  );
}

/* Sparks owed for reaching `day` of a streak (0 if not a milestone day). */
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