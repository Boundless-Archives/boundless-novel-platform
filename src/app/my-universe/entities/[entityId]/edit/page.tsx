"use client";

import { useEffect, useState, useTransition, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getEntityForEdit,
  getMyStoriesForWiki,
  updateEntity,
} from "@/app/wiki/actions";
import { ENTITY_TYPES, getEntityTypeLabel } from "@/lib/entityTypes";
import RelationshipManager from "@/components/wiki/RelationshipManager";
import { createClient } from "@/utils/supabase/client";

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);  

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
      setImagePreview(entity.imageUrl);
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

  function wrapSelection(before: string, after: string = before) {
    const textarea = contentRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = content.slice(start, end);

    const newContent =
      content.slice(0, start) +
      before +
      selected +
      after +
      content.slice(end);

    setContent(newContent);

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + before.length,
        end + before.length
      );
    });
  }

  function handleSubmit() {
    setErrorMessage("");

    startTransition(async () => {
      try {
        let imageUrl: string | null = imagePreview;

        if (imageFile) {
          const supabase = createClient();
          const fileExt = imageFile.name.split(".").pop();
          const fileName = `${crypto.randomUUID()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from("entity-images")
            .upload(fileName, imageFile);

          if (uploadError) {
            setErrorMessage("Image upload failed.");
            return;
          }

          const { data } = supabase.storage
            .from("entity-images")
            .getPublicUrl(fileName);

          imageUrl = data.publicUrl;
        }

        await updateEntity(entityId, {
          entityType,
          name,
          summary,
          content,
          imageUrl,
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
            Image (optional)
          </label>

          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setImageFile(file);
              setImagePreview(
                file ? URL.createObjectURL(file) : null
              );
            }}
            className="w-full border rounded-lg p-2 text-sm"
          />

          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-3 h-32 w-32 rounded-lg object-cover"
            />
          )}
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

          <div className="flex gap-1 mb-2">
            <button type="button" onClick={() => wrapSelection("**")} className="px-2 py-1 rounded border text-sm font-bold" style={{ borderColor: "var(--card-border)" }}>B</button>
            <button type="button" onClick={() => wrapSelection("*")} className="px-2 py-1 rounded border text-sm italic" style={{ borderColor: "var(--card-border)" }}>I</button>
            <button type="button" onClick={() => wrapSelection("## ", "")} className="px-2 py-1 rounded border text-sm" style={{ borderColor: "var(--card-border)" }}>H2</button>
            <button type="button" onClick={() => wrapSelection("[", "](url)")} className="px-2 py-1 rounded border text-sm" style={{ borderColor: "var(--card-border)" }}>Link</button>
          </div>

          <textarea
            ref={contentRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            placeholder="The full wiki entry — history, traits, rules, anything readers should know. Supports **bold**, *italic*, ## headings, and [links](url)."
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

        <div
          className="rounded-xl border p-5"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <h2 className="font-semibold mb-4">
            Relationships
          </h2>

          <RelationshipManager entityId={entityId} />
        </div>

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