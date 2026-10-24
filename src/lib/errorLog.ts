import { createHash } from "node:crypto";
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

  return createHash("sha1")
    .update(`${source}|${normalise(message)}|${firstFrame}`)
    .digest("hex");
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
