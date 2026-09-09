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

  const [message, setMessage] =
    useState("");

  const [crossoverOptions, setCrossoverOptions] =
    useState<CrossoverOption[]>([]);

  const [selectedCrossover, setSelectedCrossover] =
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

      setStatus(data.status);

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

    loadChapter();
    loadCrossoverOptions();
  }, [chapterId, storyId, supabase]);

  async function saveChapter(
    nextStatus: "Draft" | "Published"
  ) {
    const { error } = await supabase
      .from("chapters")
      .update({
        chapter_number: Number(chapterNumber),
        title,
        content,
        status: nextStatus,
        crossover_request_id: selectedCrossover || null,
      })
      .eq("id", chapterId);

    if (error) {
      setMessage(error.message);
      return;
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

    <div className="flex gap-3">

      {status === "Draft" ? (
        <>
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