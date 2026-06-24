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

  <main className="max-w-5xl mx-auto p-8">

```
<div
  className="rounded-xl border p-8"
  style={{
    backgroundColor: "var(--card)",
    borderColor: "var(--card-border)",
  }}
>

  <h1 className="text-5xl font-bold">
    Edit Chapter
  </h1>

  <p className="mt-3 opacity-70">
    Update chapter information and content.
  </p>

  <form
    onSubmit={handleSubmit}
    className="mt-8 flex flex-col gap-6"
  >

    <div>
      <label className="block mb-2 font-medium">
        Chapter Number
      </label>

      <input
        type="number"
        value={chapterNumber}
        onChange={(e) =>
          setChapterNumber(
            e.target.value
          )
        }
        className="
          w-full
          border
          rounded-lg
          p-3
        "
      />
    </div>

    <div>
      <label className="block mb-2 font-medium">
        Chapter Title
      </label>

      <input
        value={title}
        onChange={(e) =>
          setTitle(
            e.target.value
          )
        }
        className="
          w-full
          border
          rounded-lg
          p-3
        "
      />
    </div>

    <div>
      <label className="block mb-2 font-medium">
        Chapter Content
      </label>

      <textarea
        value={content}
        onChange={(e) =>
          setContent(
            e.target.value
          )
        }
        rows={25}
        className="
          w-full
          border
          rounded-lg
          p-3
        "
      />
    </div>

    <div className="flex gap-3">

      <Button type="submit">
        Save Changes
      </Button>

      <button
        type="button"
        onClick={() =>
          router.push(
            `/stories/${storyId}/chapters`
          )
        }
        className="
          border
          rounded-lg
          px-4
          py-2
        "
        style={{
          borderColor:
            "var(--card-border)",
        }}
      >
        Cancel
      </button>

    </div>

  </form>

  {message && (
    <div
      className="mt-6 border rounded-lg p-4"
      style={{
        borderColor:
          "var(--card-border)",
      }}
    >
      {message}
    </div>
  )}

</div>
```

  </main>
);
}