
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    genre?: string;
    tag?: string;
  }>;
}) {
  const {
    q,
    genre,
    tag,
  } = await searchParams;

  const supabase = await createClient();

  type StorySearchResult = {
    id: string;
    title: string;
    slug: string;
    description: string | null;
    status: string;
  };

  type AuthorSearchResult = {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    is_author: boolean;
  };

  let stories: StorySearchResult[] = [];
  let authors: AuthorSearchResult[] = [];

  const searchWords =
    q?.trim().split(/\s+/).filter(Boolean) ?? [];

  const matchedStoryIds = new Set<string>();

  // ------------------------
  // AUTHOR SEARCH
  // ------------------------

  if (searchWords.length > 0) {
    const { data } = await supabase
      .from("profiles")
      .select(`
        id,
        username,
        display_name,
        avatar_url,
        bio,
        is_author
      `)
      .eq("is_author", true)
      .or(
        searchWords
          .flatMap((word) => [
            `display_name.ilike.%${word}%`,
            `username.ilike.%${word}%`,
          ])
          .join(",")
      )
      .order("display_name");

    authors = data ?? [];
  }

  // ------------------------
  // GENRE SEARCH
  // ------------------------

  const { data: matchedGenres } =
    searchWords.length > 0
      ? await supabase
          .from("genres")
          .select("*")
          .or(
            searchWords
              .map(
                (word) =>
                  `name.ilike.%${word}%`
              )
              .join(",")
          )
          .order("name")
      : { data: [] };

  // ------------------------
  // TAG SEARCH
  // ------------------------

  const { data: matchedTags } =
    searchWords.length > 0
      ? await supabase
          .from("tags")
          .select("*")
          .or(
            searchWords
              .map(
                (word) =>
                  `name.ilike.%${word}%`
              )
              .join(",")
          )
          .order("name")
      : { data: [] };

  // ------------------------
  // TITLE SEARCH
  // ------------------------

  if (searchWords.length > 0) {
    const titleFilter =
      searchWords
        .map(
          (word) =>
            `title.ilike.%${word}%`
        )
        .join(",");

    const { data } = await supabase
      .from("stories")
      .select("id")
      .neq("status", "Draft")
      .or(titleFilter);

    data?.forEach((story) =>
      matchedStoryIds.add(story.id)
    );
  }

  // ------------------------
  // STORIES FROM MATCHED GENRES
  // ------------------------

  if (matchedGenres?.length) {
    const { data } = await supabase
      .from("story_genres")
      .select("story_id")
      .in(
        "genre_id",
        matchedGenres.map(
          (genre) => genre.id
        )
      );

    data?.forEach((row) =>
      matchedStoryIds.add(row.story_id)
    );
  }

  // ------------------------
  // STORIES FROM MATCHED TAGS
  // ------------------------

  if (matchedTags?.length) {
    const { data } = await supabase
      .from("story_tags")
      .select("story_id")
      .in(
        "tag_id",
        matchedTags.map(
          (tag) => tag.id
        )
      );

    data?.forEach((row) =>
      matchedStoryIds.add(row.story_id)
    );
  }

  // ------------------------
  // FILTER BY CLICKED GENRE
  // ------------------------

  if (genre) {
    const { data } = await supabase
      .from("story_genres")
      .select(`
        story_id,
        genres!inner(slug)
      `)
      .eq("genres.slug", genre);

    data?.forEach((row) =>
      matchedStoryIds.add(row.story_id)
    );
  }

  // ------------------------
  // FILTER BY CLICKED TAG
  // ------------------------

  if (tag) {
    const { data } = await supabase
      .from("story_tags")
      .select(`
        story_id,
        tags!inner(slug)
      `)
      .eq("tags.slug", tag);

    data?.forEach((row) =>
      matchedStoryIds.add(row.story_id)
    );
  }

  // ------------------------
  // LOAD STORIES
  // ------------------------

  if (matchedStoryIds.size > 0) {
    const { data } = await supabase
      .from("stories")
      .select("*")
      .neq("status", "Draft")
      .in(
        "id",
        [...matchedStoryIds]
      )
      .order("created_at", {
        ascending: false,
      });

    stories = data ?? [];
  }

return (
  <main className="max-w-5xl mx-auto px-6 py-10">

    <h1 className="text-4xl font-bold mb-3">
      {genre
        ? `${genre
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) =>
              c.toUpperCase()
            )} Stories`
        : tag
        ? `Stories tagged "${tag
            .replace(/-/g, " ")
            .replace(/\b\w/g, (c) =>
              c.toUpperCase()
            )}"`
        : q
        ? `Results for "${q}"`
        : "Search Stories"}
    </h1>

    <p className="opacity-70 mb-6">
      {genre
        ? "Browse stories from this genre."
        : tag
        ? "Browse stories with this tag."
        : "Find novels, authors and your next favorite adventure."}
    </p>

    <form className="mt-6">
      <input
        name="q"
        defaultValue={q ?? ""}
        placeholder="🔍 Search stories, authors, genres or tags..."
        className="
          w-full
          rounded-xl
          border
          px-5
          py-4
          text-lg
        "
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "var(--card)",
        }}
      />
    </form>

    {!q && !genre && !tag && (
      <div
        className="mt-10 rounded-2xl border p-12 text-center"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="text-5xl mb-4">
          🔍
        </div>

        <h2 className="text-2xl font-bold">
          Find your next favorite story
        </h2>

        <p className="mt-3 opacity-70">
          Search for stories, authors, genres and tags.
        </p>
      </div>
    )}

    {(q || genre || tag) &&
      stories.length === 0 &&
      authors.length === 0 &&
      (!matchedGenres || matchedGenres.length === 0) &&
      (!matchedTags || matchedTags.length === 0) && (

      <div
        className="mt-10 rounded-2xl border p-12 text-center"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="text-5xl mb-4">
          📭
        </div>

        <h2 className="text-2xl font-bold">
          Nothing matched your search
        </h2>

        <p className="mt-3 opacity-70">
          Try another keyword or browse a different genre.
        </p>

      </div>
    )}

    {matchedGenres && matchedGenres.length > 0 && (

      <div className="mt-10">

        <h2 className="text-2xl font-bold mb-4">
          Genres
        </h2>

        <div className="flex flex-wrap gap-3">

          {matchedGenres.map((genre) => (

            <Link
              key={genre.id}
              href={`/search?genre=${genre.slug}`}
              className="
                px-4
                py-2
                rounded-full
                border
                transition
                hover:bg-black
                hover:text-white
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            >
              {genre.name}
            </Link>

          ))}

        </div>

      </div>

    )}

    {matchedTags && matchedTags.length > 0 && (

      <div className="mt-10">

        <h2 className="text-2xl font-bold mb-4">
          Tags
        </h2>

        <div className="flex flex-wrap gap-3">

          {matchedTags.map((tag) => (

            <Link
              key={tag.id}
              href={`/search?tag=${tag.slug}`}
              className="
                px-4
                py-2
                rounded-full
                border
                transition
                hover:bg-black
                hover:text-white
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            >
              {tag.name}
            </Link>

          ))}

        </div>

      </div>

    )}

    {authors.length > 0 && (

      <div className="mt-10">

        <h2 className="text-2xl font-bold mb-4">
          Authors
        </h2>

        <div className="space-y-4">

          {authors.map((author) => (

            <Link
              key={author.id}
              href={`/author/${author.username}`}
              className="
                block
                rounded-xl
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

              <div className="flex items-center gap-4">

                {author.avatar_url ? (

                  <img
                    src={author.avatar_url}
                    alt={author.display_name ?? author.username}
                    className="
                      w-16
                      h-16
                      rounded-full
                      object-cover
                    "
                  />

                ) : (

                  <div
                    className="
                      w-16
                      h-16
                      rounded-full
                      border
                      flex
                      items-center
                      justify-center
                      text-xl
                      font-bold
                    "
                    style={{
                      borderColor:
                        "var(--card-border)",
                    }}
                  >
                    {(author.display_name ??
                      author.username)
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                )}

                <div>

                  <div className="text-xl font-bold">
                    {author.display_name ??
                      author.username}
                  </div>

                  <div className="opacity-70">
                    @{author.username}
                  </div>

                  {author.bio && (

                    <p className="mt-2 opacity-80 line-clamp-2">
                      {author.bio}
                    </p>

                  )}

                </div>

              </div>

            </Link>

          ))}

        </div>

      </div>

    )}

    {stories.length > 0 && (

      <div className="mt-10">

        <h2 className="text-2xl font-bold mb-4">
          Stories
        </h2>

        <div className="space-y-5">

          {stories.map((story) => (

            <Link
              key={story.id}
              href={`/story/${story.slug}`}
              className="
                block
                rounded-2xl
                border
                p-6
                transition
                duration-200
                hover:-translate-y-1
                hover:shadow-lg
              "
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--card-border)",
              }}
            >

              <div className="flex items-start justify-between gap-4">

                <div className="flex-1">

                  <h3
                    className="
                      text-2xl
                      font-bold
                      hover:text-cyan-400
                      transition
                    "
                  >
                    {story.title}
                  </h3>

                  {story.description && (
                    <p className="mt-3 opacity-80 line-clamp-3 leading-7">
                      {story.description}
                    </p>
                  )}

                  <div className="mt-5 flex flex-wrap gap-2">

                    <span
                      className="
                        px-3
                        py-1
                        rounded-full
                        border
                        text-sm
                      "
                      style={{
                        borderColor:
                          "var(--card-border)",
                      }}
                    >
                      {story.status}
                    </span>

                  </div>

                </div>

                <div
                  className="
                    text-3xl
                    opacity-30
                    self-center
                  "
                >
                  →
                </div>

              </div>

            </Link>

          ))}

        </div>

      </div>

    )}

  </main>
);
}