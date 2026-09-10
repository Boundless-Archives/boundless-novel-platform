import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getEntityTypeIcon, getEntityTypeLabel } from "@/lib/entityTypes";
import CanonTierBadge from "@/components/story/CanonTierBadge";

type Props = {
  params: Promise<{
    universeSlug: string;
    entitySlug: string;
  }>;
};

export default async function EntityPage({ params }: Props) {
  const { universeSlug, entitySlug } = await params;

  const supabase = await createClient();

  const { data: universe } = await supabase
    .from("universes")
    .select("id, name, slug")
    .eq("slug", universeSlug)
    .maybeSingle();

  if (!universe) {
    notFound();
  }

  const { data: entity } = await supabase
    .from("entities")
    .select(
      `
      id,
      name,
      entity_type,
      summary,
      content,
      origin_story:origin_story_id ( id, title, slug, canon_tier ),
      entity_appearances (
        stories ( id, title, slug, canon_tier )
      )
    `
    )
    .eq("universe_id", universe.id)
    .eq("slug", entitySlug)
    .maybeSingle();

  if (!entity) {
    notFound();
  }

  function first<T>(value: T | T[] | null): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
  }

  const originStory = first(entity.origin_story);

  const appearances = (entity.entity_appearances ?? [])
    .map((appearance: any) => first(appearance.stories))
    .filter(Boolean) as {
    id: string;
    title: string;
    slug: string;
    canon_tier: string;
  }[];

  const isCanon = appearances.some(
    (story) => story.canon_tier === "S"
  );

  return (
    <main className="max-w-3xl mx-auto p-8">
      <Link
        href={`/wiki/${universe.slug}`}
        className="text-sm opacity-60 hover:opacity-100"
      >
        ← {universe.name}
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="text-4xl font-bold">
          {getEntityTypeIcon(entity.entity_type)}{" "}
          {entity.name}
        </h1>

        <span
          className={`
            rounded-full
            px-3
            py-1
            text-sm
            font-semibold
            text-white
            ${isCanon ? "bg-purple-600" : "bg-slate-400"}
          `}
        >
          {isCanon ? "Canon" : "Non-canon"}
        </span>
      </div>

      <p className="mt-1 text-sm opacity-60">
        {getEntityTypeLabel(entity.entity_type)}
      </p>

      {entity.summary && (
        <p className="mt-5 text-lg opacity-90">
          {entity.summary}
        </p>
      )}

      {entity.content && (
        <div className="mt-6 whitespace-pre-wrap leading-7 opacity-90">
          {entity.content}
        </div>
      )}

      <section
        className="mt-10 rounded-xl border p-5"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <h2 className="font-semibold mb-3">
          First appeared in
        </h2>

        {originStory && (
          <Link
            href={`/story/${originStory.slug}`}
            className="inline-flex items-center gap-2 underline"
          >
            {originStory.title}
            <CanonTierBadge
              tier={originStory.canon_tier}
              size="sm"
            />
          </Link>
        )}

        {appearances.length > 1 && (
          <>
            <h2 className="font-semibold mt-5 mb-3">
              Also appears in
            </h2>

            <div className="flex flex-wrap gap-2">
              {appearances
                .filter((story) => story.id !== originStory?.id)
                .map((story) => (
                  <Link
                    key={story.id}
                    href={`/story/${story.slug}`}
                    className="
                      inline-flex
                      items-center
                      gap-2
                      rounded-lg
                      border
                      px-3
                      py-1.5
                      text-sm
                      underline
                    "
                    style={{
                      borderColor: "var(--card-border)",
                    }}
                  >
                    {story.title}
                    <CanonTierBadge
                      tier={story.canon_tier}
                      size="sm"
                    />
                  </Link>
                ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}