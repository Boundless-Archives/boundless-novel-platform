export const SHELVES = [
  { value: "want_to_read", label: "Want to read", icon: "🔖" },
  { value: "reading", label: "Reading", icon: "📖" },
  { value: "finished", label: "Finished", icon: "✅" },
  { value: "dropped", label: "Dropped", icon: "💤" },
] as const;

export type Shelf = (typeof SHELVES)[number]["value"];

export function isShelf(value: unknown): value is Shelf {
  return SHELVES.some((s) => s.value === value);
}

export function shelfLabel(value: string) {
  return SHELVES.find((s) => s.value === value)?.label ?? value;
}
