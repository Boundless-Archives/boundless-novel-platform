/*
 * Sharing helpers. Pure functions plus a tiny sessionStorage "mailbox" the
 * publish screens use to ask the site-wide celebration popup to appear
 * (the popup lives in the layout so it survives the redirect after saving).
 */

export const PUBLISHED_KEY = "boundless:just-published";
export const PUBLISHED_EVENT = "boundless:published";

export type JustPublished = {
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number | null;
  storyTitle: string;
  storySlug: string;
};

export function shareLinks(url: string, text: string) {
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  return [
    { key: "whatsapp", label: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { key: "x", label: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
    { key: "facebook", label: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { key: "telegram", label: "Telegram", href: `https://t.me/share/url?url=${u}&text=${t}` },
  ];
}

export function shareText(title: string) {
  return `Read “${title}” on Boundless Archive`;
}

/* Remember a freshly published chapter so the popup can show. */
export function rememberPublished(p: JustPublished) {
  try {
    sessionStorage.setItem(PUBLISHED_KEY, JSON.stringify(p));
    window.dispatchEvent(new Event(PUBLISHED_EVENT));
  } catch {
    /* storage unavailable: the popup is a nicety, never block publishing */
  }
}

export function clearPublished() {
  try {
    sessionStorage.removeItem(PUBLISHED_KEY);
    window.dispatchEvent(new Event(PUBLISHED_EVENT));
  } catch {
    /* nothing to clear */
  }
}

export function readPublishedRaw(): string {
  try {
    return sessionStorage.getItem(PUBLISHED_KEY) ?? "";
  } catch {
    return "";
  }
}

export function parsePublished(raw: string): JustPublished | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Partial<JustPublished>;
    if (!v.chapterId || !v.storySlug) return null;
    return {
      chapterId: v.chapterId,
      chapterTitle: v.chapterTitle ?? "Your chapter",
      chapterNumber: v.chapterNumber ?? null,
      storyTitle: v.storyTitle ?? "your story",
      storySlug: v.storySlug,
    };
  } catch {
    return null;
  }
}
