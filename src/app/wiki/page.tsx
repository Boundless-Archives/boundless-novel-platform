import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function WikiPage() {
  const supabase = await createClient();

  const { data: canonStories } = await supabase
    .from("stories")
    .select("author_id")
    .eq("canon_tier", "S");

  const canonAuthorIds = Array.from(
    new Set(
      (canonStories ?? []).map((s) => s.author_id)
    )
  );

  let universes: any[] = [];

  if (canonAuthorIds.length > 0) {
    const { data } = await supabase
      .from("universes")
      .select(
        `
        id,
        name,
        slug,
        description,
        owner:owner_id ( username, display_name )
      `
      )
      .eq("multiverse", "telos")
      .in("owner_id", canonAuthorIds)
      .order("name");

    universes = data ?? [];
  }

  function first<T>(value: T | T[] | null): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
  }

  return (
    <main className="max-w-5xl mx-auto p-8">
      <h1 className="text-4xl font-bold">
        🌌 The Telos Verse Wiki
      </h1>

      <p className="mt-3 opacity-70 max-w-2xl">
        Canon universes from across the Telos multiverse
        every one listed here has at least one S-Tier
        story integrated into Telos canon.
      </p>

      {universes.length === 0 ? (
        <div
          className="mt-10 rounded-xl border p-8 text-center"
          style={{ borderColor: "var(--card-border)" }}
        >
          <p className="opacity-70">
            No universes have reached S-Tier canon yet.
            Check back soon.
          </p>
        </div>
      ) : (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {universes.map((universe) => {
            const owner = first(universe.owner);

            return (
              <Link
                key={universe.id}
                href={`/wiki/${universe.slug}`}
                className="
                  rounded-xl
                  border
                  p-5
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                "
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                }}
              >
                <h2 className="text-xl font-bold">
                  {universe.name}
                </h2>

                <p className="text-sm opacity-60 mt-1">
                  by{" "}
                  {owner?.display_name ??
                    owner?.username ??
                    "Unknown"}
                </p>

                {universe.description && (
                  <p className="mt-3 text-sm opacity-80 line-clamp-3">
                    {universe.description}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}