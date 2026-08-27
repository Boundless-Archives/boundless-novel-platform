import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import CollectionStoryActions from "@/components/collections/CollectionStoryActions";
import CollectionSettings from "@/components/collections/CollectionSettings";

import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type CollectionStory = {
  id: string;
  story_id: string;
  position: number;
  stories:
    | {
        id: string;
        title: string;
        slug: string;
        description: string | null;
        cover_url: string | null;
        status: string;
      }
    | {
        id: string;
        title: string;
        slug: string;
        description: string | null;
        cover_url: string | null;
        status: string;
      }[]
    | null;
};

export default async function CollectionPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  /*
   * Load the collection.
   */
  const {
  data: collection,
  error: collectionError,
} = await supabase
  .from("collections")
  .select(`
      id,
      user_id,
      title,
      description,
      is_public,
      created_at
    `)
  .eq("id", id)
  .single();

if (collectionError || !collection) {
  notFound();
}

if (!collection.is_public) {
  if (!user || collection.user_id !== user.id) {
    notFound();
  }
}
  
  /*
   * Load stories in collection order.
   */
  const { data: collectionStories } =
    await supabase
      .from("collection_stories")
      .select(`
        id,
        story_id,
        position,
        stories (
          id,
          title,
          slug,
          description,
          cover_url,
          status
        )
      `)
      .eq("collection_id", id)
      .order("position", {
        ascending: true,
      });

      const { data: libraryStories } = await supabase
        .from("library")
        .select(`
            story_id,
            stories (
            id,
            title,
            slug,
            cover_url
            )
        `)
        .eq("user_id", user.id)
        .order("created_at", {
            ascending: false,
        });

  /*
   * Normalize the Supabase relationship.
   *
   * Supabase can type a relationship as either
   * an object or an array depending on the
   * generated relationship metadata.
   *
   * We normalize it to one story object here.
   */
  const stories = (
    (collectionStories ?? []) as CollectionStory[]
  ).flatMap((entry) => {
    const story = Array.isArray(entry.stories)
      ? entry.stories[0]
      : entry.stories;

    if (!story) {
      return [];
    }

    return [
      {
        ...story,
        collectionStoryId: entry.id,
        position: entry.position,
      },
    ];
  });

  const collectionStoryIds = new Set(
    stories.map((story) => story.id)
  );

  const availableStories = (
    libraryStories ?? []
  ).filter(
    (entry) =>
      !collectionStoryIds.has(entry.story_id)
  );

  return (
    <main className="max-w-6xl mx-auto px-5 py-10">
      {/* Header */}
      <header>
        <Link
          href="/collections"
          className="
            text-sm
            opacity-60
            hover:opacity-100
            transition
          "
        >
          ← Back to Collections
        </Link>

        <div className="mt-6">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-4xl">
              📚
            </span>

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
              {collection.is_public
                ? "Public"
                : "Private"}
            </span>
          </div>

          <h1 className="mt-4 text-4xl md:text-5xl font-bold">
            {collection.title}
          </h1>

          {collection.description && (
            <p className="mt-3 max-w-3xl text-lg opacity-70">
              {collection.description}
            </p>
          )}

          <p className="mt-4 text-sm opacity-50">
            {stories.length}{" "}
            {stories.length === 1
              ? "book"
              : "books"}
          </p>
        </div>
      </header>

      {user?.id === collection.user_id && (
        <CollectionSettings
          collectionId={collection.id}
          initialTitle={collection.title}
          initialDescription={collection.description}
          initialIsPublic={collection.is_public}
        />
      )}


      {/* Stories */}
      <section className="mt-12">
        {!stories.length ? (
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
            <div className="text-5xl">
              📖
            </div>

            <h2 className="mt-4 text-2xl font-bold">
              This collection is empty
            </h2>

            <p className="mt-2 opacity-70">
              Add stories from your library to
              build this collection.
            </p>

            <Link
              href="/library"
              className="
                inline-block
                mt-6
                rounded-xl
                border
                px-5
                py-3
                transition
                hover:-translate-y-0.5
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            >
              Go to Library
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <article
                key={story.collectionStoryId}
                className="
                  rounded-2xl
                  border
                  p-4
                  md:p-5
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                "
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                }}
              >
                <div className="flex gap-5">
                  {/* Position */}
                  <div
                    className="
                      hidden
                      sm:flex
                      w-10
                      shrink-0
                      items-center
                      justify-center
                      text-sm
                      font-semibold
                      opacity-40
                    "
                  >
                    {story.position + 1}
                  </div>

                  {/* Cover */}
                  {story.cover_url ? (
                    <Image
                      src={story.cover_url}
                      alt={story.title}
                      width={90}
                      height={120}
                      className="
                        h-[120px]
                        w-[80px]
                        shrink-0
                        rounded-xl
                        object-cover
                      "
                    />
                  ) : (
                    <div
                      className="
                        flex
                        h-[120px]
                        w-[80px]
                        shrink-0
                        items-center
                        justify-center
                        rounded-xl
                        border
                        text-3xl
                        opacity-40
                      "
                      style={{
                        borderColor:
                          "var(--card-border)",
                      }}
                    >
                      📖
                    </div>
                  )}

                  {/* Details */}
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/story/${story.slug}`}
                      className="
                        text-xl
                        md:text-2xl
                        font-bold
                        hover:underline
                      "
                    >
                      {story.title}
                    </Link>

                    {story.description && (
                      <p
                        className="
                          mt-2
                          text-sm
                          opacity-70
                          line-clamp-2
                        "
                      >
                        {story.description}
                      </p>
                    )}                   

                    <div className="mt-3">
                      <span
                        className="
                          inline-block
                          rounded-full
                          border
                          px-3
                          py-1
                          text-xs
                        "
                        style={{
                          borderColor:
                            "var(--card-border)",
                        }}
                      >
                        {story.status}
                      </span>
                    </div>

                    <Link
                      href={`/story/${story.slug}`}
                      className="
                        inline-block
                        mt-4
                        text-sm
                        font-medium
                        hover:underline
                      "
                    >
                      Open Story →
                    </Link>
                    
                    <CollectionStoryActions
                        collectionId={collection.id}
                        storyId={story.id}
                        isInCollection={true}
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="mt-12">
  <div className="mb-6">
    <h2 className="text-2xl font-bold">
      Add Stories
    </h2>

    <p className="mt-1 text-sm opacity-70">
      Add stories from your library to this collection.
    </p>
  </div>

  {!availableStories.length ? (
    <div
      className="
        rounded-2xl
        border
        p-8
        text-center
      "
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <p className="opacity-70">
        There are no more saved stories available to add.
      </p>
    </div>
  ) : (
    <div className="space-y-4">
      {availableStories.map((entry) => {
        const story = Array.isArray(entry.stories)
          ? entry.stories[0]
          : entry.stories;

        if (!story) return null;

        return (
          <div
            key={entry.story_id}
            className="
              flex
              items-center
              gap-4
              rounded-2xl
              border
              p-4
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            {story.cover_url ? (
              <Image
                src={story.cover_url}
                alt={story.title}
                width={60}
                height={80}
                className="
                  h-20
                  w-14
                  shrink-0
                  rounded-lg
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  flex
                  h-20
                  w-14
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  border
                  text-xl
                  opacity-40
                "
                style={{
                  borderColor:
                    "var(--card-border)",
                }}
              >
                📖
              </div>
            )}

            <div className="min-w-0 flex-1">
              <Link
                href={`/story/${story.slug}`}
                className="font-semibold hover:underline"
              >
                {story.title}
              </Link>
            </div>

            <CollectionStoryActions
              collectionId={collection.id}
              storyId={story.id}
              isInCollection={false}
            />
          </div>
        );
      })}
    </div>
  )}
</section>
    </main>
  );
}