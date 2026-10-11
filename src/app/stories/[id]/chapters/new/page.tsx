"use client";

import Button from "@/components/ui/Button";
import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import LexicalEditor from "@/components/editor/LexicalEditor";
import EditorToolbar from "@/components/editor/EditorToolbar";
import { notifyFollowersOfNewChapter } from "@/app/actions/notifyFollowers";
import { registerStreakDay } from "@/app/streaks/actions";
import { checkAndAwardBadges } from "@/app/badges/actions";
import { awardWritingXP } from "@/app/cultivation/actions";

export default function NewChapterPage() {
  const supabase = createClient();

  const params = useParams();
  const storyId = params.id as string;

  const router = useRouter();

  const [chapterNumber, setChapterNumber] =
  useState<number>(1);

  const [title, setTitle] = useState("");

  const [content, setContent] = useState<string>("");

  const [message, setMessage] = useState("");

  const [scheduledAt, setScheduledAt] = useState("");

  useEffect(() => {
    async function loadNextChapterNumber() {
      const { data } = await supabase
        .from("chapters")
        .select("chapter_number")
        .eq("story_id", storyId)
        .order("chapter_number", {
          ascending: false,
        })
        .limit(1);

      if (data && data.length > 0) {
        setChapterNumber(
          data[0].chapter_number + 1
        );
      } else {
        setChapterNumber(1);
      }
    }

    loadNextChapterNumber();
  }, [storyId]);

    async function saveChapter(
    nextStatus: "Draft" | "Published"
  ) {
    const isScheduling =
      nextStatus === "Draft" && scheduledAt;

    const { data: newChapter, error } = await supabase
      .from("chapters")
      .insert({
        story_id: storyId,
        chapter_number:
          Number(chapterNumber),
        title,
        content,
        status: nextStatus,
        scheduled_at: isScheduling
          ? new Date(scheduledAt).toISOString()
          : null,
        published_at:
          nextStatus === "Published"
            ? new Date().toISOString()
            : null,
      })
      .select("id")
      .single();

    if (error) {
      setMessage(error.message);
      return;
    }

    if (nextStatus === "Published" && newChapter) {
      await notifyFollowersOfNewChapter(
        storyId,
        newChapter.id
      );

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await registerStreakDay(user.id, "writer");
        await checkAndAwardBadges(user.id);
        await awardWritingXP(user.id, content);
      }
    }

    router.push(
      `/stories/${storyId}`
    );
  }

  return (

  <main className="max-w-5xl mx-auto p-8">

<div
  className="rounded-xl border p-8"
  style={{
    backgroundColor: "var(--card)",
    borderColor: "var(--card-border)",
  }}
>

  <h1 className="text-5xl font-bold">
    Create Chapter
  </h1>

  <p className="mt-3 opacity-70">
    Add a new chapter to your story.
  </p>

  <p className="mt-2 text-sm opacity-70">
    Chapter {chapterNumber}
  </p>

  <form
    onSubmit={(e) => e.preventDefault()}
    className="mt-8 flex flex-col gap-6"
  >

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
        required
      />
    </div>

    <div>
      <label className="block mb-2 font-medium">
        Chapter Content
      </label>

      <LexicalEditor
        value={content}
        onChange={setContent}
      >
        <EditorToolbar />
      </LexicalEditor>
    </div>

        <div>
      <label className="block mb-2 font-medium">
        Schedule for later (optional)
      </label>

      <input
        type="datetime-local"
        value={scheduledAt}
        onChange={(e) => setScheduledAt(e.target.value)}
        className="w-full border rounded-lg p-3"
      />

      <p className="mt-2 text-xs opacity-60">
        Leave blank to save as a draft with no scheduled
        date, or pick a future time to auto-publish then.
        Checked every few minutes.
      </p>
    </div>

    <div className="flex gap-3">

      <Button
        type="button"
        onClick={() => saveChapter("Draft")}
      >
        Save Draft
      </Button>

      <Button
        type="button"
        onClick={() => saveChapter("Published")}
      >
        Publish
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

  </main>
);
}