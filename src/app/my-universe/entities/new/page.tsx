"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  getMyStoriesForWiki,
  createEntity,
} from "@/app/wiki/actions";
import { ENTITY_TYPES, getEntityTypeLabel } from "@/lib/entityTypes";

type MyStory = {
  id: string;
  title: string;
  canon_tier: string;
};

export default function NewEntityPage() {
  const router = useRouter();

  const [stories, setStories] = useState<MyStory[]>([]);
  const [entityType, setEntityType] =
    useState<string>("character");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [originStoryId, setOriginStoryId] = useState("");
  const [appearanceIds, setAppearanceIds] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    getMyStoriesForWiki()
      .then(setStories)
      .catch(() => setStories([]));
  }, []);

  function toggleAppearance(storyId: string) {
    setAppearanceIds((current) =>
      current.includes(storyId)
        ? current.filter((id) => id !== storyId)
        : [...current, storyId]
    );
  }

  function handleSubmit() {
    setErrorMessage("");

    startTransition(async () => {
      try {
        const result = await createEntity({
          entityType,
          name,
          summary,
          content,
          originStoryId,
          appearanceStoryIds: appearanceIds,
        });

        router.push(`/my-universe`);
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      }
    });
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold">
        New Wiki Entity
      </h1>

      <div className="mt-6 space-y-5">
        <div>
          <label className="block mb-2 font-medium">
            Type
          </label>

          <select
            value={entityType}
            onChange={(e) => setEntityType(e.target.value)}
            className="w-full border rounded-lg p-3"
          >
            {ENTITY_TYPES.map((type) => (
              <option key={type} value={type}>
                {getEntityTypeLabel(type)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Name
          </label>

          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. The Hollow King"
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Summary
          </label>

          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={2}
            placeholder="A one or two sentence blurb."
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Full Entry
          </label>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="The full wiki entry — history, traits, rules, anything readers should know."
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Origin Story (where this first appeared)
          </label>

          {stories.length === 0 ? (
            <p className="text-sm opacity-70">
              You need a published story before creating a
              wiki entry.
            </p>
          ) : (
            <select
              value={originStoryId}
              onChange={(e) =>
                setOriginStoryId(e.target.value)
              }
              className="w-full border rounded-lg p-3"
            >
              <option value="">
                Select a story...
              </option>

              {stories.map((story) => (
                <option key={story.id} value={story.id}>
                  {story.title} ({story.canon_tier}-Tier)
                </option>
              ))}
            </select>
          )}
        </div>

        {stories.length > 1 && (
          <div>
            <label className="block mb-2 font-medium">
              Also appears in (optional)
            </label>

            <div className="space-y-2">
              {stories
                .filter((story) => story.id !== originStoryId)
                .map((story) => (
                  <label
                    key={story.id}
                    className="flex items-center gap-2 text-sm"
                  >
                    <input
                      type="checkbox"
                      checked={appearanceIds.includes(
                        story.id
                      )}
                      onChange={() =>
                        toggleAppearance(story.id)
                      }
                    />
                    {story.title} ({story.canon_tier}-Tier)
                  </label>
                ))}
            </div>
          </div>
        )}

        {errorMessage && (
          <p className="text-sm text-red-500">
            {errorMessage}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={
            !name.trim() || !originStoryId || isPending
          }
          className="
            px-5
            py-3
            rounded-lg
            font-semibold
            disabled:opacity-50
            disabled:cursor-not-allowed
          "
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          {isPending ? "Creating..." : "Create Entity"}
        </button>
      </div>
    </main>
  );
}