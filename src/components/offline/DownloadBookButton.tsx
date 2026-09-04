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
  const [downloaded, setDownloaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let mounted = true;

    async function checkDownload() {
      try {
        const exists = await isBookDownloaded(storyId);

        if (mounted) {
          setDownloaded(exists);
        }
      } catch (error) {
        console.error(
          "Failed to check offline book:",
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
        "You need an internet connection to download this book."
      );
      return;
    }

    if (chapters.length === 0) {
      setMessage(
        "This book has no published chapters to download yet."
      );
      return;
    }

    try {
      setDownloading(true);
      setMessage("");

      await saveOfflineBook({
        storyId,
        slug,
        title,
        description,
        coverUrl,
        downloadedAt: new Date().toISOString(),
        chapters,
      });

      setDownloaded(true);
      setMessage("Book downloaded for offline reading.");
    } catch (error) {
      console.error(
        "Failed to download book:",
        error
      );

      setMessage(
        "Failed to download this book. Please try again."
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
      setMessage("Offline download removed.");
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
        Checking...
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
            ? "Downloading..."
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