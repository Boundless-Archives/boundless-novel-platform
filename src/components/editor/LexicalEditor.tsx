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

import { EditorState } from "lexical";

import EditorTheme from "./EditorTheme";
import { editorNodes } from "./nodes";

import AutoFocusPlugin from "./plugins/AutoFocusPlugin";
import HistoryPlugin from "./plugins/HistoryPlugin";
import MarkdownPlugin from "./plugins/MarkdownPlugin";
import PlaceholderPlugin from "./plugins/PlaceholderPlugin";
import { $generateHtmlFromNodes } from "@lexical/html";
import { $getRoot } from "lexical";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";

type Props = {
  value: string;
  onChange: (value: string) => void;
  children?: React.ReactNode;
};

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