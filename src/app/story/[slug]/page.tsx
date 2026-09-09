import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SaveStoryButton from "@/components/SaveStoryButton";
import LikeButton from "@/components/story/LikeButton";
import ReviewForm from "@/components/story/ReviewForm";
import Card from "@/components/ui/Card";
import DownloadBookButton from "@/components/offline/DownloadBookButton";
import CanonTierBadge from "@/components/story/CanonTierBadge";
import RequestCrossoverButton from "@/components/story/RequestCrossoverButton";

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

  const {
    data: { user },
  } = await supabase.auth.getUser();

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

  const { data: storyStats } = await supabase
    .from("story_stats")
    .select(`
      likes,
      reviews,
      average_rating
    `)
    .eq("story_id", story.id)
    .maybeSingle();

    let liked = false;

    if (user) {
      const { data } = await supabase
        .from("story_likes")
        .select("id")
        .eq("story_id", story.id)
        .eq("user_id", user.id)
        .maybeSingle();

      liked = !!data;
    }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", story.id)
    .eq("status", "Published")
    .order("chapter_number");

    /*
   * Check whether this story belongs to a series.
   */
  const { data: seriesMembership } = await supabase
    .from("series_stories")
    .select(`
      series_id,
      position,
      series (
        id,
        title,
        description,
        cover_url
      )
    `)
    .eq("story_id", story.id)
    .maybeSingle();

  const series = seriesMembership?.series
    ? Array.isArray(seriesMembership.series)
      ? seriesMembership.series[0]
      : seriesMembership.series
    : null;

  const { data: storyGenres } = await supabase
  .from("story_genres")
  .select(`
    genre_id
  `)
  .eq("story_id", story.id);

const genreIds =
  storyGenres?.map((item) => item.genre_id) ?? [];

const { data: recommendationTags } = await supabase
  .from("story_tags")
  .select(`
    tag_id
  `)
  .eq("story_id", story.id);

const tagIds =
  recommendationTags?.map((item) => item.tag_id) ?? [];

/*
 * Score related stories.
 *
 * Genre match = 3 points
 * Tag match   = 2 points
 */
const recommendationScores =
  new Map<string, number>();

/*
 * Find stories sharing genres.
 */
if (genreIds.length > 0) {
  const { data: relatedGenreLinks } =
    await supabase
      .from("story_genres")
      .select(`
        story_id,
        genre_id
      `)
      .in("genre_id", genreIds);

  (relatedGenreLinks ?? []).forEach(
    (item) => {
      if (item.story_id === story.id) {
        return;
      }

      recommendationScores.set(
        item.story_id,
        (recommendationScores.get(
          item.story_id
        ) ?? 0) + 3
      );
    }
  );
}

/*
 * Find stories sharing tags.
 */
if (tagIds.length > 0) {
  const { data: relatedTagLinks } =
    await supabase
      .from("story_tags")
      .select(`
        story_id,
        tag_id
      `)
      .in("tag_id", tagIds);

  (relatedTagLinks ?? []).forEach(
    (item) => {
      if (item.story_id === story.id) {
        return;
      }

      recommendationScores.set(
        item.story_id,
        (recommendationScores.get(
          item.story_id
        ) ?? 0) + 2
      );
    }
  );
}

const relatedStoryIds =
  [...recommendationScores.keys()];

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
        .in(
          "id",
          relatedStoryIds
        )
        .neq("status", "Draft")
        .limit(6)
    : { data: [] };

