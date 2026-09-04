"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getOfflineBook,
  type OfflineBook,
  type OfflineChapter,
} from "@/lib/offline-books";

export default function OfflineChapterReader() {
  const [book, setBook] =
    useState<OfflineBook | null>(null);

  const [chapter, setChapter] =
    useState<OfflineChapter | null>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadChapter() {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const storyId =
          params.get("storyId");

        const chapterId =
          params.get("chapterId");

        if (!storyId || !chapterId) {
          setLoading(false);
          return;
        }

        const offlineBook =
          await getOfflineBook(storyId);

        if (!offlineBook) {
          setLoading(false);
          return;
        }

        const foundChapter =
          offlineBook.chapters.find(
            (item) => item.id === chapterId
          );

        setBook(offlineBook);
        setChapter(foundChapter ?? null);
      } catch (error) {
        console.error(
          "Failed to load offline chapter:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadChapter();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="opacity-60">
          Loading chapter...
        </p>
      </main>
    );
  }

  if (!book || !chapter) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold">
          Chapter not found
        </h1>

        <p className="mt-2 text-sm opacity-60">
          This chapter could not be found in the
          offline download on this device.
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

  const currentIndex =
    book.chapters.findIndex(
      (item) => item.id === chapter.id
    );

  const previousChapter =
    currentIndex > 0
      ? book.chapters[currentIndex - 1]
      : null;

  const nextChapter =
    currentIndex <
    book.chapters.length - 1
      ? book.chapters[currentIndex + 1]
      : null;

  function readerUrl(
    chapterId: string
  ) {
    return `/downloads/read?storyId=${encodeURIComponent(
      book!.storyId
    )}&chapterId=${encodeURIComponent(
      chapterId
    )}`;
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <Link
          href={`/downloads/${book.storyId}`}
          className="text-sm opacity-60 hover:opacity-100"
        >
          ← {book.title}
        </Link>

        <p className="mt-5 text-sm uppercase tracking-wide opacity-50">
          Chapter {chapter.chapter_number}
        </p>

        <h1 className="mt-2 text-3xl font-bold">
          {chapter.title}
        </h1>
      </div>

      <article
        className="prose max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{
          __html: chapter.content,
        }}
      />

      <div className="mt-12 flex items-center justify-between gap-4 border-t pt-6">
        {previousChapter ? (
          <Link
            href={readerUrl(
              previousChapter.id
            )}
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            ← Previous
          </Link>
        ) : (
          <span />
        )}

        {nextChapter ? (
          <Link
            href={readerUrl(
              nextChapter.id
            )}
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            Next →
          </Link>
        ) : (
          <Link
            href={`/downloads/${book.storyId}`}
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            Back to book
          </Link>
        )}
      </div>
    </main>
  );
}