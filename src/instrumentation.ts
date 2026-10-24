import type { Instrumentation } from "next";

/*
 * Next.js calls this for every error thrown while rendering a page,
 * running a route handler, or running a server action. Redirects and
 * "not found" are not errors and are not reported.
 */
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request
) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { logAppError } = await import("@/lib/errorLog");

  await logAppError({
    source: "server",
    error,
    path: `${request.method} ${request.path}`,
    digest: (error as { digest?: string } | null)?.digest ?? null,
  });
};
