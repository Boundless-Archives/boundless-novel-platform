"use server";

import { logAppError } from "@/lib/errorLog";

/*
 * Errors that happen in the browser (a component crashing on a phone,
 * say). Anyone can call this, so the input is trimmed hard and the
 * database caps how many new kinds of error it will store.
 */
export async function reportClientError(
  message: string,
  stack?: string,
  path?: string
) {
  if (typeof message !== "string" || !message) return;

  await logAppError({
    source: "client",
    message: message.slice(0, 500),
    stack: typeof stack === "string" ? stack.slice(0, 4000) : null,
    path: typeof path === "string" ? path.slice(0, 300) : null,
  });
}
