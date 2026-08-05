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
  $getRoot,
  $insertNodes,
} from "lexical";

import EditorTheme from "./EditorTheme";
import { editorNodes } from "./nodes";

import AutoFocusPlugin from "./plugins/AutoFocusPlugin";
import HistoryPlugin from "./plugins/HistoryPlugin";
import MarkdownPlugin from "./plugins/MarkdownPlugin";
import PlaceholderPlugin from "./plugins/PlaceholderPlugin";
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
import { useEffect } from "react";

function InitialContentPlugin({
  value,
}: {
  value: string;
}) {
  const [editor] =
    useLexicalComposerContext();

  useEffect(() => {
    if (!value) return;

    editor.update(() => {
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
    });
  }, [editor, value]);

  return null;
}

export default function LexicalEditor({
  value,
  onChange,
  children,
}: Props) {
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
        />

        <HistoryPlugin />

        <MarkdownPlugin />

        <AutoFocusPlugin />

        <OnChangePlugin
            onChange={(editorState, editor) =>
              handleChange(editorState, editor)
            }
        />
      </div>
    </LexicalComposer>
  );
}