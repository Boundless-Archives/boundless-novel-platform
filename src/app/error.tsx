"use client";

import { useEffect } from "react";
import Link from "next/link";
import { reportClientError } from "@/app/actions/errorReport";
import { isChunkLoadError, reloadForNewVersion } from "@/lib/chunkErrors";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
    const outdated = isChunkLoadError(error);

  useEffect(() => {
    // A page piece that failed to load is usually just an old version of the
    // site: reload once to get the new one, and only report it if that fails.
    if (outdated && reloadForNewVersion()) return;

    // Errors from the server already carry a digest and were logged there.
    if (!error.digest) {
      reportClientError(error.message, error.stack, window.location.pathname);
    }
  }, [error, outdated]);

  return (
    <main className="max-w-3xl mx-auto px-6 py-24 text-center">

      <div className="text-7xl mb-6">
        ⚠️
      </div>

      <h1 className="text-5xl font-bold">
        {outdated ? "Update Needed" : "Something Went Wrong"}
      </h1>

      <p className="mt-4 text-lg opacity-70">
        {outdated
          ? "Boundless was updated or your connection dropped while this page loaded. Reload to continue."
          : "An unexpected error occurred while the messengers loaded this page."}
      </p>

      <div className="mt-10 flex flex-wrap justify-center gap-4">

        <button
          onClick={() =>
            outdated ? window.location.reload() : reset()
          }
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
          {outdated ? "Reload" : "Try Again"}
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