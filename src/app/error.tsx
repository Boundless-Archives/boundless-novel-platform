"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportClientError } from "@/app/actions/errorReport";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Errors from the server already carry a digest and were logged there.
    if (!error.digest) {
      reportClientError(error.message, error.stack, window.location.pathname);
    }
  }, [error]);

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