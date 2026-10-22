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
import { registerMyWriterStreak } from "@/app/streaks/actions";
import { checkAndAwardBadges } from "@/app/badges/actions";
import { claimWritingXP } from "@/app/cultivation/actions";
import AuthorNoteFields from "@/components/editor/AuthorNoteFields";
import PollEditor, { EMPTY_POLL, type PollDraft } from "@/components/editor/PollEditor";
import { saveChapterPoll } from "@/app/actions/chapterPolls";

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

  const [authorNote, setAuthorNote] = useState("");

  const [poll, setPoll] = useState<PollDraft>(EMPTY_POLL);

  const [authorNotePosition, setAuthorNotePosition] =
    useState<"before" | "after">("after");

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
    if (
     nextStatus === "Draft" &&
     scheduledAt &&
     new Date(scheduledAt).getTime() <= Date.now()
    ) {
     setMessage("You're unworthy of travelling to the past, pick a time in the future instead.");
     return;
    }

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
        author_note: authorNote.trim() || null,
        author_note_position: authorNotePosition,
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

    if (poll.enabled && newChapter) {
      const res = await saveChapterPoll(newChapter.id, {
        question: poll.question,
        options: poll.options,
        closesAt: poll.closesAt ? new Date(poll.closesAt).toISOString() : null,
      });

      if (res.error) {
        // the chapter is saved; the poll can be added from the edit page
        alert(`Chapter saved, but the poll wasn't: ${res.error}`);
      }
    }

    if (nextStatus === "Published" && newChapter) {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await registerMyWriterStreak(
          Intl.DateTimeFormat().resolvedOptions().timeZone
        );
        await checkAndAwardBadges(user.id);
        await claimWritingXP(newChapter.id);
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

    <AuthorNoteFields
      content={content}
      note={authorNote}
      position={authorNotePosition}
      onNote={setAuthorNote}
      onPosition={setAuthorNotePosition}
    />

    <PollEditor poll={poll} onChange={setPoll} />

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
        Pick a date and time, then press Schedule. 
        The chapter stays a draft until then and auto
        publishes within about 5 minutes of that time 
        (in your local time). Leave this blank to just 
        save a plain draft.
      </p>
    </div>

    <div className="flex gap-3">

      <Button
        type="button"
        onClick={() => saveChapter("Draft")}
      >
        {scheduledAt ? "Schedule" : "Save Draft"}
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