import { Flame } from "lucide-react";

/*
 * The streak flame, in three states you can read at a glance:
 *  - lit (filled, with the equipped flame colour): counted today
 *  - outline: the streak is alive but today isn't done yet
 *  - faint outline: no streak
 */
export default function StreakFlame({
  size = 16,
  streak,
  doneToday,
  color,
  glow,
}: {
  size?: number;
  streak: number;
  doneToday: boolean;
  color?: string | null;
  glow?: string | null;
}) {
  const lit = streak > 0 && doneToday;

  return (
    <Flame
      size={size}
      fill={lit ? "currentColor" : "none"}
      aria-hidden
      style={{
        color: lit ? color ?? "var(--accent)" : "inherit",
        opacity: lit ? 1 : streak > 0 ? 0.55 : 0.3,
        filter: lit && glow ? `drop-shadow(0 0 5px ${glow})` : undefined,
      }}
    />
  );
}
