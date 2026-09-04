"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getOfflineBook,
  type OfflineBook,
} from "@/lib/offline-books";

type OfflineBookReaderProps = {
  storyId: string;
};

export default function OfflineBookReader({
  storyId,
}: OfflineBookReaderProps) {
  const [book, setBook] =
    useState<OfflineBook | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBook() {
      try {
        const offlineBook =
          await getOfflineBook(storyId);

        setBook(offlineBook);
      } catch (error) {
        console.error(
          "Failed to load offline book:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadBook();
  }, [storyId]);

  if (loading) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <p className="opacity-60">
          Loading offline book...
        </p>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-10">
        <h1 className="text-2xl font-bold">
          Book not found
        </h1>

        <p className="mt-2 text-sm opacity-60">
          This book is not currently stored on this
          device.
        </p>

        <Link
          href="/downloads"
          className="mt-5 inline-block rounded-lg border px-4 py-2 text-sm"
        >
          Back to downloads
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <div className="mb-8">
        <Link
          href="/downloads"
          className="text-sm opacity-60 hover:opacity-100"
        >
          ← Offline Downloads
        </Link>

        <h1 className="mt-4 text-3xl font-bold">
          {book.title}
        </h1>

        {book.description && (
          <p className="mt-3 text-sm opacity-60">
            {book.description}
          </p>
        )}
      </div>

      <div className="space-y-3">
        {book.chapters.map((chapter) => (
          <Link
            key={chapter.id}
            href={`/downloads/${book.storyId}/${chapter.id}`}
            className="block rounded-xl border p-5 transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            <p className="text-xs uppercase tracking-wide opacity-50">
              Chapter {chapter.chapter_number}
            </p>

            <h2 className="mt-1 font-semibold">
              {chapter.title}
            </h2>
          </Link>
        ))}
      </div>
    </main>
  );
}