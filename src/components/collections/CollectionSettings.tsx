"use client";

import { useState } from "react";
import {
  updateCollection,
  deleteCollection,
} from "@/app/collections/actions";

type Props = {
  collectionId: string;
  initialTitle: string;
  initialDescription: string | null;
  initialIsPublic: boolean;
};

export default function CollectionSettings({
  collectionId,
  initialTitle,
  initialDescription,
  initialIsPublic,
}: Props) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(
    initialDescription ?? ""
  );
  const [isPublic, setIsPublic] =
    useState(initialIsPublic);

  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setMessage("");
    setSaving(true);

    try {
      await updateCollection(
        collectionId,
        title,
        description,
        isPublic
      );

      setEditing(false);
      setMessage("Collection updated.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      "Are you sure you want to delete this collection?"
    );

    if (!confirmed) return;

    try {
      await deleteCollection(collectionId);
      window.location.href = "/collections";
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    }
  }

  if (!editing) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="
            rounded-xl
            border
            px-4
            py-2
            text-sm
            font-medium
            transition
            hover:-translate-y-0.5
            hover:shadow-md
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Edit Collection
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="
            rounded-xl
            border
            px-4
            py-2
            text-sm
            font-medium
            transition
            hover:-translate-y-0.5
            hover:shadow-md
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Delete Collection
        </button>

        {message && (
          <span className="text-sm opacity-70">
            {message}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className="
        rounded-2xl
        border
        p-6
        space-y-5
      "
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <div>
        <label className="block text-sm font-medium mb-2">
          Collection Title
        </label>

        <input
          value={title}
          onChange={(e) =>
            setTitle(e.target.value)
          }
          className="
            w-full
            rounded-xl
            border
            px-4
            py-3
            outline-none
          "
          style={{
            backgroundColor: "var(--background)",
            borderColor: "var(--card-border)",
          }}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Description
        </label>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          rows={4}
          className="
            w-full
            rounded-xl
            border
            px-4
            py-3
            outline-none
            resize-none
          "
          style={{
            backgroundColor: "var(--background)",
            borderColor: "var(--card-border)",
          }}
        />
      </div>

      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) =>
            setIsPublic(e.target.checked)
          }
        />

        <span className="text-sm">
          Public collection
        </span>
      </label>

      {message && (
        <p className="text-sm opacity-70">
          {message}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="
            rounded-xl
            px-5
            py-3
            font-semibold
            transition
            hover:-translate-y-0.5
            disabled:opacity-50
          "
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button
          type="button"
          onClick={() => {
            setTitle(initialTitle);
            setDescription(
              initialDescription ?? ""
            );
            setIsPublic(initialIsPublic);
            setEditing(false);
            setMessage("");
          }}
          className="
            rounded-xl
            border
            px-5
            py-3
            transition
            hover:-translate-y-0.5
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleDelete}
          className="
            rounded-xl
            border
            px-5
            py-3
            transition
            hover:-translate-y-0.5
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Delete Collection
        </button>
      </div>
    </div>
  );
}