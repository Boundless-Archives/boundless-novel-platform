const EditorTheme = {
  paragraph: "mb-4 leading-8",

  quote:
    "border-l-4 border-cyan-500 pl-4 italic opacity-80 my-4",

  heading: {
    h1: "text-4xl font-bold mt-8 mb-5",
    h2: "text-3xl font-bold mt-7 mb-4",
    h3: "text-2xl font-semibold mt-6 mb-3",
  },

  list: {
    ul: "list-disc ml-6 my-4",
    ol: "list-decimal ml-6 my-4",
    listitem: "mb-2",
  },

  text: {
    bold: "font-bold",
    italic: "italic",
    underline: "underline",
    strikethrough: "line-through",
    code:
      "rounded bg-[var(--card)] px-1 py-0.5 font-mono text-sm",
  },

  code:
    "block rounded-xl bg-[var(--card)] border border-[var(--card-border)] p-4 font-mono overflow-x-auto my-5",

  link:
    "text-cyan-500 underline underline-offset-4 hover:text-cyan-400",

  root:
    "min-h-[500px] outline-none text-lg leading-8",
};

export default EditorTheme;