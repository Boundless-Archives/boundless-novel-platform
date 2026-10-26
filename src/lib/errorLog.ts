import { createAdminClient } from "@/utils/supabase/admin";

/*
 * Our own small error log (Admin > Errors). The same error is grouped
 * into one row with a counter. Logging must never break a request, so
 * everything here swallows its own failures.
 */

type Source = "server" | "client";

function describe(error: unknown) {
  if (error instanceof Error) {
    return {
      message: error.message || error.name,
      stack: error.stack ?? null,
    };
  }

  return { message: String(error ?? "Unknown error"), stack: null };
}

// Group errors that differ only in ids, numbers or hashes.
function normalise(text: string) {
  return text
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, "<id>")
    .replace(/\d+/g, "#")
    .slice(0, 200);
}

/*
 * A small, fast string hash (cyrb53). It only has to group identical
 * errors, not be secure, and unlike node:crypto it also bundles for the
 * edge runtime that Next builds instrumentation for.
 */
function hash(text: string) {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;

  for (let i = 0; i < text.length; i++) {
    const ch = text.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }

  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);

  return (
    (h2 >>> 0).toString(16).padStart(8, "0") +
    (h1 >>> 0).toString(16).padStart(8, "0")
  );
}

export function fingerprintOf(
  source: Source,
  message: string,
  stack: string | null
) {
  const firstFrame =
    stack
      ?.split("\n")
      .find((line) => line.trim().startsWith("at "))
      ?.replace(/:\d+:\d+\)?$/, "")
      .trim() ?? "";

  return hash(`${source}|${normalise(message)}|${firstFrame}`);
}

const IGNORED = ["NEXT_REDIRECT", "NEXT_NOT_FOUND", "NEXT_HTTP_ERROR_FALLBACK"];

export async function logAppError(input: {
  source: Source;
  error?: unknown;
  message?: string;
  stack?: string | null;
  path?: string | null;
  digest?: string | null;
  userId?: string | null;
}) {
  // Your own laptop shares the live database; keep its noise out of the log.
  if (process.env.NODE_ENV !== "production") return;

  try {
    const fromError = input.error !== undefined ? describe(input.error) : null;

    const message = (input.message ?? fromError?.message ?? "").slice(0, 500);
    const stack = (input.stack ?? fromError?.stack ?? null)?.slice(0, 4000) ?? null;

    if (!message || IGNORED.some((tag) => message.includes(tag))) return;

    await createAdminClient().rpc("log_app_error", {
      p_fingerprint: fingerprintOf(input.source, message, stack),
      p_source: input.source,
      p_message: message,
      p_stack: stack,
      p_path: input.path ?? null,
      p_digest: input.digest ?? null,
      p_user: input.userId ?? null,
    });
  } catch {
    // Never let logging cause a second error.
  }
}
