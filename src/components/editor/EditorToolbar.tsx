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
import {
  INSERT_UNORDERED_LIST_COMMAND,
  INSERT_ORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
} from "@lexical/list";
import {
  $createQuoteNode,
} from "@lexical/rich-text";
import { $createCodeNode } from "@lexical/code";
import {
  UNDO_COMMAND,
  REDO_COMMAND,
} from "lexical";

export default function EditorToolbar() {
  const [editor] =
    useLexicalComposerContext();

  const [formats, setFormats] = useState({
    bold: false,
    italic: false,
    underline: false,
    bullet: false,
    numbered: false,
    quote: false,
    code: false, 
  });

  const [blockType, setBlockType] = useState("Normal");

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();

      if ($isRangeSelection(selection)) {
  const selection = $getSelection();

  if (!$isRangeSelection(selection)) return; 

  const anchorNode = selection.anchor.getNode();

  const element =
    anchorNode.getKey() === "root"
      ? anchorNode
      : anchorNode.getTopLevelElementOrThrow();

  const type = element.getType();

  const quote = type === "quote";

  const code = type === "code";

  const parent = element.getParent();

const isBullet =
  type === "list" &&
  (element as any).getListType?.() === "bullet";

const parentBullet =
  parent?.getType?.() === "list" &&
  (parent as any).getListType?.() === "bullet";

const bullet = isBullet || parentBullet;

const isNumbered =
  type === "list" &&
  (element as any).getListType?.() === "number";

const parentNumbered =
  parent?.getType?.() === "list" &&
  (parent as any).getListType?.() === "number";

const numbered = isNumbered || parentNumbered;

setFormats({
    bold: selection.hasFormat("bold"),
    italic: selection.hasFormat("italic"),
    underline: selection.hasFormat("underline"),
    bullet,
    numbered,
    quote,
    code,
  });
  
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
      }
    });
  });
}, [editor]);

function applyQuote() {
  editor.update(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) return;

    $setBlocksType(selection, () => $createQuoteNode());
  });
}

function applyCodeBlock() {
  editor.update(() => {
    const selection = $getSelection();

    if (!$isRangeSelection(selection)) return;

    $setBlocksType(
      selection,
      () => $createCodeNode()
    );
  });
}

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

<button
  type="button"
  onClick={() => {
    if (formats.bullet) {
      editor.dispatchCommand(
        REMOVE_LIST_COMMAND,
        undefined
      );
    } else {
      editor.dispatchCommand(
        INSERT_UNORDERED_LIST_COMMAND,
        undefined
      );
    }
  }}
  className={`
    rounded-lg
    px-3
    py-2
    transition-colors
    ${
      formats.bullet
        ? "bg-indigo-600 text-white"
        : "hover:bg-black/10 dark:hover:bg-white/10"
    }
  `}
>
  • List
</button>

<button
  type="button"
  onClick={() => {
    if (formats.numbered) {
      editor.dispatchCommand(
        REMOVE_LIST_COMMAND,
        undefined
      );
    } else {
      editor.dispatchCommand(
        INSERT_ORDERED_LIST_COMMAND,
        undefined
      );
    }
  }}
  className={`
    rounded-lg
    px-3
    py-2
    transition-colors
    ${
      formats.numbered
        ? "bg-indigo-600 text-white"
        : "hover:bg-black/10 dark:hover:bg-white/10"
    }
  `}
>
  1.
</button>

<button
  type="button"
  onClick={applyQuote}
  className={`
    rounded-lg
    px-3
    py-2
    transition-colors
    ${
      formats.quote
        ? "bg-indigo-600 text-white"
        : "hover:bg-black/10 dark:hover:bg-white/10"
    }
  `}
>
  ❝
</button>

<button
  type="button"
  onClick={applyCodeBlock}
  className={`
    rounded-lg
    px-3
    py-2
    transition-colors
    ${
      formats.code
        ? "bg-indigo-600 text-white"
        : "hover:bg-black/10 dark:hover:bg-white/10"
    }
  `}
>
  {"</>"}
</button>

<button
  type="button"
  onClick={() => editor.dispatchCommand(UNDO_COMMAND, undefined)}
  className="rounded-lg px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10"
>
  ↶
</button>

<button
  type="button"
  onClick={() => editor.dispatchCommand(REDO_COMMAND, undefined)}
  className="rounded-lg px-3 py-2 hover:bg-black/10 dark:hover:bg-white/10"
>
  ↷
</button>

    </div>
  );
}