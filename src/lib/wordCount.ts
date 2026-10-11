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

export function countWords(content: string): number {
  if (!content) return 0;

  let text: string;

  try {
    const parsed = JSON.parse(content);
    text = extractText(parsed);
  } catch {
    text = content;
  }

  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}