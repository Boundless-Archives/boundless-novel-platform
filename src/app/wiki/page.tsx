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

  // universes with the most fleshed-out entries, canon or not
  const { data: entityRows } = await supabase
    .from("entities")
    .select("universe_id")
    .limit(5000);

  const entryCounts = new Map<string, number>();
  for (const row of entityRows ?? []) {
    entryCounts.set(row.universe_id, (entryCounts.get(row.universe_id) ?? 0) + 1);
  }

  const topIds = [...entryCounts.entries()]
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => id);

  const { data: topUniverses } =
    topIds.length > 0
      ? await supabase
          .from("universes")
          .select("id, name, slug, description, owner:owner_id ( username, display_name )")
          .in("id", topIds)
      : { data: [] };

  const detailed = (topUniverses ?? [])
    .map((u: any) => ({ ...u, entries: entryCounts.get(u.id) ?? 0 }))
    .sort((a: any, b: any) => b.entries - a.entries);

  function tierLabel(n: number) {
    if (n >= 30) return "📚 Vast";
    if (n >= 15) return "🏛️ Rich";
    return "🌱 Growing";
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

      {detailed.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold">✨ Most detailed universes</h2>
          <p className="mt-1 text-sm opacity-70">
            Worlds with the most entries written, canon or not.
          </p>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {detailed.map((universe: any) => {
              const owner = first(universe.owner) as { username: string; display_name: string | null } | null;
              return (
                <Link
                  key={universe.id}
                  href={`/wiki/${universe.slug}`}
                  className="rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                  style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-lg font-bold">{universe.name}</h3>
                    <span className="shrink-0 rounded-full border px-2 py-0.5 text-xs" style={{ borderColor: "var(--card-border)" }}>
                      {tierLabel(universe.entries)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm opacity-60">
                    by {owner?.display_name ?? owner?.username ?? "Unknown"} · {universe.entries} entries
                  </p>
                  {universe.description && (
                    <p className="mt-3 text-sm opacity-80 line-clamp-2">{universe.description}</p>
                  )}
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <h2 className="mt-12 text-2xl font-bold">🌌 Canon universes</h2>

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