import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SaveStoryButton from "@/components/SaveStoryButton";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicStoryPage({
  params,
}: Props) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: story } = await supabase
    .from("stories")
    .select(`
      *,
      profiles (
        username,
        display_name
      )
    `)
    .eq("slug", slug)
    .single();

  if (!story) {
    notFound();
  }

  if (story.status === "Draft") {
    notFound();
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", story.id)
    .order("chapter_number");

  const { data: storyGenres } = await supabase
    .from("story_genres")
    .select(`
      genres (
        id,
        name,
        slug
      )
    `)
    .eq("story_id", story.id);
  
  const genreIds =
  storyGenres
    ?.map((g: any) => g.genres.id)
    .filter(Boolean) ?? [];

  const { data: relatedStoryLinks } =
    genreIds.length > 0
      ? await supabase
          .from("story_genres")
          .select(`
            story_id,
            genre_id
          `)
          .in("genre_id", genreIds)
      : { data: [] };

  const recommendationScores = new Map<string, number>();

  (relatedStoryLinks ?? []).forEach((item) => {
    if (item.story_id === story.id) return;

    recommendationScores.set(
      item.story_id,
      (recommendationScores.get(item.story_id) ?? 0) + 1
    );
  });

  const relatedStoryIds = [...recommendationScores.keys()];

  const { data: relatedStories } =
    relatedStoryIds.length > 0
      ? await supabase
          .from("stories")
          .select(`
            id,
            title,
            slug,
            cover_url,
            description,
            status
          `)
          .in("id", relatedStoryIds)
          .neq("status", "Draft")
          .limit(6)
      : { data: [] };

  relatedStories?.sort(
    (a, b) =>
      (recommendationScores.get(b.id) ?? 0) -
      (recommendationScores.get(a.id) ?? 0)
  );

  const { data: storyTags } = await supabase
    .from("story_tags")
    .select(`
      tags (
        id,
        name,
        slug
      )
    `)
    .eq("story_id", story.id);

    console.log(storyTags);

  return (

  <main className="max-w-6xl mx-auto p-8">


<div
  className="rounded-xl border p-6"
  style={{
    backgroundColor: "var(--card)",
    borderColor: "var(--card-border)",
  }}
>
  <div className="flex flex-col md:flex-row gap-8">

    {story.cover_url && (
      <Image
        src={story.cover_url}
        alt={story.title}
        width={280}
        height={420}
        className="rounded-lg object-cover"
      />
    )}

    <div className="flex-1">

      <h1 className="text-5xl font-bold">
        {story.title}
      </h1>

      <p className="mt-3 opacity-80">
        By{" "}
        <Link
          href={`/author/${story.profiles?.username}`}
          className="underline"
        >
          {story.profiles?.display_name ??
            story.profiles?.username}
        </Link>
      </p>

      <div className="mt-5 flex flex-wrap gap-3">

        <span
          className="px-3 py-1 rounded-full border text-sm"
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          {story.status}
        </span>

        <span
          className="px-3 py-1 rounded-full border text-sm"
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          {chapters?.length ?? 0} Chapters
        </span>   
      </div>

      {(storyGenres?.length ?? 0) > 0 && (
  <div className="mt-6">

    <h3 className="text-sm font-semibold mb-2">
      Genres
    </h3>

    <div className="flex flex-wrap gap-2">
      {(
        storyGenres as unknown as {
          genres: {
            id: string;
            name: string;
            slug: string;
          };
        }[]
      ).map((item) => (
        <Link
          key={item.genres.id}
          href={`/search?genre=${item.genres.slug}`}
          className="
            px-3
            py-1
            rounded-full
            border
            text-sm
            hover:bg-black
            hover:text-white
            transition
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          {item.genres.name}
        </Link>
      ))}
    </div>
  </div>
)}

{(storyTags?.length ?? 0) > 0 && (
  <div className="mt-5">

    <h3 className="text-sm font-semibold mb-2">
      Tags
    </h3>

    <div className="flex flex-wrap gap-2">
      {(
        storyTags as unknown as {
          tags: {
            id: string;
            name: string;
            slug: string;
          };
        }[]
      ).map((item) => (
        <Link
          key={item.tags.id}
          href={`/search?tag=${item.tags.slug}`}
          className="
            px-3
            py-1
            rounded-full
            border
            text-sm
            hover:bg-black
            hover:text-white
            transition
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          {item.tags.name}
        </Link>
      ))}
    </div>
  </div>
)}

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <SaveStoryButton
          storyId={story.id}
        />

        {chapters?.[0] && (
          <Link
            href={`/chapter/${chapters[0].id}`}
            className="
              px-4
              py-2
              rounded-lg
              border
              font-medium
              transition
              hover:bg-black
              hover:text-white
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            Read First Chapter
          </Link>
        )}
      </div>

      <div
        className="mt-8 rounded-xl border p-5"
        style={{
          backgroundColor: "var(--background)",
          borderColor: "var(--card-border)",
        }}
      >
        <h2 className="text-xl font-semibold">
          Synopsis
        </h2>

        <p className="mt-3 leading-8 opacity-90">
          {story.description}
        </p>
      </div>

    </div>

  </div>
</div>

<div className="mt-10">
  <h2 className="text-3xl font-bold">
    Chapters
  </h2>

{!chapters?.length ? (
<div
className="
mt-6
rounded-xl
border
p-10
text-center
"
style={{
backgroundColor: "var(--card)",
borderColor: "var(--card-border)",
}}
> <div className="text-5xl mb-4">
✍️ </div>


  <h3 className="text-2xl font-semibold">
    Chapters coming soon
  </h3>

  <p className="mt-3 opacity-80">
    This story has not published any chapters yet.
  </p>
</div>


) : ( <div className="mt-6 space-y-3">
{chapters.map((chapter) => (
<Link
key={chapter.id}
href={`/chapter/${chapter.id}`}
className="
block
rounded-xl
border
p-4
transition
hover:shadow-md
"
style={{
backgroundColor: "var(--card)",
borderColor: "var(--card-border)",
}}
> <div className="flex items-center justify-between"> <div> <div className="font-semibold">
Chapter {chapter.chapter_number} </div>


          <div className="opacity-80">
            {chapter.title}
          </div>
        </div>

        <div className="text-sm opacity-70">
          Read →
        </div>
      </div>
    </Link>
  ))}
</div>
)}
</div>

{relatedStories && relatedStories.length > 0 && (
  <section className="mt-16">

    <h2 className="text-3xl font-bold mb-6">
      More Like This
    </h2>

    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

      {relatedStories.map((related) => (
        <Link
          key={related.id}
          href={`/story/${related.slug}`}
          className="
            rounded-xl
            border
            overflow-hidden
            transition
            hover:-translate-y-1
            hover:shadow-lg
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >

          {related.cover_url && (
            <Image
              src={related.cover_url}
              alt={related.title}
              width={300}
              height={450}
              className="w-full h-64 object-cover"
            />
          )}

          <div className="p-5">

            <h3 className="text-xl font-bold">
              {related.title}
            </h3>

            <p className="mt-3 opacity-80 line-clamp-3">
              {related.description}
            </p>

          </div>

        </Link>
      ))}

    </div>

  </section>
)}

  </main>
);
}