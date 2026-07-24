import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/utils/supabase/server";

import TrendingStories from "@/components/home/TrendingStories";
import PopularStories from "@/components/home/PopularStories";

import { ContinueReading } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let continueReading: ContinueReading | null = null;

  if (user) {
    const { data } = await supabase
      .from("reading_history")
      .select(`
        chapter_id,
        stories (
          title,
          slug,
          cover_url
        ),
        chapters (
          title,
          chapter_number
        )
      `)
      .eq("user_id", user.id)
      .order("last_read_at", {
        ascending: false,
      })
      .limit(1)
      .maybeSingle();

    continueReading =
      data as unknown as ContinueReading;
  }

  const { data: stories } = await supabase
    .from("stories")
    .select(`
      *,
      profiles (
        username,
        display_name
      ),
      story_stats (
        views,
        likes,
        library_adds,
        reviews,
        average_rating
      )
    `)
    .neq("status", "Draft")
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="max-w-7xl mx-auto px-6 py-8">

      {/* HERO */}

      <section
        className="
          relative
          overflow-hidden
          rounded-3xl
          px-8
          py-28
          text-center
          mb-16
        "
        style={{
          background:
            "radial-gradient(circle at top, rgba(99,102,241,0.18), transparent 65%)",
        }}
      >

        <div className="flex flex-col items-center">

          <Image
            src="/branding/hero-logo.png"
            alt="Boundless"
            width={950}
            height={620}
            priority
            className="w-full max-w-5xl object-contain drop-shadow-xl"
          />

          <p
            className="
            mt-4
            max-w-3xl
            text-xl
            opacity-80
          "
          >
            Discover unforgettable worlds, follow incredible
            authors, and build your personal library of stories.
          </p>

          <div
            className="
              mt-10
              flex
              flex-wrap
              justify-center
              gap-5
            "
          >

            <Link
              href="#latest"
              className="
                rounded-xl
                px-6
                py-3
                font-semibold
                transition
                hover:scale-105
              "
              style={{
                backgroundColor: "var(--button)",
                color: "var(--button-text)",
              }}
            >
              Start Reading
            </Link>

            {!user && (
              <Link
                href="/profile/become-author"
                className="
                  rounded-xl
                  border
                  px-6
                  py-3
                  font-semibold
                  transition
                  hover:shadow-lg
                "
                style={{
                  borderColor: "var(--card-border)",
                }}
              >
                Become an Author
              </Link>
            )}

          </div>

        </div>

      </section>

      {/* CONTINUE READING */}

      {continueReading && (
        <section
          className="
            mb-16
            rounded-2xl
            border
            p-6
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >

          <div className="flex gap-6 items-center">

            {continueReading.stories.cover_url && (

              <Image
                src={continueReading.stories.cover_url}
                alt={continueReading.stories.title}
                width={110}
                height={160}
                className="rounded-xl object-cover"
              />

            )}

            <div className="flex-1">

              <p className="text-sm opacity-70">
                Continue Reading
              </p>

              <h2 className="mt-1 text-3xl font-bold">
                {continueReading.stories.title}
              </h2>

              <p className="mt-2 opacity-80">

                Chapter {continueReading.chapters.chapter_number}

                {" — "}

                {continueReading.chapters.title}

              </p>

              <Link
                href={`/chapters/${continueReading.chapter_id}`}
                className="
                  inline-block
                  mt-5
                  rounded-xl
                  px-5
                  py-3
                  font-semibold
                  transition
                "
                style={{
                  backgroundColor: "var(--button)",
                  color: "var(--button-text)",
                }}
              >
                Continue Reading →
              </Link>

            </div>

          </div>

        </section>
      )}
            
{/* TRENDING STORIES */}

<TrendingStories />

{/* POPULAR STORIES */}

<PopularStories />

{/* BECOME AN AUTHOR */}

