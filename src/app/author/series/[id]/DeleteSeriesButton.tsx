"use client";

import { useState } from "react";

type Props = {
  action: () => Promise<void>;
  seriesTitle: string;
};

export default function DeleteSeriesButton({
  action,
  seriesTitle,
}: Props) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${seriesTitle}"? This will not delete your stories.`
    );

    if (!confirmed) {
      return;
    }

    setDeleting(true);

    try {
      await action();
    } catch (error) {
      console.error(error);
      setDeleting(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleting}
      className="
        rounded-lg
        border
        px-4
        py-2
        font-medium
        transition
        hover:-translate-y-0.5
        disabled:opacity-50
        disabled:cursor-not-allowed
      "
      style={{
        borderColor: "var(--card-border)",
      }}
    >
      {deleting ? "Deleting..." : "Delete Series"}
    </button>
  );
}