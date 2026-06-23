"use client";

import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function EditChapterPage() {
  const supabase = createClient();

  const params = useParams();

  const chapterId =
    params.chapterId as string;

  const storyId =
  params.id as string;

  const router = useRouter();

  const [chapterNumber, setChapterNumber] =
    useState("");

  const [title, setTitle] =
    useState("");

  const [content, setContent] =
    useState("");

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    async function loadChapter() {
      const { data } = await supabase
        .from("chapters")
        .select("*")
        .eq("id", chapterId)
        .single();

      if (!data) return;

      setChapterNumber(
        String(data.chapter_number)
      );

      setTitle(data.title);

      setContent(data.content);
    }

    loadChapter();
  }, [chapterId, supabase]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const { error } = await supabase
      .from("chapters")
      .update({
        chapter_number:
          Number(chapterNumber),
        title,
        content,
      })
      .eq("id", chapterId);

    if (error) {
      setMessage(error.message);
      return;
    }

    router.push(
      `/stories/${storyId}`
    );
  }

  return (
    <main className="p-10 max-w-4xl">
      <h1 className="text-4xl font-bold mb-6">
        Edit Chapter
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
          className="border p-2 rounded"
        />

        <input
          value={title}
          onChange={(e) =>
            setTitle(
              e.target.value
            )
          }
          className="border p-2 rounded"
        />

        <textarea
          value={content}
          onChange={(e) =>
            setContent(
              e.target.value
            )
          }
          rows={20}
          className="border p-2 rounded"
        />
        
        <Button type="submit">
          Save Changes
        </Button>
      </form>

      {message && (
        <p className="mt-4">
          {message}
        </p>
      )}
    </main>
  );
}