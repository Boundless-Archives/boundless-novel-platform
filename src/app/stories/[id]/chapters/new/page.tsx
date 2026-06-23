"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function NewChapterPage() {
  const supabase = createClient();

  const params = useParams();
  const storyId = params.id as string;

  const [chapterNumber, setChapterNumber] =
    useState("");

  const [title, setTitle] = useState("");

  const [content, setContent] = useState("");

  const [message, setMessage] = useState("");

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const { error } = await supabase
      .from("chapters")
      .insert({
        story_id: storyId,
        chapter_number:
          Number(chapterNumber),
        title,
        content,
      });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Chapter created successfully."
    );
  }

  return (
    <main className="p-10 max-w-3xl">
      <h1 className="text-4xl font-bold mb-6">
        Create Chapter
      </h1>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4"
      >
        <input
          type="number"
          value={chapterNumber}
          onChange={(e) =>
            setChapterNumber(
              e.target.value
            )
          }
          placeholder="Chapter Number"
          className="border p-2 rounded"
          required
        />

        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          placeholder="Chapter Title"
          className="border p-2 rounded"
          required
        />

        <textarea
          value={content}
          onChange={(e) =>
            setContent(e.target.value)
          }
          placeholder="Chapter Content"
          rows={20}
          className="border p-2 rounded"
          required
        />

        <button
          type="submit"
          className="border rounded p-2"
        >
          Create Chapter
        </button>
      </form>

      {message && (
        <p className="mt-4">
          {message}
        </p>
      )}
    </main>
  );
}