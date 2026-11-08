import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import RelationshipGraph from "@/components/wiki/RelationshipGraph";
import SuggestForm, { SUGGEST_MESSAGES } from "@/components/wiki/SuggestForm";
import { getReadingProgress, lockedUntil } from "@/lib/spoilers";
import {
  getEntityTypeIcon,
  getEntityTypeLabel,
} from "@/lib/entityTypes";

type Props = {
  params: Promise<{ universeSlug: string }>;
  searchParams: Promise<{ s?: string }>;
};

export default async function UniversePage({
  params,
  searchParams,
}: Props) {
  const { universeSlug } = await params;
  const { s: suggestStatus } = await searchParams;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
      owner_id,
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
      origin_story_id,
      reveal_chapter,
      timeline_label,
      timeline_order,
      created_by,
      entity_appearances (
        stories ( canon_tier )
      )
    `
    )
    .eq("universe_id", universe.id)
    .order("name");

  const entityIds = (entities ?? []).map((e: { id: string }) => e.id);

  const { data: relationshipRows } =
    entityIds.length > 0
      ? await supabase
          .from("entity_relationships")
          .select("from_entity_id, to_entity_id, relationship_type")
          .in("from_entity_id", entityIds)
      : { data: [] };

  function first<T>(value: T | T[] | null): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
  }

  const owner = first(universe.owner);

  const { data: memberRows } = await supabase
    .from("universe_members")
    .select("user_id")
    .eq("universe_id", universe.id);

  const { data: coAuthorProfiles } =
    (memberRows ?? []).length > 0
      ? await supabase
          .from("profiles")
          .select("username, display_name")
          .in("id", (memberRows ?? []).map((m) => m.user_id))
      : { data: [] };

  const coAuthors = (coAuthorProfiles ?? []) as { username: string; display_name: string | null }[];

  const isTeam =
    !!user &&
    (universe.owner_id === user.id ||
      (memberRows ?? []).some((m: any) => m.user_id === user.id));

  const progress = await getReadingProgress(
    supabase,
    user?.id,
    [...new Set((entities ?? []).map((e: any) => e.origin_story_id).filter(Boolean))] as string[]
  );

  const entityList = (entities ?? []).map((entity: any) => {
    const isCanon = (entity.entity_appearances ?? []).some(
      (appearance: any) => {
        const story = first(appearance.stories);
        return story?.canon_tier === "S";
      }
    );

    const lock = lockedUntil(entity, progress, isTeam || entity.created_by === user?.id);

    return { ...entity, isCanon, lock };
  });

  const timeline = entityList
    .filter((e: any) => e.timeline_order !== null && e.timeline_order !== undefined)
    .sort((a: any, b: any) => Number(a.timeline_order) - Number(b.timeline_order));

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

      {coAuthors.length > 0 && (
        <p className="text-sm opacity-60 mt-1">
          With{" "}
          {coAuthors.map((c, i) => (
            <span key={c.username}>
              {i > 0 && ", "}
              <Link href={`/author/${c.username}`} className="underline">
                {c.display_name ?? c.username}
              </Link>
            </span>
          ))}
        </p>
      )}

      {universe.description && (
        <p className="mt-4 max-w-2xl opacity-80">
          {universe.description}
        </p>
      )}

      <RelationshipGraph
        nodes={entityList.map((e: { id: string; name: string; entity_type: string; slug: string }) => ({
          id: e.id,
          name: e.name,
          type: e.entity_type,
          href: `/wiki/${universe.slug}/${e.slug}`,
        }))}
        edges={(relationshipRows ?? []).map((r) => ({
          from: r.from_entity_id,
          to: r.to_entity_id,
          label: r.relationship_type,
        }))}
      />

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

                  {entity.lock ? (
                    <p className="mt-2 text-sm opacity-60">
                      🔒 Hidden until chapter {entity.lock}
                    </p>
                  ) : (
                    entity.summary && (
                      <p className="mt-2 text-sm opacity-70 line-clamp-2">
                        {entity.summary}
                      </p>
                    )
                  )}
                </Link>
              ))}
            </div>
          </section>
        ))
      )}

      {timeline.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">🕰️ Timeline</h2>

          <ol className="relative ml-3 space-y-5 border-l pl-6" style={{ borderColor: "var(--card-border)" }}>
            {timeline.map((entity: any) => (
              <li key={entity.id} className="relative">
                <span className="absolute -left-[31px] top-1.5 h-3 w-3 rounded-full bg-cyan-500" />
                <p className="text-sm font-semibold text-cyan-500">
                  {entity.timeline_label ?? ""}
                </p>
                <Link
                  href={`/wiki/${universe.slug}/${entity.slug}`}
                  className="font-semibold hover:underline"
                >
                  {getEntityTypeIcon(entity.entity_type)} {entity.name}
                </Link>
                {entity.lock ? (
                  <p className="text-sm opacity-60">🔒 Hidden until chapter {entity.lock}</p>
                ) : (
                  entity.summary && (
                    <p className="text-sm opacity-70 line-clamp-2">{entity.summary}</p>
                  )
                )}
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="mt-12 space-y-3">
        {suggestStatus && SUGGEST_MESSAGES[suggestStatus] && (
          <div className="rounded-lg border p-3 text-sm" style={{ borderColor: "var(--card-border)" }}>
            {SUGGEST_MESSAGES[suggestStatus]}
          </div>
        )}

        {user && !isTeam && (
          <SuggestForm kind="new" universeId={universe.id} returnTo={`/wiki/${universe.slug}`} />
        )}
      </section>
    </main>
  );
}