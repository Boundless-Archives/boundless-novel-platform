import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import FollowButton from "@/components/profile/FollowButton";
import { createClient } from "@/utils/supabase/server";


type Props = {
  params: Promise<{
    username: string;
  }>;
};

export default async function AuthorPage({
  params,
}: Props) {
  const { username } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /*
   * Load author profile.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select(`
      id,
      username,
      display_name,
      bio,
      avatar_url
    `)
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  /*
   * Load Following Button
   */

  let isFollowing = false;

  if (user && user.id !== profile.id) {
    const { data: follow } = await supabase
      .from("followers")
      .select("id")
      .eq("follower_id", user.id)
      .eq("following_id", profile.id)
      .maybeSingle();

    isFollowing = !!follow;
  }

  /*
   * Count Followers
   */

  const { count: followerCount } = await supabase
    .from("followers")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("following_id", profile.id);

  const { count: followingCount } = await supabase
    .from("followers")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("follower_id", profile.id);

  /*
   * Load the author's published stories.
   */
  const { data: stories } = await supabase
    .from("stories")
    .select(`
      id,
      title,
      slug,
      description,
      cover_url,
      status,
      created_at
    `)
    .eq("author_id", profile.id)
    .neq("status", "Draft")
    .order("created_at", {
      ascending: false,
    });

  /*
   * Load the author's series.
   */
  const { data: seriesRows } = await supabase
    .from("series")
    .select(`
      id,
      title,
      description,
      cover_url,
      created_at
    `)
    .eq("author_id", profile.id)
    .order("created_at", {
      ascending: false,
    });

  /*
   * Load series memberships.
   *
   * We use these to determine which series actually contain
   * at least one publicly visible book.
   */
  const seriesIds =
    seriesRows?.map((series) => series.id) ?? [];

  const { data: seriesStoryRows } =
    seriesIds.length > 0
      ? await supabase
          .from("series_stories")
          .select(`
            series_id,
            story_id,
            position,
            stories (
              id,
              status
            )
          `)
          .in("series_id", seriesIds)
          .order("position", {
            ascending: true,
          })
      : { data: [] };

  /*
   * Count only published books in each series.
   */
  const publishedSeriesCounts = new Map<
    string,
    number
  >();

  (seriesStoryRows ?? []).forEach((row) => {
    const story = Array.isArray(row.stories)
      ? row.stories[0]
      : row.stories;

    if (!story || story.status === "Draft") {
      return;
    }

    publishedSeriesCounts.set(
      row.series_id,
      (publishedSeriesCounts.get(row.series_id) ?? 0) + 1
    );
  });

  /*
   * Only show series that contain at least one
   * published book.
   */
  const publicSeries =
    (seriesRows ?? []).filter(
      (series) =>
        (publishedSeriesCounts.get(series.id) ?? 0) > 0
    );

  const storyCount = stories?.length ?? 0;
  const seriesCount = publicSeries.length;

  return (
    <main className="max-w-6xl mx-auto px-5 py-8 md:px-8 md:py-10">

      {/* =====================================================
          AUTHOR HEADER
      ===================================================== */}
      <section
        className="
          rounded-2xl
          border
          px-6
          py-7
          md:px-8
          md:py-8
        "
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="flex flex-col sm:flex-row gap-6 items-start">

          {/* Avatar */}
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url}
              alt={
                profile.display_name ??
                profile.username
              }
              width={112}
              height={112}
              className="
                w-28
                h-28
                rounded-full
                object-cover
                shrink-0
              "
            />
          ) : (
            <div
              className="
                w-28
                h-28
                rounded-full
                border
                flex
                items-center
                justify-center
                text-4xl
                shrink-0
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >
              ✍️
            </div>
          )}

          <div className="flex-1 min-w-0">

            <div className="text-sm opacity-60">
              Author
            </div>

            <h1 className="
              mt-1
              text-3xl
              md:text-4xl
              font-bold
              tracking-tight
            ">
              {profile.display_name ||
                profile.username}
            </h1>

            <p className="mt-1 text-sm opacity-60">
              @{profile.username}
            </p>

            {user && user.id !== profile.id && (
              <div className="mt-5">
                <FollowButton
                  userId={profile.id}
                  initialFollowing={isFollowing}
                />
              </div>
            )}

            <div className="flex gap-6 text-sm">

              <Link
                href={`/author/${profile.username}/followers`}
                className="hover:underline"
              >
                <span className="font-bold">
                  {followerCount ?? 0}
                </span>{" "}
                <span className="opacity-60">
                  Followers
                </span>
              </Link>

              <Link
                href={`/author/${profile.username}/following`}
                className="hover:underline"
              >
                <span className="font-bold">
                  {followingCount ?? 0}
                </span>{" "}
                <span className="opacity-60">
                  Following
                </span>
              </Link>

            </div>

            <p className="
              mt-4
              max-w-3xl
              leading-7
              opacity-85
              whitespace-pre-wrap
            ">
              {profile.bio ||
                "This author has not written a bio yet."}
            </p>

            {/* Author stats */}
            <div className="
              mt-5
              flex
              flex-wrap
              items-center
              gap-x-6
              gap-y-2
              text-sm
              opacity-70
            ">
              <span>
                <strong className="font-semibold opacity-100">
                  {storyCount}
                </strong>{" "}
                {storyCount === 1
                  ? "story"
                  : "stories"}
              </span>

              <span>
                <strong className="font-semibold opacity-100">
                  {seriesCount}
                </strong>{" "}
                {seriesCount === 1
                  ? "series"
                  : "series"}
              </span>
            </div>

          </div>
        </div>
      </section>

      {/* =====================================================
          STORIES
      ===================================================== */}
      <section className="mt-12">

        <div className="
          flex
          flex-col
          sm:flex-row
          sm:items-end
          sm:justify-between
          gap-2
          mb-5
        ">
          <div>
            <h2 className="text-2xl font-bold">
              Stories
            </h2>

            <p className="mt-1 text-sm opacity-65">
              Published stories by this author.
            </p>
          </div>
        </div>

        {!stories?.length ? (
          <div
            className="
              rounded-2xl
              border
              p-8
              text-center
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor:
                "var(--card-border)",
            }}
          >
            <div className="text-4xl">
              📚
            </div>

            <h3 className="mt-3 text-lg font-semibold">
              No published stories yet
            </h3>

            <p className="mt-2 text-sm opacity-70">
              This author has not published any
              stories yet.
            </p>
          </div>
        ) : (
          <div className="
            grid
            gap-5
            sm:grid-cols-2
            lg:grid-cols-3
          ">

            {stories.map((story) => (
              <Link
                key={story.id}
                href={`/story/${story.slug}`}
                className="
                  group
                  rounded-xl
                  border
                  overflow-hidden
                  transition
                  hover:-translate-y-1
                  hover:shadow-lg
                "
                style={{
                  backgroundColor:
                    "var(--card)",
                  borderColor:
                    "var(--card-border)",
                }}
              >

                {/* Smaller cover */}
                {story.cover_url ? (
                  <Image
                    src={story.cover_url}
                    alt={story.title}
                    width={260}
                    height={360}
                    className="
                      w-full
                      h-56
                      object-cover
                      transition
                      group-hover:scale-[1.02]
                    "
                  />
                ) : (
                  <div
                    className="
                      w-full
                      h-56
                      flex
                      items-center
                      justify-center
                      text-4xl
                      opacity-35
                    "
                  >
                    📖
                  </div>
                )}

                <div className="p-4">

                  <h3 className="
                    text-lg
                    font-bold
                    leading-snug
                    group-hover:underline
                    line-clamp-2
                  ">
                    {story.title}
                  </h3>

                  {story.description && (
                    <p className="
                      mt-2
                      text-sm
                      leading-6
                      opacity-70
                      line-clamp-2
                    ">
                      {story.description}
                    </p>
                  )}

                  <div className="
                    mt-3
                    flex
                    items-center
                    justify-between
                    gap-3
                  ">

                    <span
                      className="
                        inline-flex
                        rounded-full
                        border
                        px-2.5
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

                    <span className="
                      text-xs
                      opacity-55
                      group-hover:opacity-90
                      transition
                    ">
                      Read →
                    </span>

                  </div>

                </div>
              </Link>
            ))}

          </div>
        )}

      </section>

      {/* =====================================================
          SERIES
      ===================================================== */}
      {publicSeries.length > 0 && (
        <section className="mt-14">

          <div className="mb-5">

            <h2 className="text-2xl font-bold">
              Series
            </h2>

            <p className="mt-1 text-sm opacity-65">
              Explore this author's stories in series order.
            </p>

          </div>

          <div className="
            grid
            gap-5
            md:grid-cols-2
          ">

            {publicSeries.map((series) => {
              const bookCount =
                publishedSeriesCounts.get(
                  series.id
                ) ?? 0;

              return (
                <Link
                  key={series.id}
                  href={`/series/${series.id}`}
                  className="
                    group
                    rounded-xl
                    border
                    overflow-hidden
                    transition
                    hover:-translate-y-1
                    hover:shadow-lg
                  "
                  style={{
                    backgroundColor:
                      "var(--card)",
                    borderColor:
                      "var(--card-border)",
                  }}
                >

                  <div className="
                    flex
                    gap-4
                    p-4
                  ">

                    {/* Series cover */}
                    {series.cover_url ? (
                      <Image
                        src={series.cover_url}
                        alt={series.title}
                        width={120}
                        height={150}
                        className="
                          w-24
                          h-32
                          sm:w-28
                          sm:h-36
                          rounded-lg
                          object-cover
                          shrink-0
                        "
                      />
                    ) : (
                      <div
                        className="
                          w-24
                          h-32
                          sm:w-28
                          sm:h-36
                          rounded-lg
                          border
                          flex
                          items-center
                          justify-center
                          text-3xl
                          opacity-35
                          shrink-0
                        "
                        style={{
                          borderColor:
                            "var(--card-border)",
                        }}
                      >
                        📚
                      </div>
                    )}

                    {/* Series information */}
                    <div className="
                      min-w-0
                      flex-1
                      py-1
                    ">

                      <div className="
                        text-xs
                        opacity-55
                      ">
                        Series
                      </div>

                      <h3 className="
                        mt-1
                        text-xl
                        font-bold
                        leading-snug
                        group-hover:underline
                        line-clamp-2
                      ">
                        {series.title}
                      </h3>

                      {series.description && (
                        <p className="
                          mt-2
                          text-sm
                          leading-5
                          opacity-70
                          line-clamp-2
                        ">
                          {series.description}
                        </p>
                      )}

                      <div className="
                        mt-3
                        flex
                        items-center
                        justify-between
                        gap-3
                      ">

                        <span className="
                          text-xs
                          opacity-60
                        ">
                          {bookCount}{" "}
                          {bookCount === 1
                            ? "published book"
                            : "published books"}
                        </span>

                        <span className="
                          text-xs
                          font-medium
                          opacity-60
                          group-hover:opacity-100
                          transition
                        ">
                          View →
                        </span>

                      </div>

                    </div>

                  </div>

                </Link>
              );
            })}

          </div>

        </section>
      )}

    </main>
  );
}