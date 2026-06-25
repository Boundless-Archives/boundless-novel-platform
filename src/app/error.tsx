"use client";

import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-center">

      <div className="text-7xl mb-6">
        ⚠️
      </div>

      <h1 className="text-5xl font-bold">
        Something Went Wrong
      </h1>

      <p className="mt-4 text-lg opacity-70">
        An unexpected error occurred while the messengers loaded
        this page.
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">

        <button
          onClick={() => reset()}
          className="
            px-5
            py-3
            rounded-lg
            border
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Try Again
        </button>

        <Link
          href="/"
          className="
            px-5
            py-3
            rounded-lg
            border
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Go Home
        </Link>

      </div>

    </main>
  );
}