"use client";

import { useEffect, useState, useTransition } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getEntityForEdit,
  getMyStoriesForWiki,
  updateEntity,
} from "@/app/wiki/actions";
import { ENTITY_TYPES, getEntityTypeLabel } from "@/lib/entityTypes";

type MyStory = {
  id: string;
  title: string;
  canon_tier: string;
};

export default function EditEntityPage() {
  const params = useParams();
  const entityId = params.entityId as string;
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [stories, setStories] = useState<MyStory[]>([]);
  const [entityType, setEntityType] = useState("character");
  const [name, setName] = useState("");
  const [summary, setSummary] = useState("");
  const [content, setContent] = useState("");
  const [originStoryId, setOriginStoryId] = useState("");
  const [appearanceIds, setAppearanceIds] = useState<string[]>([]);
  const [universeSlug, setUniverseSlug] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    async function load() {
      const [entity, myStories] = await Promise.all([
        getEntityForEdit(entityId),
        getMyStoriesForWiki(),
      ]);

      setName(entity.name);
      setEntityType(entity.entityType);
      setSummary(entity.summary);
      setContent(entity.content);
      setOriginStoryId(entity.originStoryId);
      setAppearanceIds(
        entity.appearanceStoryIds.filter(
          (id: string) => id !== entity.originStoryId
        )
      );
      setUniverseSlug(entity.universeSlug);
      setStories(myStories);
      setLoading(false);
    }

    load().catch((error) => {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Failed to load entity."
      );
      setLoading(false);
    });
  }, [entityId]);

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
        await updateEntity(entityId, {
          entityType,
          name,
          summary,
          content,
          appearanceStoryIds: appearanceIds,
        });

        router.push("/my-universe");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      }
    });
  }

  if (loading) {
    return (
      <main className="max-w-2xl mx-auto p-8">
        <p className="opacity-60">Loading...</p>
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold">
        Edit Wiki Entity
      </h1>

      {universeSlug && (
        <a
          href={`/wiki/${universeSlug}`}
          className="text-sm underline opacity-70"
        >
          View on public wiki →
        </a>
      )}

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
            className="w-full border rounded-lg p-3"
          />
        </div>

        {stories.length > 1 && (
          <div>
            <label className="block mb-2 font-medium">
              Also appears in
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
          disabled={!name.trim() || isPending}
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
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </main>
  );
}