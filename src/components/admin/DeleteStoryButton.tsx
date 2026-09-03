"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

type Props = {
  storyId: string;
  storyTitle: string;
};

export default function DeleteStoryButton({
  storyId,
  storyTitle,
}: Props) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const router = useRouter();
  const supabase = createClient();

  function handleDelete() {
    setError("");

    startTransition(async () => {
      const { error: deleteError } = await supabase.rpc(
        "admin_delete_story",
        {
          target_story_id: storyId,
        }
      );

      if (deleteError) {
        setError(deleteError.message);
        return;
      }

      setOpen(false);
      router.refresh();
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-500/50 hover:bg-red-500/10 active:scale-[0.98] dark:text-red-400"
      >
        Delete
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-card-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-500/10 text-xl">
              ⚠️
            </div>

            <h2 className="text-xl font-bold text-foreground">
              Delete this story?
            </h2>

            <p className="mt-2 text-sm leading-6 text-foreground/65">
              You are about to permanently delete{" "}
              <span className="font-semibold text-foreground">
                "{storyTitle}"
              </span>
              .
            </p>

            <p className="mt-2 text-sm leading-6 text-red-600 dark:text-red-400">
              This action cannot be undone.
            </p>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-600 dark:text-red-400">
                {error}
              </div>
            )}

            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                disabled={isPending}
                onClick={() => setOpen(false)}
                className="rounded-xl border border-card-border bg-background px-4 py-2 text-sm font-medium text-foreground/70 transition hover:text-foreground disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={isPending}
                onClick={handleDelete}
                className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPending ? "Deleting..." : "Delete Permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}