relatedStories?.sort(
  (a, b) =>
    (recommendationScores.get(
      b.id
    ) ?? 0) -
    (recommendationScores.get(
      a.id
    ) ?? 0)
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

  const { data: reviews } = await supabase
    .from("story_reviews")
    .select("*")
    .eq("story_id", story.id)
    .order("created_at", {
      ascending: false,
    });

    const reviewerIds =
      reviews?.map((r) => r.user_id) ?? [];

    const { data: reviewerProfiles } =
      reviewerIds.length
        ? await supabase
            .from("profiles")
            .select(`
              id,
              username,
              display_name
            `)
            .in("id", reviewerIds)
        : { data: [] };
  const profileMap = new Map(
    (reviewerProfiles ?? []).map((profile) => [
      profile.id,
      profile,
    ])
  );

  let myReview = null;

  if (user) {
    const { data } = await supabase
      .from("story_reviews")
      .select("*")
      .eq("story_id", story.id)
      .eq("user_id", user.id)
      .maybeSingle();

    myReview = data;
  }

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

      {series && seriesMembership && (
        <div className="mt-4">
          <Link
            href={`/series/${series.id}`}
            className="
              inline-flex
              items-center
              gap-2
              rounded-xl
              border
              px-4
              py-2
              transition
              hover:-translate-y-0.5
              hover:shadow-md
            "
            style={{
              borderColor: "var(--card-border)",
              backgroundColor: "var(--background)",
            }}
          >
            <span>📚</span>

            <span>
              <span className="opacity-60">
                Part {seriesMembership.position} of
              </span>{" "}
              <span className="font-semibold">
                {series.title}
              </span>
            </span>

            <span className="opacity-60">
              →
            </span>
          </Link>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-3 items-center">

        <CanonTierBadge tier={story.canon_tier} />

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
      ).map((item) => {
        if (!item.genres) {
          return null;
        }

        return (
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
      );
    })}
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

        <LikeButton
          storyId={story.id}
          storySlug={story.slug}
          liked={liked}
          likes={storyStats?.likes ?? 0}
        />

        <DownloadBookButton
          storyId={story.id}
          slug={story.slug}
          title={story.title}
          description={story.description}
          coverUrl={story.cover_url}
          chapters={chapters ?? []}
        />

        {user && user.id !== story.author_id && (
          <RequestCrossoverButton
            targetStoryId={story.id}
          />
        )}

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

<section className="mt-12">

  <div className="flex items-center gap-4 mb-6">

    <h2 className="text-3xl font-bold">
      Reviews
    </h2>

    <span
      className="
        rounded-full
        border
        px-3
        py-1
        text-sm
      "
      style={{
        borderColor: "var(--card-border)",
      }}
    >
      ⭐ {storyStats?.average_rating ?? "0.0"} · {storyStats?.reviews ?? 0} reviews
    </span>

  </div>

  {user ? (
    <ReviewForm
      storyId={story.id}
      storySlug={story.slug}
      initialRating={myReview?.rating ?? 0}
      initialReview={myReview?.review ?? ""}
    />
  ) : (
    <div
      className="rounded-xl border p-6"
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: "var(--card)",
      }}
    >
      <p className="opacity-80">
        Log in to leave a review.
      </p>
    </div>
  )}

  <div className="mt-10 space-y-5">

    {reviews?.length ? (
      reviews.map((review: any) => (
        <div
          key={review.id}
          className="rounded-xl border p-5"
          style={{
            borderColor: "var(--card-border)",
            backgroundColor: "var(--card)",
          }}
        >
          <div className="flex items-center justify-between">

            <div>

              <h3 className="font-semibold">
                {profileMap.get(review.user_id)?.display_name ??
                profileMap.get(review.user_id)?.username ??
                "Unknown Reader"}
              </h3>

              <div className="text-yellow-500 mt-1">
                {"★".repeat(review.rating)}
                {"☆".repeat(5 - review.rating)}
              </div>

            </div>

            <div className="text-sm opacity-60">
              {new Date(
                review.updated_at
              ).toLocaleDateString()}
            </div>

          </div>

          <p className="mt-4 whitespace-pre-wrap opacity-90">
            {review.review}
          </p>

        </div>
      ))
    ) : (
      <div
        className="rounded-xl border p-8 text-center"
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "var(--card)",
        }}
      >
        <p className="opacity-70">
          No reviews yet.
        </p>
      </div>
    )}

  </div>

</section>

<div className="mt-10">
  <h2 className="text-3xl font-bold">
    Chapters
  </h2>

{!chapters?.length ? (
<Card
padding="lg"
className="text-center"
> 
<div className="text-5xl mb-4">
✍️ </div>


  <h3 className="text-2xl font-semibold">
    Chapters coming soon
  </h3>

  <p className="mt-3 opacity-80">
    This story has not published any chapters yet.
  </p>
</Card>


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