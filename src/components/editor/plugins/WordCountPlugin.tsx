"use client";

import { useEffect, useState } from "react";
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getRoot, $getSelection, $isRangeSelection } from "lexical";
import { countTextWords } from "@/lib/wordCount";

const WORDS_PER_MINUTE = 230;

/*
 * Live word count, character count and reading time, pinned to the bottom of
 * the editor. When text is selected it also shows how many words are selected.
 */
export default function WordCountPlugin() {
  const [editor] = useLexicalComposerContext();

  const [stats, setStats] = useState({
    words: 0,
    characters: 0,
    selectedWords: 0,
  });

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const text = $getRoot().getTextContent();

        const selection = $getSelection();

        const selectedText =
          $isRangeSelection(selection) && !selection.isCollapsed()
            ? selection.getTextContent()
            : "";

        setStats({
          words: countTextWords(text),
          characters: text.replace(/\n/g, "").length,
          selectedWords: countTextWords(selectedText),
        });
      });
    });
  }, [editor]);

  const minutes =
    stats.words === 0 ? 0 : Math.max(1, Math.round(stats.words / WORDS_PER_MINUTE));

  return (
    <div
      className="
        sticky
        bottom-0
        z-10
        -mx-5
        -mb-5
        mt-6
        flex
        flex-wrap
        items-center
        gap-x-4
        gap-y-1
        rounded-b-2xl
        border-t
        px-5
        py-2.5
        text-xs
      "
      style={{
        backgroundColor: "var(--background)",
        borderColor: "var(--card-border)",
      }}
      aria-live="off"
    >
      <span className="font-semibold">
        {stats.words.toLocaleString()} {stats.words === 1 ? "word" : "words"}
      </span>

      <span className="opacity-70">
        {stats.characters.toLocaleString()} characters
      </span>

      <span className="opacity-70">
        {minutes === 0 ? "—" : `~${minutes} min read`}
      </span>

      {stats.selectedWords > 0 && (
        <span className="ml-auto font-medium" style={{ color: "var(--accent)" }}>
          {stats.selectedWords.toLocaleString()} selected
        </span>
      )}
    </div>
  );
}