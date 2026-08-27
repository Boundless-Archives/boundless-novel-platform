import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function PublicCollectionsPage() {
  const supabase = await createClient();

  const { data: collections } = await supabase
    .from("collections")
    .select(`
      id,
      title,
      description,
      created_at,
      profiles (
        username,
        display_name
      )
    `)
    .eq("is_public", true)
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <header className="mb-10">
        <Link
          href="/collections"
          className="text-sm opacity-70 hover:underline"
        >
          ← My Collections
        </Link>

        <h1 className="mt-5 text-5xl font-bold">
          Public Collections
        </h1>

        <p className="mt-3 max-w-2xl opacity-70">
          Discover collections created by readers
          across Boundless.
        </p>
      </header>

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
          <div className="text-6xl mb-5">
            📚
          </div>

          <h2 className="text-2xl font-bold">
            No Public Collections Yet
          </h2>

          <p className="mt-3 opacity-70">
            Public collections will appear here when
            readers share them.
          </p>
        </div>
      ) : (
        <div
          className="
            grid
            gap-6
            md:grid-cols-2
            xl:grid-cols-3
          "
        >
          {collections.map((collection) => {
            const profile = Array.isArray(
              collection.profiles
            )
              ? collection.profiles[0]
              : collection.profiles;

            return (
              <Link
                key={collection.id}
                href={`/collections/${collection.id}`}
                className="
                  rounded-2xl
                  border
                  p-6
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
                <div className="text-4xl">
                  📚
                </div>

                <h2 className="mt-5 text-2xl font-bold">
                  {collection.title}
                </h2>

                {collection.description && (
                  <p className="mt-3 opacity-70 line-clamp-3">
                    {collection.description}
                  </p>
                )}

                <p className="mt-6 text-sm opacity-60">
                  By{" "}
                  {profile?.display_name ||
                    profile?.username ||
                    "Reader"}
                </p>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}