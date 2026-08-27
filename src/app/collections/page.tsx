import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { createCollection } from "./actions";

export default async function CollectionsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: collections } = await supabase
    .from("collections")
    .select(`
      id,
      title,
      description,
      is_public,
      created_at,
      collection_stories (
        id
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="max-w-6xl mx-auto px-5 py-10">
      <header className="mb-10">
        <Link
          href="/library"
          className="
            rounded-xl
            border
            px-5
            py-3
            text-sm
            font-medium
            transition
            hover:-translate-y-0.5
            hover:shadow-md
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          ← Back to Library
        </Link>

        <Link
          href="/collections/public"
          className="
            rounded-xl
            border
            px-5
            py-3
            text-sm
            font-medium
            transition
            hover:-translate-y-0.5
            hover:shadow-md
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Discover Public Collections →
        </Link>

        <div className="mt-5">
          <h1 className="text-4xl md:text-5xl font-bold">
            My Collections
          </h1>

          <p className="mt-2 opacity-70">
            Organize your saved stories into personal collections.
          </p>
        </div>
      </header>

      {/* Create collection */}
      <section
        className="rounded-2xl border p-6 md:p-8"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <h2 className="text-2xl font-bold">
          Create a Collection
        </h2>

        <form
          action={createCollection}
          className="mt-6 space-y-5"
        >
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-2"
            >
              Title
            </label>

            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Fantasy Favorites"
              className="
                w-full
                rounded-xl
                border
                px-4
                py-3
                bg-transparent
                outline-none
                focus:ring-2
                focus:ring-cyan-500
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            />
          </div>

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium mb-2"
            >
              Description
            </label>

            <textarea
              id="description"
              name="description"
              rows={3}
              placeholder="What is this collection about?"
              className="
                w-full
                rounded-xl
                border
                px-4
                py-3
                bg-transparent
                outline-none
                resize-none
                focus:ring-2
                focus:ring-cyan-500
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_public"
              className="h-4 w-4"
            />

            <span className="text-sm">
              Make this collection public
            </span>
          </label>

          <button
            type="submit"
            className="
              rounded-xl
              px-5
              py-3
              font-semibold
              transition
              hover:-translate-y-0.5
              hover:shadow-md
            "
            style={{
              backgroundColor: "var(--button)",
              color: "var(--button-text)",
            }}
          >
            Create Collection
          </button>
        </form>
      </section>

      {/* Collections */}
      <section className="mt-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold">
            Your Collections
          </h2>

          <span className="text-sm opacity-60">
            {collections?.length ?? 0}{" "}
            {(collections?.length ?? 0) === 1
              ? "collection"
              : "collections"}
          </span>
        </div>

        {!collections?.length ? (
          <div
            className="rounded-2xl border p-12 text-center"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="text-5xl">
              📚
            </div>

            <h3 className="mt-4 text-2xl font-bold">
              No collections yet
            </h3>

            <p className="mt-2 opacity-70">
              Create your first collection above to start organizing your stories.
            </p>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {collections.map((collection) => {
              const bookCount =
                collection.collection_stories?.length ?? 0;

              return (
                <Link
                  key={collection.id}
                  href={`/collections/${collection.id}`}
                  className="
                    group
                    rounded-2xl
                    border
                    p-6
                    transition
                    hover:-translate-y-1
                    hover:shadow-lg
                  "
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--card-border)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="text-3xl">
                      📚
                    </div>

                    <span
                      className="rounded-full border px-3 py-1 text-xs"
                      style={{
                        borderColor: "var(--card-border)",
                      }}
                    >
                      {collection.is_public
                        ? "Public"
                        : "Private"}
                    </span>
                  </div>

                  <h3 className="
                    mt-5
                    text-xl
                    font-bold
                    group-hover:underline
                  ">
                    {collection.title}
                  </h3>

                  {collection.description && (
                    <p className="
                      mt-2
                      text-sm
                      opacity-70
                      line-clamp-3
                    ">
                      {collection.description}
                    </p>
                  )}

                  <div className="mt-5 text-sm opacity-60">
                    {bookCount}{" "}
                    {bookCount === 1
                      ? "book"
                      : "books"}
                  </div>

                  <div className="mt-4 text-sm font-medium">
                    View Collection →
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}