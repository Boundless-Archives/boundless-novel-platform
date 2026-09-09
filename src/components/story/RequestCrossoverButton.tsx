"use client";

import { useState, useTransition, useEffect } from "react";
import {
  getMyStoriesForCrossover,
  requestCrossover,
} from "@/app/crossovers/actions";

type MyStory = {
  id: string;
  title: string;
  slug: string;
};

type Props = {
  targetStoryId: string;
  targetCanonTier: string;
};

export default function RequestCrossoverButton({
  targetStoryId,
  targetCanonTier,
}: Props) {
  if (targetCanonTier === "B") {
    return null;
  }
  const [open, setOpen] = useState(false);
  const [myStories, setMyStories] = useState<MyStory[]>([]);
  const [selectedStoryId, setSelectedStoryId] = useState("");
  const [message, setMessage] = useState("");
    const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open || myStories.length > 0) return;

    getMyStoriesForCrossover()
      .then((stories) => setMyStories(stories))
      .catch(() => setMyStories([]));
  }, [open, myStories.length]);

  function handleSubmit() {
    if (!selectedStoryId) return;

    startTransition(async () => {
      try {
        await requestCrossover(
          selectedStoryId,
          targetStoryId,
          message
        );
        setStatus("sent");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
        setStatus("error");
      }
    });
  }

  if (status === "sent") {
    return (
      <span
        className="
          px-4
          py-2
          rounded-lg
          border
          text-sm
          font-medium
        "
        style={{ borderColor: "var(--card-border)" }}
      >
        Crossover request sent ✓
      </span>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="
          px-4
          py-2
          rounded-lg
          border
          font-medium
          transition
          hover:bg-black
          hover:text-white
        "
        style={{ borderColor: "var(--card-border)" }}
      >
        🌐 Request Crossover
      </button>

      {open && (
        <div
          className="
            absolute
            z-10
            mt-2
            w-80
            rounded-xl
            border
            p-4
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <p className="text-sm font-semibold mb-2">
            Pick your story
          </p>

          {myStories.length === 0 ? (
            <p className="text-sm opacity-70">
              You need at least one story of your own
              before requesting a crossover.
            </p>
          ) : (
            <>
              <select
                value={selectedStoryId}
                onChange={(e) =>
                  setSelectedStoryId(e.target.value)
                }
                className="w-full border rounded-lg p-2 text-sm"
              >
                <option value="">
                  Select a story...
                </option>

                {myStories.map((story) => (
                  <option key={story.id} value={story.id}>
                    {story.title}
                  </option>
                ))}
              </select>

              <textarea
                value={message}
                onChange={(e) =>
                  setMessage(e.target.value)
                }
                placeholder="Pitch the crossover idea (optional)"
                rows={3}
                className="w-full border rounded-lg p-2 text-sm mt-3"
              />

              {status === "error" && (
                <p className="text-sm text-red-500 mt-2">
                  {errorMessage}
                </p>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={!selectedStoryId || isPending}
                className="
                  w-full
                  mt-3
                  px-4
                  py-2
                  rounded-lg
                  font-medium
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                "
                style={{
                  backgroundColor: "var(--button)",
                  color: "var(--button-text)",
                }}
              >
                {isPending ? "Sending..." : "Send Request"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}