/*
 * Seasonal switches. The winter look runs from 20 November to 5 January.
 * Pure functions of a timestamp, so server components can pass their own
 * clock (see nowMs() in guilds.ts) without breaking React's purity rules.
 */

export function isWinterSeason(ms: number): boolean {
  const d = new Date(ms);
  const month = d.getUTCMonth() + 1;
  const day = d.getUTCDate();
  return (month === 11 && day >= 20) || month === 12 || (month === 1 && day <= 5);
}

function daysUntil(ms: number, year: number, month: number, day: number) {
  const target = Date.UTC(year, month - 1, day);
  const today = Date.UTC(
    new Date(ms).getUTCFullYear(),
    new Date(ms).getUTCMonth(),
    new Date(ms).getUTCDate()
  );
  return Math.round((target - today) / 86400000);
}

/* The next festive milestone and how far away it is. */
export function winterCountdown(ms: number): { label: string; days: number } {
  const d = new Date(ms);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth() + 1;

  const christmas = daysUntil(ms, year, 12, 25);
  if (month <= 12 && christmas > 0) return { label: "until Christmas", days: christmas };
  if (christmas === 0) return { label: "Merry Christmas!", days: 0 };

  const newYear = daysUntil(ms, month === 1 ? year : year + 1, 1, 1);
  if (newYear > 0) return { label: "until the New Year", days: newYear };
  return { label: "Happy New Year!", days: 0 };
}
