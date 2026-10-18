function extractText(node: any): string {
  if (!node) return "";

  let text = "";

  if (typeof node.text === "string") {
    text += node.text + " ";
  }

  if (node.root) {
    text += extractText(node.root);
  }

  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      text += extractText(child);
    }
  }

  return text;
}

/*
 * Chapters are saved as HTML. Turn it into plain text so tags like
 * <p class="..."> are never counted as words.
 */
function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre)>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&");
}

/*
 * Words in plain text: anything separated by spaces or line breaks
 * (the same way Word and Google Docs count).
 */
export function countTextWords(text: string): number {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function countWords(content: string): number {
  if (!content) return 0;

  let text: string;

  try {
    const parsed = JSON.parse(content);
    text = extractText(parsed);
  } catch {
    text = /<[a-z][\s\S]*>/i.test(content) ? stripHtml(content) : content;
  }

  return countTextWords(text);
}