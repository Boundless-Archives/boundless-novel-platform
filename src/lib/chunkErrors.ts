/*
 * "Loading chunk ... failed" happens when the browser asks for a piece of the
 * site that no longer exists (a new version was published while the page was
 * open) or that couldn't download (a slow or dropped connection). Reloading
 * the page fixes it, because the reload fetches the latest version.
 */
export function isChunkLoadError(error: {
  name?: string;
  message?: string;
}): boolean {
  const text = `${error?.name ?? ""} ${error?.message ?? ""}`;

  return /ChunkLoadError|Loading chunk [\w-]+ failed|Failed to load chunk|error loading dynamically imported module|Importing a module script failed/i.test(
    text
  );
}

const RELOAD_KEY = "chunk-reload-at";

/*
 * Reloads the page to pick up the latest version. Returns false (and does
 * nothing) if it already did this in the last minute, so a genuine problem
 * can never trap someone in a reload loop.
 */
export function reloadForNewVersion(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) ?? 0);

    if (Date.now() - last < 60_000) return false;

    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // storage unavailable: don't risk a reload loop
    return false;
  }

  window.location.reload();

  return true;
}