{!user && (
  <section
    id="latest"
    className="
      mt-16
      mb-16
      overflow-hidden
      rounded-3xl
      border
      p-10
      md:p-14
    "
    style={{
      background:
        "linear-gradient(135deg, rgba(99,102,241,.12), rgba(59,130,246,.05))",
      borderColor: "var(--card-border)",
    }}
  >

    <div className="grid gap-10 md:grid-cols-[1.6fr_1fr] items-center">

      <div>

        <span
          className="
            inline-block
            rounded-full
            border
            px-4
            py-1
            text-sm
            font-medium
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          ✍️ Writers Wanted
        </span>

        <h2
          className="
            mt-5
            text-4xl
            font-bold
            leading-tight
          "
        >
          Your story deserves
          <br />
          an audience.
        </h2>

        <p
          className="
            mt-5
            max-w-2xl
            text-lg
            opacity-80
          "
        >
          Publish original novels, web serials and
          short stories. Build your readership,
          receive ratings, interact with your
          community and grow your world one
          chapter at a time.
        </p>

        <div
          className="
            mt-8
            flex
            flex-wrap
            gap-4
          "
        >

          <Link
            href="/profile/become-author"
            className="
              rounded-xl
              px-6
              py-3
              font-semibold
              transition
              hover:scale-105
            "
            style={{
              backgroundColor: "var(--button)",
              color: "var(--button-text)",
            }}
          >
            Become an Author
          </Link>

          <Link
            href="/#latest"
            className="
              rounded-xl
              border
              px-6
              py-3
              font-semibold
              transition
              hover:shadow-lg
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            Explore Stories
          </Link>

        </div>

      </div>

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

        <div className="space-y-6">

          <div>
            <p className="text-3xl font-bold">
              📚 Unlimited Stories
            </p>

            <p className="mt-2 opacity-70">
              Publish without worrying about
              chapter limits.
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold">
              🌍 Global Readers
            </p>

            <p className="mt-2 opacity-70">
              Reach readers from around the world.
            </p>
          </div>

          <div>
            <p className="text-3xl font-bold">
              ⭐ Community Driven
            </p>

            <p className="mt-2 opacity-70">
              Likes, reviews, ratings and comments
              help your stories grow naturally.
            </p>
          </div>

        </div>

      </div>

    </div>

  </section>
)}

{/* LATEST STORIES */}

<section id="latest">

  <div className="flex items-center justify-between mb-8">

    <h2 className="text-4xl font-bold">
      Latest Stories
    </h2>

    <Link
      href="/#latest"
      className="opacity-70 hover:opacity-100 transition"
    >
      Browse All →
    </Link>

  </div>

  {!stories?.length ? (

<div
  className="
    rounded-2xl
    border
    p-12
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

  <h3 className="text-3xl font-bold">
    No stories yet
  </h3>

  <p className="mt-4 opacity-70">
    Boundless is waiting for its first adventure.
  </p>

</div>

) : (

<div className="space-y-6">

  {stories.map((story: any) => {

    const stats = story.story_stats?.[0];

    return (

      <Link
        key={story.id}
        href={`/story/${story.slug}`}
        className="
          flex
          gap-5
          rounded-2xl
          border
          p-5
          transition
          hover:-translate-y-1
          hover:shadow-xl
        "
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >

        {story.cover_url && (

          <Image
            src={story.cover_url}
            alt={story.title}
            width={120}
            height={170}
            className="
              h-[170px]
              w-[120px]
              rounded-xl
              object-cover
              shrink-0
            "
          />

        )}

        <div className="flex flex-col flex-1">

          <h3
            className="
              text-2xl
              font-bold
              transition
              hover:text-blue-600
            "
          >
            {story.title}
          </h3>

          <p className="mt-2 text-sm opacity-80">

            by{" "}

            {story.profiles?.display_name ??
              story.profiles?.username}

          </p>

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
              {story.status}
            </span>

          </div>

          <p
            className="
              mt-5
              opacity-80
              line-clamp-3
            "
          >
            {story.description}
          </p>

          <div
            className="
              mt-auto
              pt-6
              flex
              flex-wrap
              items-center
              gap-5
              text-sm
              opacity-70
            "
          >

            {(stats?.views ?? 0) > 0 && (
              <span>
                👁 {stats.views}
              </span>
            )}

            {(stats?.likes ?? 0) > 0 && (
              <span>
                ❤ {stats.likes}
              </span>
            )}

            {(stats?.library_adds ?? 0) > 0 && (
              <span>
                📚 {stats.library_adds}
              </span>
            )}

            {(stats?.reviews ?? 0) > 0 && (
              <span>
                💬 {stats.reviews}
              </span>
            )}

            {(stats?.average_rating ?? 0) > 0 && (
              <span>
                ⭐ {Number(
                  stats.average_rating
                ).toFixed(1)}
              </span>
            )}

          </div>

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