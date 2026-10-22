/*
 * Helpers for paragraph-level comments.
 *
 * Chapters are stored as HTML (from the Lexical editor). A "paragraph" is a
 * non-empty <p> element, numbered from 0 in reading order. Each comment
 * remembers its paragraph number plus the first few words of that paragraph,
 * so it can still find its paragraph if the author later edits the chapter.
 */

export const SNIPPET_LENGTH = 60;

const P_RE = /<p\b([^>]*)>([\s\S]*?)<\/p>/gi;

function decodeEntities(s: string) {
  return s
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

export function normalizeText(html: string): string {
  return decodeEntities(html.replace(/<[^>]*>/g, " "))
    .replace(/\s+/g, " ")
    .trim();
}

// Blocks of text this long with single line breaks are treated as several
// paragraphs (a poem stanza is far shorter than this).
const LONG_BLOCK_LENGTH = 1200;

const DOUBLE_BREAK_RE = /(?:<br\s*\/?>\s*){2,}/i;
const SINGLE_BREAK_RE = /<br\s*\/?>/i;

/*
 * Pasted text (for example from WPS or Word) often uses line breaks instead
 * of real paragraph breaks, so a whole stretch of the chapter becomes ONE
 * paragraph and only its top can be commented on. A blank line made of line
 * breaks is treated as a paragraph break here; and if a block is still very
 * long, every line break in it is treated as one. Display only: the saved
 * chapter is never changed.
 */
function splitSoftBreaks(inner: string): string[] {
  const parts = inner.split(DOUBLE_BREAK_RE).flatMap((part) =>
    normalizeText(part).length > LONG_BLOCK_LENGTH
      ? part.split(SINGLE_BREAK_RE)
      : [part]
  );

  return parts;
}

const BLOCK_TAG_RE = /<\/?(p|div|h[1-6]|ul|ol|li|blockquote|pre|table)\b/i;

/*
 * Older chapters may be plain text with line breaks instead of editor HTML.
 * Each non-empty line becomes a paragraph; blank lines stay blank, so the
 * chapter looks exactly as it did before.
 */
function tagPlainText(text: string): { html: string; paragraphs: string[] } {
  const paragraphs: string[] = [];

  const lines = text.replace(/\r\n/g, "\n").replace(/\n+$/, "").split("\n");

  const html = lines
    .map((line) => {
      const clean = normalizeText(line);

      if (!clean) return '<p style="margin:0"><br></p>';

      const index = paragraphs.length;

      paragraphs.push(clean);

      return `<p data-pi="${index}" style="margin:0">${line}</p>`;
    })
    .join("");

  return { html, paragraphs };
}

/*
 * Adds data-pi="N" to every non-empty paragraph and returns the paragraph
 * texts in the same order.
 */
export function tagParagraphs(html: string): {
  html: string;
  paragraphs: string[];
} {
  if (html.trim() && !BLOCK_TAG_RE.test(html)) {
    return tagPlainText(html);
  }

  const paragraphs: string[] = [];

  const tagged = html.replace(
    P_RE,
    (match: string, attrs: string, inner: string) => {
      const text = normalizeText(inner);

      if (!text) return match;

      const pieces = splitSoftBreaks(inner).filter((part) =>
        normalizeText(part)
      );

      // an ordinary paragraph: one block, exactly as before
      if (pieces.length <= 1) {
        const index = paragraphs.length;

        paragraphs.push(text);

        return `<p${attrs} data-pi="${index}">${inner}</p>`;
      }

      return pieces
        .map((part) => {
          const index = paragraphs.length;

          paragraphs.push(normalizeText(part));

          return `<p${attrs} data-pi="${index}">${part}</p>`;
        })
        .join("");
    }
  );

  return { html: tagged, paragraphs };
}

export function splitParagraphs(html: string): string[] {
  return tagParagraphs(html).paragraphs;
}

export function makeSnippet(text: string): string {
  return text.slice(0, SNIPPET_LENGTH);
}

/*
 * Finds where a comment's paragraph is now. Returns null when the paragraph
 * was edited or removed so far that it can't be found.
 */
export function resolveParagraphIndex(
  paragraphs: string[],
  index: number,
  snippet: string | null | undefined
): number | null {
  if (!snippet) {
    return index >= 0 && index < paragraphs.length ? index : null;
  }

  if (paragraphs[index]?.startsWith(snippet)) {
    return index;
  }

  const moved = paragraphs.findIndex((p) => p.startsWith(snippet));

  if (moved !== -1) return moved;

  // A comment made before a long block was split into paragraphs: its
  // snippet runs past the end of the first piece, so find that piece.
  const piece = paragraphs.findIndex(
    (p) => p.length >= 12 && snippet.startsWith(p)
  );

  return piece === -1 ? null : piece;
}