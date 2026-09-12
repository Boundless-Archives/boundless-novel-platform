import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getEntityTypeIcon,
  getEntityTypeLabel,
} from "@/lib/entityTypes";

type Props = {
  params: Promise<{ universeSlug: string }>;
};

export default async function UniversePage({
  params,
}: Props) {
  const { universeSlug } = await params;

  const supabase = await createClient();

  const { data: universe } = await supabase
    .from("universes")
    .select(
      `
      id,
      name,
      slug,
      description,
      banner_url,
      multiverse,
      owner:owner_id ( username, display_name )
    `
    )
    .eq("slug", universeSlug)
    .maybeSingle();

  if (!universe) {
    notFound();
  }

  const { data: entities } = await supabase
    .from("entities")
    .select(
      `
      id,
      name,
      slug,
      entity_type,
      summary,
      entity_appearances (
        stories ( canon_tier )
      )
    `
    )
    .eq("universe_id", universe.id)
    .order("name");

  function first<T>(value: T | T[] | null): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
  }

  const owner = first(universe.owner);

  const entityList = (entities ?? []).map((entity: any) => {
    const isCanon = (entity.entity_appearances ?? []).some(
      (appearance: any) => {
        const story = first(appearance.stories);
        return story?.canon_tier === "S";
      }
    );

    return { ...entity, isCanon };
  });

  const grouped = entityList.reduce(
    (acc: Record<string, typeof entityList>, entity) => {
      const key = entity.entity_type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entity);
      return acc;
    },
    {}
  );

  return (
    <main className="max-w-5xl mx-auto p-8">
      <Link
        href="/wiki"
        className="text-sm opacity-60 hover:opacity-100"
      >
        ← The Telos Wiki
      </Link>

      {universe.banner_url && (
        <img
          src={universe.banner_url}
          alt={universe.name}
          className="mt-4 h-48 w-full rounded-2xl border object-cover"
          style={{ borderColor: "var(--card-border)" }}
        />
      )}

      <h1 className="font-serif text-4xl font-bold mt-3"> 
        {universe.name}
      </h1>

      <p className="text-sm opacity-60 mt-1">
        A universe by{" "}
        {owner?.display_name ?? owner?.username ?? "Unknown"}
      </p>

      {universe.description && (
        <p className="mt-4 max-w-2xl opacity-80">
          {universe.description}
        </p>
      )}

      {entityList.length === 0 ? (
        <div
          className="mt-10 rounded-xl border p-8 text-center"
          style={{ borderColor: "var(--card-border)" }}
        >
          <p className="opacity-70">
            No wiki entries yet.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <section key={type} className="mt-10">
            <h2 className="text-2xl font-bold mb-4">
              {getEntityTypeIcon(type)}{" "}
              {getEntityTypeLabel(type)}s
            </h2>

            <div className="grid gap-3 sm:grid-cols-2">
              {items.map((entity) => (
                <Link
                  key={entity.id}
                  href={`/wiki/${universe.slug}/${entity.slug}`}
                  className="
                    rounded-xl
                    border
                    p-4
                    transition
                    hover:-translate-y-0.5
                    hover:shadow-md
                  "
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--card-border)",
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-semibold">
                      {entity.name}
                    </h3>

                    <span
                      className={`
                        shrink-0
                        rounded-full
                        px-2
                        py-0.5
                        text-xs
                        font-semibold
                        text-white
                        ${
                          entity.isCanon
                            ? "bg-purple-600"
                            : "bg-slate-400"
                        }
                      `}
                    >
                      {entity.isCanon
                        ? "Canon"
                        : "Non-canon"}
                    </span>
                  </div>

                  {entity.summary && (
                    <p className="mt-2 text-sm opacity-70 line-clamp-2">
                      {entity.summary}
                    </p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}