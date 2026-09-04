"use client";

import { useEffect, useState } from "react";
import {
  deleteOfflineBook,
  isBookDownloaded,
  saveOfflineBook,
} from "@/lib/offline-books";

type Chapter = {
  id: string;
  chapter_number: number;
  title: string;
  content: string;
};

type DownloadBookButtonProps = {
  storyId: string;
  slug: string;
  title: string;
  description: string | null;
  coverUrl: string | null;
  chapters: Chapter[];
};

export default function DownloadBookButton({
  storyId,
  slug,
  title,
  description,
  coverUrl,
  chapters,
}: DownloadBookButtonProps) {
  const [downloaded, setDownloaded] =
    useState(false);

  const [loading, setLoading] =
    useState(true);

  const [downloading, setDownloading] =
    useState(false);

  const [message, setMessage] =
    useState("");

  useEffect(() => {
    let mounted = true;

    async function checkDownload() {
      try {
        const exists =
          await isBookDownloaded(storyId);

        if (mounted) {
          setDownloaded(exists);
        }
      } catch (error) {
        console.error(
          "Failed to check offline download:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    checkDownload();

    return () => {
      mounted = false;
    };
  }, [storyId]);

  async function handleDownload() {
    if (downloading) {
      return;
    }

    if (!navigator.onLine) {
      setMessage(
        "Connect to the internet before downloading this book."
      );
      return;
    }

    if (chapters.length === 0) {
      setMessage(
        "There are no published chapters to download."
      );
      return;
    }

    try {
      setDownloading(true);
      setMessage("");

      /*
       * The complete published chapter data is already
       * available on the story page. We save all of it
       * directly into IndexedDB.
       *
       * No chapter page needs to be opened.
       * No chapter route needs to be cached.
       */
      await saveOfflineBook({
        storyId,
        slug,
        title,
        description,
        coverUrl,
        downloadedAt:
          new Date().toISOString(),
        chapters: chapters.map(
          (chapter) => ({
            id: chapter.id,
            chapter_number:
              chapter.chapter_number,
            title: chapter.title,
            content: chapter.content,
          })
        ),
      });

      setDownloaded(true);

      setMessage(
        `${chapters.length} ${
          chapters.length === 1
            ? "chapter"
            : "chapters"
        } downloaded for offline reading.`
      );
    } catch (error) {
      console.error(
        "Failed to download book:",
        error
      );

      setMessage(
        "The download failed. Please try again."
      );
    } finally {
      setDownloading(false);
    }
  }

  async function handleDelete() {
    if (downloading) {
      return;
    }

    try {
      setDownloading(true);
      setMessage("");

      await deleteOfflineBook(storyId);

      setDownloaded(false);

      setMessage(
        "Offline download removed."
      );
    } catch (error) {
      console.error(
        "Failed to remove offline book:",
        error
      );

      setMessage(
        "Failed to remove the offline download."
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <button
        type="button"
        disabled
        className="rounded-lg border px-4 py-2 text-sm opacity-50"
      >
        Checking download...
      </button>
    );
  }

  return (
    <div className="flex flex-col items-start gap-2">
      {downloaded ? (
        <button
          type="button"
          onClick={handleDelete}
          disabled={downloading}
          className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
        >
          {downloading
            ? "Removing..."
            : "✓ Downloaded"}
        </button>
      ) : (
        <button
          type="button"
          onClick={handleDownload}
          disabled={downloading}
          className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/5"
        >
          {downloading
            ? `Downloading ${chapters.length} ${
                chapters.length === 1
                  ? "chapter"
                  : "chapters"
              }...`
            : "Download for offline"}
        </button>
      )}

      {message && (
        <p className="text-xs opacity-60">
          {message}
        </p>
      )}
    </div>
  );
}