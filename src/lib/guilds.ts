export const GUILD_KINDS = [
  {
    value: "sect",
    label: "Sect",
    plural: "Sects",
    icon: "⛰️",
    blurb: "Disciplined schools of cultivators, built around a shared way.",
  },
  {
    value: "coven",
    label: "Coven",
    plural: "Covens",
    icon: "🌙",
    blurb: "Close circles of casters and spellweavers.",
  },
  {
    value: "cult",
    label: "Cult",
    plural: "Cults",
    icon: "🔥",
    blurb: "Devoted followings gathered around a story, an idea, or a legend.",
  },
  {
    value: "guild",
    label: "Guild",
    plural: "Guilds",
    icon: "🏛️",
    blurb: "Orders of craft and purpose, built by mages and cultivators alike.",
  },
] as const;

export type GuildKind = (typeof GUILD_KINDS)[number]["value"];

export const KIND_META: Record<
  string,
  { label: string; plural: string; icon: string; blurb: string }
> = Object.fromEntries(GUILD_KINDS.map((k) => [k.value, k]));

/* Who may FOUND each type (anyone may join any type). Mirrors create_guild()
   in boundless-guilds-types.sql, which is what actually enforces it. */
export const KIND_PATH: Record<GuildKind, "qi" | "mana" | null> = {
  sect: "qi",
  coven: "mana",
  cult: null,
  guild: null,
};

export const PATH_LABEL = { qi: "cultivators", mana: "mages" } as const;

export type Guild = {
  id: string;
  kind: GuildKind;
  name: string;
  slug: string;
  description: string;
  owner_id: string | null;
  member_count: number;
  post_count: number;
  cultivation_xp: number;
  level: number;
  is_official: boolean;
  created_at: string;
};

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

/* XP a group needs to reach each level. Must match guild_level_for() in
   boundless-guilds-cultivation.sql (a test checks they agree). */
export const GUILD_LEVEL_XP = [
  0, 500, 1500, 4000, 10000, 25000, 60000, 140000, 320000, 700000,
] as const;

export const GUILD_LEVEL_NAMES = [
  "Gathering",
  "Budding",
  "Rising",
  "Established",
  "Renowned",
  "Illustrious",
  "Ascendant",
  "Sovereign",
  "Mythic",
  "Transcendent",
] as const;

export function guildProgress(xp: number) {
  let level = 1;
  GUILD_LEVEL_XP.forEach((need, i) => {
    if (xp >= need) level = i + 1;
  });

  const maxed = level >= GUILD_LEVEL_XP.length;
  const floor = GUILD_LEVEL_XP[level - 1];
  const next = maxed ? null : GUILD_LEVEL_XP[level];

  return {
    level,
    name: GUILD_LEVEL_NAMES[level - 1],
    xp,
    next,
    percent: next === null ? 100 : Math.min(100, Math.round(((xp - floor) / (next - floor)) * 100)),
    maxed,
  };
}

/* Time helpers kept out of components (React's purity lint dislikes Date.now there). */
export function nowMs() {
  return Date.now();
}

export function isoFromNow(hours: number) {
  return new Date(Date.now() + hours * 3600_000).toISOString();
}
