"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  deleteOfflineBook,
  getAllOfflineBooks,
  type OfflineBook,
} from "@/lib/offline-books";

export default function DownloadsLibrary() {
  const [books, setBooks] = useState<OfflineBook[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBooks() {
      try {
        const offlineBooks = await getAllOfflineBooks();
        setBooks(offlineBooks);
      } catch (error) {
        console.error(
          "Failed to load offline books:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadBooks();
  }, []);

  async function removeBook(storyId: string) {
    try {
      await deleteOfflineBook(storyId);

      setBooks((current) =>
        current.filter(
          (book) => book.storyId !== storyId
        )
      );
    } catch (error) {
      console.error(
        "Failed to remove offline book:",
        error
      );
    }
  }

  if (loading) {
    return (
      <p className="opacity-60">
        Loading downloads...
      </p>
    );
  }

  if (books.length === 0) {
    return (
      <div className="rounded-xl border p-8 text-center">
        <h2 className="text-lg font-semibold">
          No offline books yet
        </h2>

        <p className="mt-2 text-sm opacity-60">
          Download a book to read it without an
          internet connection.
        </p>

        <Link
          href="/"
          className="mt-5 inline-block rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
        >
          Browse books
        </Link>
      </div>
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <article
          key={book.storyId}
          className="overflow-hidden rounded-xl border"
        >
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
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
              {book.title}
            </h2>

            <p className="mt-1 text-sm opacity-60">
              {book.chapters.length}{" "}
              {book.chapters.length === 1
                ? "chapter"
                : "chapters"}
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/downloads/read?storyId=${encodeURIComponent(
                  book.storyId
                )}`}
                className="rounded-lg border px-4 py-2 text-sm transition hover:bg-black/5 dark:hover:bg-white/5"
              >
                Read offline
              </Link>

              <button
                type="button"
                onClick={() =>
                  removeBook(book.storyId)
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