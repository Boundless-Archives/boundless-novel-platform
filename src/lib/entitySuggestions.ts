/*
 * Finds names that keep showing up in an author's chapters but don't have a
 * wiki entry yet. This is a heuristic: capitalised words that are not just
 * sentence openers, seen several times.
 */

const STOP = new Set(
  `the a an he she they it i we you but and or so then there here his her their its our my your this that these those what when where who why how if as at in on of to for from with by not no yes oh ah well now just still even only also very too all some any each every one two three after before while though because since until once again never always maybe perhaps please thank thanks sir lady lord miss mr mrs dr okay ok chapter monday tuesday wednesday thursday friday saturday sunday january february march april may june july august september october november december`
    .split(" ")
);

const NAME_RE = /\p{Lu}[\p{L}'’-]*(?:\s+\p{Lu}[\p{L}'’-]*){0,2}/gu;

export type NameSuggestion = {
  name: string;
  count: number;
  storyId: string | null;
};

export function htmlToText(html: string): string {
  return html
    .replace(/<\/(p|div|h[1-6]|li|blockquote)>/gi, ". ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;|&gt;/g, " ")
    .replace(/\s+/g, " ");
}

export function suggestNames(
  chapters: { storyId: string; text: string }[],
  existingNames: string[],
  options: { minCount?: number; limit?: number } = {}
): NameSuggestion[] {
  const minCount = options.minCount ?? 3;
  const limit = options.limit ?? 12;

  const existing = existingNames.map((n) => n.trim().toLowerCase()).filter(Boolean);
  const counts = new Map<string, { display: string; count: number; starts: number; stories: Map<string, number> }>();

  for (const chapter of chapters) {
    const text = chapter.text;
    NAME_RE.lastIndex = 0;
    let m: RegExpExecArray | null;

    while ((m = NAME_RE.exec(text))) {
      let words = m[0].split(/\s+/);
      const before = text.slice(0, m.index).trimEnd();
      const atSentenceStart = before === "" || /[.!?:"“”]$/.test(before);

      // drop leading/trailing filler words ("The Iron Gate" -> "Iron Gate")
      while (words.length && STOP.has(words[0].toLowerCase().replace(/['’].*$/, ""))) words = words.slice(1);
      while (words.length && STOP.has(words[words.length - 1].toLowerCase())) words = words.slice(0, -1);
      if (words.length === 0) continue;

      const name = words.join(" ").replace(/['’]s$/, "");
      if (name.length < 3) continue;

      // a lone capitalised word opening a sentence is probably just grammar;
      // it only counts if the same word is also seen mid-sentence
      const loneStart = words.length === 1 && atSentenceStart && words[0].length === m[0].length;

      const key = name.toLowerCase();
      const entry = counts.get(key) ?? { display: name, count: 0, starts: 0, stories: new Map() };
      if (loneStart) {
        entry.starts += 1;
        counts.set(key, entry);
        continue;
      }
      entry.count += 1;
      entry.stories.set(chapter.storyId, (entry.stories.get(chapter.storyId) ?? 0) + 1);
      counts.set(key, entry);
    }
  }

  return [...counts.entries()]
    .map(([key, v]) => [key, { ...v, count: v.count > 0 ? v.count + v.starts : 0 }] as const)
    .filter(([key, v]) => {
      if (v.count < minCount) return false;
      return !existing.some((e) => e === key || e.includes(key) || key.includes(e));
    })
    .map(([, v]) => ({
      name: v.display,
      count: v.count,
      storyId: [...v.stories.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
