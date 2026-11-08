/*
 * Marks the first mention of each wiki entity in a chapter's HTML so the
 * reader can tap a name and see a small lore card.
 *
 * Only text between tags is touched, and never inside links, scripts or
 * existing lore marks, so the chapter markup (and its paragraph numbering)
 * stays valid.
 */

export type LoreEntity = {
  id: string;
  name: string;
};

const SKIP_TAGS = new Set(["a", "script", "style", "code", "pre", "button"]);

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function markLore(html: string, entities: LoreEntity[]): string {
  const usable = entities
    .filter((e) => {
      const n = e.name.trim();
      return n.length >= 3 && !/[<>&"]/.test(n);
    })
    .sort((a, b) => b.name.length - a.name.length);

  if (usable.length === 0 || !html) return html;

  const byLower = new Map<string, LoreEntity>();
  for (const e of usable) {
    const key = e.name.trim().toLowerCase();
    if (!byLower.has(key)) byLower.set(key, e);
  }

  const pattern = new RegExp(
    `(?<![\\p{L}\\p{N}_])(${[...byLower.values()]
      .map((e) => escapeRegExp(e.name.trim()))
      .join("|")})(?![\\p{L}\\p{N}_])`,
    "giu"
  );

  const seen = new Set<string>();
  const parts = html.split(/(<[^>]*>)/);
  const skipStack: string[] = [];

  return parts
    .map((part) => {
      if (part.startsWith("<")) {
        const m = /^<\s*(\/?)\s*([a-z0-9]+)/i.exec(part);
        if (m) {
          const tag = m[2].toLowerCase();
          if (SKIP_TAGS.has(tag)) {
            if (m[1]) skipStack.pop();
            else if (!part.endsWith("/>")) skipStack.push(tag);
          }
        }
        return part;
      }

      if (skipStack.length > 0 || !part.trim()) return part;

      return part.replace(pattern, (match) => {
        const entity = byLower.get(match.toLowerCase());
        if (!entity || seen.has(entity.id)) return match;
        seen.add(entity.id);
        return `<span class="lore-mark" data-lore="${entity.id}" tabindex="0" role="button">${match}</span>`;
      });
    })
    .join("");
}
