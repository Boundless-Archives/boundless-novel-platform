import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function PublicCollectionsPage() {
  const supabase = await createClient();

  const { data: collections, error } = await supabase
  .from("collections")
  .select(`
    id,
    title,
    description,
    created_at,
    is_public,
    collection_stories (
      id
    )
  `)
  .eq("is_public", true)
  .order("created_at", {
    ascending: false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="max-w-7xl mx-auto px-5 py-10">
      {/* Header */}
      <div className="mb-10">
        <Link
          href="/collections"
          className="text-sm opacity-70 hover:underline"
        >
          ← My Collections
        </Link>

        <h1 className="mt-4 text-5xl font-bold">
          Public Collections
        </h1>

        <p className="mt-2 opacity-70">
          Discover reading lists created by Boundless readers.
        </p>
      </div>

      {/* Collections */}
      {!collections?.length ? (
        <div
          className="
            rounded-2xl
            border
            p-14
            text-center
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <div className="text-6xl mb-6">
            📚
          </div>

          <h2 className="text-3xl font-bold">
            No Public Collections Yet
          </h2>

          <p className="mt-4 opacity-70">
            Public collections created by readers
            will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/collections/${collection.id}`}
              className="
                block
                rounded-2xl
                border
                p-7
                transition
                duration-200
                hover:-translate-y-1
                hover:shadow-xl
              "
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--card-border)",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="text-2xl font-bold">
                    {collection.title}
                  </h2>

                  {collection.description && (
                    <p className="mt-3 opacity-70 line-clamp-3">
                      {collection.description}
                    </p>
                  )}
                </div>

                <span className="text-2xl shrink-0">
                  📚
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <span
                  className="
                    rounded-full
                    border
                    px-3
                    py-1
                    text-xs
                  "
                  style={{
                    borderColor: "var(--card-border)",
                  }}
                >
                  Public
                </span>

                <div className="flex items-center gap-4 text-sm opacity-60">
                  <span>
                    {collection.collection_stories?.length ?? 0}{" "}
                    {collection.collection_stories?.length === 1
                      ? "story"
                      : "stories"}
                  </span>

                  <span>
                    View Collection →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}