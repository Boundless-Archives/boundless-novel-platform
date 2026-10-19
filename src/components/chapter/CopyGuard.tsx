"use client";

import { useEffect } from "react";

type Props = {
  attributionTitle?: string;
  attributionAuthor?: string;
};

const MIN_ATTRIBUTION_LENGTH = 120;

function toElement(node: Node | null): Element | null {
  if (!node) return null;

  return node instanceof Element ? node : node.parentElement;
}

function isInside(node: Node | null, selector: string) {
  return Boolean(toElement(node)?.closest(selector));
}

/*
 * Two jobs, depending on how the story is set up:
 *  - Text inside .copy-protected can't be copied, cut, dragged or opened in a
 *    context menu (the author turned copying off).
 *  - Longer text copied from [data-attribute-copy] gets the story title,
 *    author and link added, so a pasted excerpt carries its source with it.
 * Authors are never restricted on their own stories (the page just doesn't
 * mark the text for them).
 */
export default function CopyGuard({
  attributionTitle,
  attributionAuthor,
}: Props) {
  useEffect(() => {
    const onCopy = (e: ClipboardEvent) => {
      const selection = window.getSelection();
      const anchor = selection?.anchorNode ?? null;

      if (
        isInside(anchor, ".copy-protected") ||
        isInside(e.target as Node, ".copy-protected")
      ) {
        e.preventDefault();

        e.clipboardData?.setData(
          "text/plain",
          "Copying is turned off for this story by its author."
        );

        return;
      }

      if (
        attributionTitle &&
        e.type === "copy" &&
        isInside(anchor, "[data-attribute-copy]")
      ) {
        const text = selection?.toString() ?? "";

        if (text.length >= MIN_ATTRIBUTION_LENGTH) {
          e.preventDefault();

          const url = `${window.location.origin}${window.location.pathname}`;

          e.clipboardData?.setData(
            "text/plain",
            `${text}\n\n— "${attributionTitle}" by ${
              attributionAuthor ?? "the author"
            }\nRead it at ${url}`
          );
        }
      }
    };

    const block = (e: Event) => {
      if (isInside(e.target as Node, ".copy-protected")) {
        e.preventDefault();
      }
    };

    document.addEventListener("copy", onCopy);
    document.addEventListener("cut", onCopy);
    document.addEventListener("contextmenu", block);
    document.addEventListener("dragstart", block);
    document.addEventListener("selectstart", block);

    return () => {
      document.removeEventListener("copy", onCopy);
      document.removeEventListener("cut", onCopy);
      document.removeEventListener("contextmenu", block);
      document.removeEventListener("dragstart", block);
      document.removeEventListener("selectstart", block);
    };
  }, [attributionTitle, attributionAuthor]);

  return null;
}