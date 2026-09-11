import { marked } from "marked";
import DOMPurify from "isomorphic-dompurify";

marked.setOptions({
  breaks: true,
});

export function renderMarkdown(content: string): string {
  const rawHtml = marked.parse(content, { async: false }) as string;
  return DOMPurify.sanitize(rawHtml);
}