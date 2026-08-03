"use client";

import { useEffect, useState } from "react";
import {
  useLexicalComposerContext,
} from "@lexical/react/LexicalComposerContext";
import {
  FORMAT_TEXT_COMMAND,
} from "lexical";
import {
  $getSelection,
  $isRangeSelection,  
} from "lexical";
import {
  $createHeadingNode,
} from "@lexical/rich-text";

import {
  $createParagraphNode,
} from "lexical";

import {
  $setBlocksType,
} from "@lexical/selection";

export default function EditorToolbar() {
  const [editor] =
    useLexicalComposerContext();

  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
  });

  const [blockType, setBlockType] = useState("Normal");

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();

      if ($isRangeSelection(selection)) {
        editorState.read(() => {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) return;

  setFormats({
    bold: selection.hasFormat("bold"),
    italic: selection.hasFormat("italic"),
    underline: selection.hasFormat("underline"),
  });

  const anchorNode = selection.anchor.getNode();

  const element =
    anchorNode.getKey() === "root"
      ? anchorNode
      : anchorNode.getTopLevelElementOrThrow();

  const type = element.getType();

  switch (type) {
    case "heading":
      const tag =
        (element as any).getTag?.();

      switch (tag) {
        case "h1":
          setBlockType("Heading 1");
          break;

        case "h2":
          setBlockType("Heading 2");
          break;

        case "h3":
          setBlockType("Heading 3");
          break;

        default:
          setBlockType("Normal");
      }

      break;

    default:
      setBlockType("Normal");
  }
});
      }
    });
  });
}, [editor]);

function applyHeading(level: 1 | 2 | 3 | "paragraph") {
  editor.update(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) return;

    if (level === "paragraph") {
      $setBlocksType(selection, () => $createParagraphNode());
      setBlockType("Normal");
      return;
    }

    $setBlocksType(selection, () =>
      $createHeadingNode(`h${level}`)
    );

    setBlockType(`Heading ${level}`);
  });
}

  return (
    <div
      className="
        mb-5
        flex
        flex-wrap
        items-center
        gap-2
        rounded-xl
        border
        p-3
      "
      style={{
        borderColor:
          "var(--card-border)",
        background:
          "var(--card)",
      }}
    >
      <button
        type="button"
        className={`
            rounded-lg
            px-3
            py-2
            font-bold
            transition-colors
            ${
                formats.bold
                ? "bg-indigo-600 text-white"
                : "hover:bg-black/10 dark:hover:bg-white/10"
            }
          `}
        onClick={() => {
            editor.dispatchCommand(
                FORMAT_TEXT_COMMAND,
                "bold"
            );
        }}
      >
        B
      </button>

      <button
        type="button"
        className={`
            rounded-lg
            px-3
            py-2
            font-bold
            transition-colors
            ${
                formats.italic
                ? "bg-indigo-600 text-white"
                : "hover:bg-black/10 dark:hover:bg-white/10"
            }
          `}
        onClick={() => {
            editor.dispatchCommand(
            FORMAT_TEXT_COMMAND,
            "italic"
            );
        }}
      >
        I
      </button>

      <button
        type="button"
        className={`
            rounded-lg
            px-3
            py-2
            font-bold
            transition-colors
            ${
                formats.underline
                ? "bg-indigo-600 text-white"
                : "hover:bg-black/10 dark:hover:bg-white/10"
            }
          `}
        onClick={() => {
            editor.dispatchCommand(
            FORMAT_TEXT_COMMAND,
            "underline"
          );
        }}
      >
        U
      </button>

      <div className="relative">
  <select
    value={blockType}
    onChange={(e) => {
      const value = e.target.value;

      switch (value) {
        case "Normal":
          applyHeading("paragraph");
          break;

        case "Heading 1":
          applyHeading(1);
          break;

        case "Heading 2":
          applyHeading(2);
          break;

        case "Heading 3":
          applyHeading(3);
          break;
      }
    }}
    className="
      rounded-lg
      border
      px-3
      py-2
      text-sm
    "
    style={{
      borderColor: "var(--card-border)",
      background: "var(--card)",
    }}
  >
    <option>Normal</option>
    <option>Heading 1</option>
    <option>Heading 2</option>
    <option>Heading 3</option>
  </select>
</div>
    </div>
  );
}