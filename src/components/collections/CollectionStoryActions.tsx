"use client";

import { useState } from "react";
import {
  addStoryToCollection,
  removeStoryFromCollection,
} from "@/app/collections/actions";

type Props = {
  collectionId: string;
  storyId: string;
  isInCollection: boolean;
};

export default function CollectionStoryActions({
  collectionId,
  storyId,
  isInCollection,
}: Props) {
  const [inCollection, setInCollection] =
    useState(isInCollection);

  const [loading, setLoading] =
    useState(false);

  async function handleToggle() {
    if (loading) return;

    setLoading(true);

    try {
      if (inCollection) {
        await removeStoryFromCollection(
          collectionId,
          storyId
        );

        setInCollection(false);
      } else {
        await addStoryToCollection(
          collectionId,
          storyId
        );

        setInCollection(true);
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={loading}
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
        disabled:cursor-not-allowed
        disabled:opacity-50
      "
      style={{
        borderColor: "var(--card-border)",
      }}
    >
      {loading
        ? "Updating..."
        : inCollection
        ? "Remove from Collection"
        : "Add to Collection"}
    </button>
  );
}