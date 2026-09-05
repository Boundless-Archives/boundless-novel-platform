"use client";

import { useEffect, useState } from "react";
import {
  deleteOfflineBook,
  getAllOfflineBooks,
  getOfflineBook,
  type OfflineBook,
  type OfflineChapter,
} from "@/lib/offline-books";

type ViewState =
  | {
      type: "library";
    }
  | {
      type: "book";
      storyId: string;
    }
  | {
      type: "chapter";
      storyId: string;
      chapterId: string;
    };

function getViewFromHash(): ViewState {
  const hash = window.location.hash.replace(
    /^#/,
    ""
  );

  const params = new URLSearchParams(hash);

  const storyId = params.get("book");
  const chapterId = params.get("chapter");

  if (storyId && chapterId) {
    return {
      type: "chapter",
      storyId,
      chapterId,
    };
  }

  if (storyId) {
    return {
      type: "book",
      storyId,
    };
  }

  return {
    type: "library",
  };
}

export default function DownloadsLibrary() {
  const [books, setBooks] =
    useState<OfflineBook[]>([]);

  const [view, setView] =
    useState<ViewState>({
      type: "library",
    });

  const [book, setBook] =
    useState<OfflineBook | null>(null);

  const [chapter, setChapter] =
    useState<OfflineChapter | null>(null);

  const [loading, setLoading] =
    useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const offlineBooks =
          await getAllOfflineBooks();

        if (!mounted) {
          return;
        }

        setBooks(offlineBooks);
        setView(getViewFromHash());
      } catch (error) {
        console.error(
          "Failed to load offline books:",
          error
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    function handleHashChange() {
      setView(getViewFromHash());
    }

    load();

    window.addEventListener(
      "hashchange",
      handleHashChange
    );

    return () => {
      mounted = false;

      window.removeEventListener(
        "hashchange",
        handleHashChange
      );
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadSelectedContent() {
      setBook(null);
      setChapter(null);

      if (view.type === "library") {
        return;
      }

      try {
        const selectedBook =
          await getOfflineBook(
            view.storyId
          );

        if (!mounted) {
          return;
        }

        if (!selectedBook) {
          return;
        }

        setBook(selectedBook);

        if (view.type === "chapter") {
          const selectedChapter =
            selectedBook.chapters.find(
              (item) =>
                item.id ===
                view.chapterId
            );

          setChapter(
            selectedChapter ?? null
          );
        }
      } catch (error) {
        console.error(
          "Failed to load offline content:",
          error
        );
      }
    }

    loadSelectedContent();

    return () => {
      mounted = false;
    };
  }, [view]);

  async function removeBook(
    storyId: string
  ) {
    try {
      await deleteOfflineBook(storyId);

      setBooks((current) =>
        current.filter(
          (item) =>
            item.storyId !== storyId
        )
      );

      if (
        view.type !== "library" &&
        view.storyId === storyId
      ) {
        window.location.hash = "";
      }
    } catch (error) {
      console.error(
        "Failed to remove offline book:",
        error
      );
    }
  }

  function openBook(storyId: string) {
    window.location.hash =
      `book=${encodeURIComponent(
        storyId
      )}`;
  }

  function openChapter(
    storyId: string,
    chapterId: string
  ) {
    window.location.hash =
      `book=${encodeURIComponent(
        storyId
      )}&chapter=${encodeURIComponent(
        chapterId
      )}`;
  }

  function goToLibrary() {
    window.location.hash = "";
  }

  function goToBook(storyId: string) {
    window.location.hash =
      `book=${encodeURIComponent(
        storyId
      )}`;
  }

  if (loading) {
    return (
      <p className="opacity-60">
        Loading downloads...
      </p>
    );
  }

  if (view.type === "library") {
    if (books.length === 0) {
      return (
        <div className="rounded-xl border p-8 text-center">
          <h2 className="text-lg font-semibold">
            No offline books yet
          </h2>

          <p className="mt-2 text-sm opacity-60">
            Download a book to read it without
            an internet connection.
          </p>

          <a
            href="/"
            className="mt-5 inline-block rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            Browse books
          </a>
        </div>
      );
    }

    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((offlineBook) => (
          <article
            key={offlineBook.storyId}
            className="overflow-hidden rounded-xl border"
          >
            {offlineBook.coverUrl ? (
              <img
                src={offlineBook.coverUrl}
                alt=""
                className="h-52 w-full object-cover"
              />
            ) : (
              <div className="flex h-52 items-center justify-center bg-black/5 dark:bg-white/5">
                <span className="text-4xl opacity-30">
                  📖
                </span>
              </div>
            )}

            <div className="p-5">
              <h2 className="font-semibold">
                {offlineBook.title}
              </h2>

              <p className="mt-1 text-sm opacity-60">
                {offlineBook.chapters.length}{" "}
                {offlineBook.chapters.length === 1
                  ? "chapter"
                  : "chapters"}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openBook(
                      offlineBook.storyId
                    )
                  }
                  className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Read offline
                </button>

                <button
                  type="button"
                  onClick={() =>
                    removeBook(
                      offlineBook.storyId
                    )
                  }
                  className="rounded-lg border px-4 py-2 text-sm opacity-70 transition hover:bg-black/5 dark:hover:bg-white/5"
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    );
  }

  if (!book) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <h2 className="text-lg font-semibold">
          Offline book not found
        </h2>

        <p className="mt-2 text-sm opacity-60">
          This book is not stored on this device.
        </p>

        <button
          type="button"
          onClick={goToLibrary}
          className="mt-5 rounded-lg border px-4 py-2 text-sm"
        >
          Back to downloads
        </button>
      </div>
    );
  }

  if (view.type === "book") {
    return (
      <div>
        <button
          type="button"
          onClick={goToLibrary}
          className="text-sm opacity-60 hover:opacity-100"
        >
          ← Offline Downloads
        </button>

        <h2 className="mt-5 text-3xl font-bold">
          {book.title}
        </h2>

        {book.description && (
          <p className="mt-3 text-sm opacity-60">
            {book.description}
          </p>
        )}

        <p className="mt-2 text-sm opacity-50">
          {book.chapters.length}{" "}
          {book.chapters.length === 1
            ? "chapter"
            : "chapters"}{" "}
          available offline
        </p>

        <div className="mt-8 space-y-3">
          {book.chapters.map(
            (offlineChapter) => (
              <button
                key={offlineChapter.id}
                type="button"
                onClick={() =>
                  openChapter(
                    book.storyId,
                    offlineChapter.id
                  )
                }
                className="block w-full rounded-xl border p-5 text-left transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                <p className="text-xs uppercase tracking-wide opacity-50">
                  Chapter{" "}
                  {
                    offlineChapter.chapter_number
                  }
                </p>

                <h3 className="mt-1 font-semibold">
                  {offlineChapter.title}
                </h3>
              </button>
            )
          )}
        </div>
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <h2 className="text-lg font-semibold">
          Chapter not found
        </h2>

        <button
          type="button"
          onClick={() =>
            goToBook(book.storyId)
          }
          className="mt-5 rounded-lg border px-4 py-2 text-sm"
        >
          Back to chapters
        </button>
      </div>
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

  return (
    <article>
      <button
        type="button"
        onClick={() =>
          goToBook(book.storyId)
        }
        className="text-sm opacity-60 hover:opacity-100"
      >
        ← {book.title}
      </button>

      <p className="mt-6 text-sm uppercase tracking-wide opacity-50">
        Chapter {chapter.chapter_number}
      </p>

      <h2 className="mt-2 text-3xl font-bold">
        {chapter.title}
      </h2>

      <div
        className="prose mt-8 max-w-none dark:prose-invert"
        dangerouslySetInnerHTML={{
          __html: chapter.content,
        }}
      />

      <div className="mt-12 flex items-center justify-between gap-4 border-t pt-6">
        {previousChapter ? (
          <button
            type="button"
            onClick={() =>
              openChapter(
                book.storyId,
                previousChapter.id
              )
            }
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            ← Previous
          </button>
        ) : (
          <span />
        )}

        {nextChapter ? (
          <button
            type="button"
            onClick={() =>
              openChapter(
                book.storyId,
                nextChapter.id
              )
            }
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            Next →
          </button>
        ) : (
          <button
            type="button"
            onClick={() =>
              goToBook(book.storyId)
            }
            className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
          >
            Back to chapters
          </button>
        )}
      </div>
    </article>
  );
}