export const ENTITY_TYPES = [
  "character",
  "location",
  "faction",
  "item",
  "event",
  "concept",
  "species",
  "alternate_universe",
  "alternate_timeline",
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

export const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  character: "Character",
  location: "Location",
  faction: "Faction",
  item: "Item",
  event: "Event",
  concept: "Concept",
  species: "Species",
  alternate_universe: "Alternate Universe",
  alternate_timeline: "Alternate Timeline",
};

export const ENTITY_TYPE_ICONS: Record<EntityType, string> = {
  character: "🧑",
  location: "🗺️",
  faction: "⚔️",
  item: "🗝️",
  event: "📜",
  concept: "💭",
  species: "🧬",
  alternate_universe: "🌀",
  alternate_timeline: "⏳",
};

export function getEntityTypeLabel(type: string): string {
  return (
    ENTITY_TYPE_LABELS[type as EntityType] ?? type
  );
}

export function getEntityTypeIcon(type: string): string {
  return (
    ENTITY_TYPE_ICONS[type as EntityType] ?? "📄"
  );
}

export function createSlug(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}