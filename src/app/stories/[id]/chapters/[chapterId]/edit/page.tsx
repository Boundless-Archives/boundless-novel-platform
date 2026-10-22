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
import {
  getMyChapterPoll,
  removeChapterPoll,
  saveChapterPoll,
} from "@/app/actions/chapterPolls";

type CrossoverOption = {
  crossoverRequestId: string;
  counterpartTitle: string;
};

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

  const [status, setStatus] = useState<
    "Draft" | "Published"
  >("Draft");

  const [scheduledAt, setScheduledAt] = useState("");

  const [authorNote, setAuthorNote] = useState("");

  const [poll, setPoll] = useState<PollDraft>(EMPTY_POLL);

  const [hadPoll, setHadPoll] = useState(false);

  const [authorNotePosition, setAuthorNotePosition] =
    useState<"before" | "after">("after");

  const [message, setMessage] =
    useState("");

  const [crossoverOptions, setCrossoverOptions] =
    useState<CrossoverOption[]>([]);

  const [selectedCrossover, setSelectedCrossover] =
    useState("");

  const [wasPublished, setWasPublished] = 
    useState(false);

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

      setAuthorNote(data.author_note ?? "");

      setAuthorNotePosition(
        data.author_note_position === "before" ? "before" : "after"
      );

      setStatus(data.status);

      setWasPublished(data.status === "Published");
      if (data.scheduled_at) {
        setScheduledAt(
          new Date(data.scheduled_at)
            .toISOString()
            .slice(0, 16)
        );
      }

      setSelectedCrossover(
        data.crossover_request_id ?? ""
      );
    }

    async function loadCrossoverOptions() {
      const { data } = await supabase
        .from("crossover_requests")
        .select(
          `
          id,
          requesting_story_id,
          target_story_id,
          requesting_story:requesting_story_id ( title ),
          target_story:target_story_id ( title )
        `
        )
        .eq("status", "accepted")
        .or(
          `requesting_story_id.eq.${storyId},target_story_id.eq.${storyId}`
        );

      const options = (data ?? []).map((request: any) => {
        const isRequester =
          request.requesting_story_id === storyId;

        const counterpart = isRequester
          ? request.target_story
          : request.requesting_story;

        const counterpartInfo = Array.isArray(counterpart)
          ? counterpart[0]
          : counterpart;

        return {
          crossoverRequestId: request.id as string,
          counterpartTitle: counterpartInfo?.title as string,
        };
      });

      setCrossoverOptions(options);
    }

    async function loadPoll() {
      const existing = await getMyChapterPoll(chapterId);

      if (!existing) return;

      setHadPoll(true);

      const closes = existing.closes_at ? new Date(existing.closes_at) : null;
      const pad = (n: number) => String(n).padStart(2, "0");

      setPoll({
        enabled: true,
        question: existing.question,
        options: existing.options,
        closesAt: closes
          ? `${closes.getFullYear()}-${pad(closes.getMonth() + 1)}-${pad(
              closes.getDate()
            )}T${pad(closes.getHours())}:${pad(closes.getMinutes())}`
          : "",
        locked: (existing.total ?? 0) > 0,
      });
    }

    loadChapter();
    loadCrossoverOptions();
    loadPoll();
  }, [chapterId, storyId, supabase]);

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
      nextStatus === "Draft" && scheduledAt && !wasPublished;

    const { error } = await supabase
      .from("chapters")
      .update({
        chapter_number: Number(chapterNumber),
        title,
        content,
        author_note: authorNote.trim() || null,
        author_note_position: authorNotePosition,
        status: nextStatus,
        crossover_request_id: selectedCrossover || null,
        scheduled_at: isScheduling
          ? new Date(scheduledAt).toISOString()
          : null,
        ...(nextStatus === "Published" && !wasPublished
          ? { published_at: new Date().toISOString() }
          : {}),
      })
      .eq("id", chapterId);

    if (error) {
      setMessage(error.message);
      return;
    }

    if (poll.enabled) {
      const res = await saveChapterPoll(chapterId, {
        question: poll.question,
        options: poll.options,
        closesAt: poll.closesAt ? new Date(poll.closesAt).toISOString() : null,
      });

      if (res.error) {
        setMessage(`Chapter saved, but the poll wasn't: ${res.error}`);
        return;
      }
    } else if (hadPoll) {
      await removeChapterPoll(chapterId);
    }

    if (nextStatus === "Published" && !wasPublished) {

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        await registerMyWriterStreak(
          Intl.DateTimeFormat().resolvedOptions().timeZone
        );
        await checkAndAwardBadges(user.id);
        await claimWritingXP(chapterId);
      }
    }

    setStatus(nextStatus);

    router.push(
      `/stories/${storyId}/chapters`
    );
  }

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    await saveChapter(status);
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

        {crossoverOptions.length > 0 && (
      <div>
        <label className="block mb-2 font-medium">
          Part of a Crossover? (optional)
        </label>

        <select
          value={selectedCrossover}
          onChange={(e) =>
            setSelectedCrossover(e.target.value)
          }
          className="w-full border rounded-lg p-3"
        >
          <option value="">
            Not part of a crossover
          </option>

          {crossoverOptions.map((option) => (
            <option
              key={option.crossoverRequestId}
              value={option.crossoverRequestId}
            >
              Crossover with {option.counterpartTitle}
            </option>
          ))}
        </select>
      </div>
    )}

    {!wasPublished && (
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
    )}

    <div className="flex gap-3">

      {status === "Draft" ? (
        <>
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
        </>
      ) : (
        <Button type="submit">
          Save Changes
        </Button>
      )}

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