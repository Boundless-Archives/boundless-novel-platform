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
    async function load() {
      try {
        const params = new URLSearchParams(
          window.location.search
        );

        const storyId =
          params.get("storyId");

        const chapterId =
          params.get("chapterId");

        if (!storyId) {
          setLoading(false);
          return;
        }

        const offlineBook =
          await getOfflineBook(storyId);

        if (!offlineBook) {
          setLoading(false);
          return;
        }

        setBook(offlineBook);

        if (chapterId) {
          const foundChapter =
            offlineBook.chapters.find(
              (item) => item.id === chapterId
            );

          setChapter(
            foundChapter ?? null
          );
        }
      } catch (error) {
        console.error(
          "Failed to load offline content:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <p className="opacity-60">
          Loading offline content...
        </p>
      </main>
    );
  }

  if (!book) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-bold">
          Offline book not found
        </h1>

        <Link
          href="/downloads"
          className="mt-5 inline-block rounded-lg border px-4 py-2 text-sm"
        >
          Back to downloads
        </Link>
      </main>
    );
  }

  if (!chapter) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href="/downloads"
          className="text-sm opacity-60 hover:opacity-100"
        >
          ← Offline Downloads
        </Link>

        <h1 className="mt-5 text-3xl font-bold">
          {book.title}
        </h1>

        <div className="mt-8 space-y-3">
          {book.chapters.map(
            (item) => (
              <Link
                key={item.id}
                href={`/downloads/read?storyId=${encodeURIComponent(
                  book.storyId
                )}&chapterId=${encodeURIComponent(
                  item.id
                )}`}
                className="block rounded-xl border p-5 transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                <p className="text-xs uppercase tracking-wide opacity-50">
                  Chapter{" "}
                  {item.chapter_number}
                </p>

                <h2 className="mt-1 font-semibold">
                  {item.title}
                </h2>
              </Link>
            )
          )}
        </div>
      </main>
    );
  }

  const currentIndex =
    book.chapters.findIndex(
      (item) => item.id === chapter.id
    );

  const previousChapter =
    currentIndex > 0
      ? book.chapters[
          currentIndex - 1
        ]
      : null;

  const nextChapter =
    currentIndex <
    book.chapters.length - 1
      ? book.chapters[
          currentIndex + 1
        ]
      : null;

  function chapterUrl(
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
      <Link
        href={`/downloads/read?storyId=${encodeURIComponent(
          book.storyId
        )}`}
        className="text-sm opacity-60 hover:opacity-100"
      >
        ← {book.title}
      </Link>

      <p className="mt-6 text-sm uppercase tracking-wide opacity-50">
        Chapter {chapter.chapter_number}
      </p>

      <h1 className="mt-2 text-3xl font-bold">
        {chapter.title}
      </h1>

      <article
        className="prose mt-8 max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{
          __html: chapter.content,
        }}
      />

      <div className="mt-12 flex items-center justify-between gap-4 border-t pt-6">
        {previousChapter ? (
          <Link
            href={chapterUrl(
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
            href={chapterUrl(
              nextChapter.id
            )}
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            Next →
          </Link>
        ) : (
          <Link
            href={`/downloads/read?storyId=${encodeURIComponent(
              book.storyId
            )}`}
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            Back to chapters
          </Link>
        )}
      </div>
    </main>
  );
}