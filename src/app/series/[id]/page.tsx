import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PublicSeriesPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  /*
   * Load the series.
   *
   * We intentionally do NOT load profiles through a nested
   * relationship here. That relationship was returning null
   * even though the series itself existed.
   */
  const { data: series } = await supabase
    .from("series")
    .select(`
      id,
      title,
      description,
      cover_url,
      author_id
    `)
    .eq("id", id)
    .single();

  if (!series) {
    notFound();
  }

  /*
   * Load the author's public profile separately.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      username,
      display_name
    `)
    .eq("id", series.author_id)
    .maybeSingle();

  /*
   * Load the books belonging to this series.
   *
   * Draft stories are deliberately hidden from the public.
   */
  const { data: seriesRows } = await supabase
    .from("series_stories")
    .select(`
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
    .eq("series_id", id)
    .order("position", {
      ascending: true,
    });

  /*
   * Convert the Supabase relationship result into a clean
   * list of published books.
   */
  const books = (seriesRows ?? []).flatMap((row) => {
    const story = Array.isArray(row.stories)
      ? row.stories[0]
      : row.stories;

    if (!story || story.status === "Draft") {
      return [];
    }

    return [
      {
        position: row.position,
        story,
      },
    ];
  });

  return (
    <main className="max-w-6xl mx-auto p-8">

      <Link
        href="/explore"
        className="
          text-sm
          opacity-70
          hover:opacity-100
          transition
        "
      >
        ← Back to Explore
      </Link>

      {/* Series header */}
      <section className="mt-6">
        <div
          className="
            rounded-2xl
            border
            p-8
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <div className="flex flex-col md:flex-row gap-8">

            {series.cover_url ? (
              <Image
                src={series.cover_url}
                alt={series.title}
                width={260}
                height={260}
                className="
                  rounded-xl
                  w-[220px]
                  h-[220px]
                  object-cover
                  shrink-0
                "
              />
            ) : (
              <div
                className="
                  w-[220px]
                  h-[220px]
                  rounded-xl
                  border
                  flex
                  items-center
                  justify-center
                  text-6xl
                  opacity-40
                  shrink-0
                "
                style={{
                  borderColor: "var(--card-border)",
                }}
              >
                📚
              </div>
            )}

            <div className="flex-1">

              <div className="text-sm opacity-60">
                Series
              </div>

              <h1 className="mt-2 text-4xl md:text-5xl font-bold">
                {series.title}
              </h1>

              {profile && (
                <p className="mt-3 opacity-80">
                  By{" "}
                  <Link
                    href={`/author/${profile.username}`}
                    className="underline"
                  >
                    {profile.display_name ??
                      profile.username}
                  </Link>
                </p>
              )}

              <p className="mt-6 leading-8 opacity-90 whitespace-pre-wrap">
                {series.description ||
                  "No description provided."}
              </p>

              <div className="mt-6 text-sm opacity-60">
                {books.length}{" "}
                {books.length === 1
                  ? "published book"
                  : "published books"}
              </div>

            </div>

          </div>
        </div>
      </section>

      {/* Books */}
      <section className="mt-12">

        <div className="mb-6">
          <h2 className="text-3xl font-bold">
            Books in this Series
          </h2>

          <p className="mt-1 opacity-70">
            Read the books in order.
          </p>
        </div>

        {!books.length ? (
          <div
            className="
              rounded-2xl
              border
              p-10
              text-center
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="text-5xl">
              📚
            </div>

            <h3 className="mt-4 text-xl font-semibold">
              No published books yet
            </h3>

            <p className="mt-2 opacity-70">
              This series does not have any
              published books available yet.
            </p>
          </div>
        ) : (
          <div className="space-y-5">

            {books.map((item) => (
              <Link
                key={item.story.id}
                href={`/story/${item.story.slug}`}
                className="
                  block
                  rounded-2xl
                  border
                  p-5
                  transition
                  hover:-translate-y-1
                  hover:shadow-lg
                "
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                }}
              >
                <div
                  className="
                    flex
                    flex-col
                    sm:flex-row
                    gap-5
                    items-start
                    sm:items-center
                  "
                >

                  {/* Book number */}
                  <div
                    className="
                      shrink-0
                      w-12
                      h-12
                      rounded-full
                      border
                      flex
                      items-center
                      justify-center
                      font-bold
                    "
                    style={{
                      borderColor: "var(--card-border)",
                    }}
                  >
                    {item.position}
                  </div>

                  {/* Cover */}
                  {item.story.cover_url ? (
                    <Image
                      src={item.story.cover_url}
                      alt={item.story.title}
                      width={90}
                      height={130}
                      className="
                        shrink-0
                        w-[90px]
                        h-[130px]
                        rounded-lg
                        object-cover
                      "
                    />
                  ) : (
                    <div
                      className="
                        shrink-0
                        w-[90px]
                        h-[130px]
                        rounded-lg
                        border
                        flex
                        items-center
                        justify-center
                        text-2xl
                        opacity-40
                      "
                      style={{
                        borderColor: "var(--card-border)",
                      }}
                    >
                      📖
                    </div>
                  )}

                  {/* Information */}
                  <div className="flex-1">

                    <div className="text-sm opacity-60">
                      Book {item.position}
                    </div>

                    <h3 className="mt-1 text-2xl font-bold">
                      {item.story.title}
                    </h3>

                    {item.story.description && (
                      <p
                        className="
                          mt-2
                          opacity-80
                          line-clamp-3
                        "
                      >
                        {item.story.description}
                      </p>
                    )}

                    <div className="mt-4">
                      <span
                        className="
                          inline-block
                          rounded-full
                          border
                          px-3
                          py-1
                          text-sm
                        "
                        style={{
                          borderColor:
                            "var(--card-border)",
                        }}
                      >
                        {item.story.status}
                      </span>
                    </div>

                  </div>

                  <div className="text-sm opacity-60">
                    Read →
                  </div>

                </div>
              </Link>
            ))}

          </div>
        )}

      </section>

    </main>
  );
}