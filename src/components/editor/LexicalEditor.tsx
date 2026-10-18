"use client";

import {
  LexicalComposer,
} from "@lexical/react/LexicalComposer";

import {
  RichTextPlugin,
} from "@lexical/react/LexicalRichTextPlugin";

import {
  ContentEditable,
} from "@lexical/react/LexicalContentEditable";

import {
  OnChangePlugin,
} from "@lexical/react/LexicalOnChangePlugin";

import {
  EditorState,
  HISTORY_MERGE_TAG,
  $getRoot,
  $insertNodes,
} from "lexical";

import EditorTheme from "./EditorTheme";
import { editorNodes } from "./nodes";

import AutoFocusPlugin from "./plugins/AutoFocusPlugin";
import HistoryPlugin from "./plugins/HistoryPlugin";
import MarkdownPlugin from "./plugins/MarkdownPlugin";
import PlaceholderPlugin from "./plugins/PlaceholderPlugin";
import WordCountPlugin from "./plugins/WordCountPlugin";
import {
  $generateHtmlFromNodes,
  $generateNodesFromDOM,
} from "@lexical/html";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";

type Props = {
  value: string;
  onChange: (value: string) => void;
  children?: React.ReactNode;
};

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { useEffect, useRef } from "react";

/*
 * How many of the editor's own recent HTML outputs we remember.
 * A few (not just one) so a fast typist can never slip a stale echo
 * past the check below.
 */
const RECENT_EMITTED_LIMIT = 5;

/*
 * Loads `value` into the editor ONLY when it comes from outside
 * (e.g. an existing chapter finishing loading from the database).
 *
 * `recentlyEmittedRef` holds the HTML the editor itself recently sent
 * up through onChange. When the parent hands one of those back as
 * `value`, it is just an echo of what the user typed, so we must NOT
 * rebuild the editor from it. Rebuilding on every keystroke is what
 * made the cursor jump to the end of the text.
 */
function InitialContentPlugin({
  value,
  recentlyEmittedRef,
}: {
  value: string;
  recentlyEmittedRef: React.MutableRefObject<string[]>;
}) {
  const [editor] =
    useLexicalComposerContext();

  useEffect(() => {
    if (!value) return;

    // Echo of our own onChange output: ignore it.
    if (recentlyEmittedRef.current.includes(value)) return;

    editor.update(
      () => {
        const parser = new DOMParser();

        const dom = parser.parseFromString(
          value,
          "text/html"
        );

        const nodes =
          $generateNodesFromDOM(
            editor,
            dom
          );

        const root = $getRoot();

        root.clear();

        root.select();

        $insertNodes(nodes);
      },
      // Keeps the initial load out of the undo history, so
      // Ctrl+Z can never wipe the whole chapter.
      { tag: HISTORY_MERGE_TAG }
    );
  }, [editor, value, recentlyEmittedRef]);

  return null;
}

export default function LexicalEditor({
  value,
  onChange,
  children,
}: Props) {
  const recentlyEmittedRef = useRef<string[]>([]);

  const initialConfig = {
    namespace: "BoundlessEditor",

    theme: EditorTheme,

    nodes: editorNodes,

    onError(error: Error) {
      throw error;
    },
  };

  function handleChange(
    editorState: EditorState,
    editor: any
    ) {
    editorState.read(() => {
        const html = $generateHtmlFromNodes(editor);

        // Remember what we sent up so the parent's echo of it
        // is not mistaken for new content from outside.
        const recent = recentlyEmittedRef.current;
        recent.push(html);
        if (recent.length > RECENT_EMITTED_LIMIT) {
          recent.shift();
        }

        onChange(html);
    });
    }

  return (
    <LexicalComposer
      initialConfig={initialConfig}
    >
      <div
        className="
          relative
          rounded-2xl
          border
          p-5
          min-h-[500px]
        "
        style={{
          background:
            "var(--background)",
          borderColor:
            "var(--card-border)",
        }}
      >

        {children}
        
        <RichTextPlugin
            contentEditable={
                <ContentEditable
                  className="                    
                    outline-none
                    min-h-[500px]
                  "
                />
            }
            placeholder={<PlaceholderPlugin />}
            ErrorBoundary={LexicalErrorBoundary}
            />

        <ListPlugin />
        
        <InitialContentPlugin
          value={value}
          recentlyEmittedRef={recentlyEmittedRef}
        />

        <HistoryPlugin />

        <MarkdownPlugin />

        <AutoFocusPlugin />

        <OnChangePlugin
            ignoreSelectionChange
            onChange={(editorState, editor) =>
              handleChange(editorState, editor)
            }
        />

        <WordCountPlugin />
      </div>
    </LexicalComposer>
  );
}