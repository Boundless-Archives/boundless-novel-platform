import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

import TrendingStories from "@/components/home/TrendingStories";
import PopularStories from "@/components/home/PopularStories";

import { ContinueReading } from "@/types/database";

import StoryGrid from "@/components/story/StoryGrid";
import FeaturedStoryCard from "@/components/story/FeaturedStoryCard";

import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import SectionHeader from "@/components/layout/SectionHeader";
import EmptyState from "@/components/layout/EmptyState";

import { getPersonalizedRecommendations } from "@/app/recommendations/actions";

export default async function HomePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let continueReading: ContinueReading | null = null;

  /*
   * CONTINUE READING
   */

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

  /*
   * ALL PUBLIC STORIES
   */

  const { data: stories } = await supabase
    .from("stories")
    .select(`
      *,
      profiles!stories_author_id_fkey (
        username,
        display_name
      ),
      story_stats (*)
    `)
    .neq("status", "Draft")
    .order("created_at", {
      ascending: false,
    });

  /*
   * FEATURED STORY
   */

  const featuredStory =
    stories?.length
      ? stories[0]
      : null;

  /*
   * PERSONALIZED RECOMMENDATIONS
   *
   * We reuse the same recommendation engine
   * used by /recommendations.
   *
   * Only logged-in users receive personalized
   * recommendations.
   */
  const recommendations = user
    ? await getPersonalizedRecommendations(5)
    : [];

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

            <Button href="#latest">
              Start Reading
            </Button>

            {!user && (
              <Button
                href="/profile/become-author"
                variant="secondary"
              >
                Become an Author
              </Button>
            )}

          </div>

        </div>

      </section>

      {/* CONTINUE READING */}

      {continueReading && (
        <Card
          elevated
          padding="lg"
          className="mb-16"
        >

          <div className="flex gap-6 items-center">

            {continueReading.stories.cover_url && (
              <Image
                src={
                  continueReading.stories.cover_url
                }
                alt={
                  continueReading.stories.title
                }
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

                Chapter{" "}
                {continueReading.chapters.chapter_number}

                {" — "}

                {continueReading.chapters.title}

              </p>

              <Button
                href={`/chapters/${continueReading.chapter_id}`}
              >
                Continue Reading →
              </Button>

            </div>

          </div>

        </Card>
      )}

      {/* FEATURED STORY */}

      {featuredStory && (
        <FeaturedStoryCard story={featuredStory} />
      )}

      {/* TRENDING STORIES */}

      <TrendingStories />

      {/* POPULAR STORIES */}

      <PopularStories />

      {/* PERSONALIZED RECOMMENDATIONS */}

      {user && recommendations.length > 0 && (
        <section className="mt-16">

          <SectionHeader
            title="Recommended for You"
            actionLabel="View All"
            actionHref="/recommendations"
          />

          <p className="mb-6 text-sm opacity-60">
            Stories selected based on your reading
            and library activity.
          </p>

          <div
            className="
              grid
              grid-cols-1
              gap-6
              sm:grid-cols-2
              lg:grid-cols-3
              xl:grid-cols-5
            "
          >

            {recommendations.map((story) => (
              <Link
                key={story.id}
                href={`/story/${story.slug}`}
                className="
                  group
                  overflow-hidden
                  rounded-2xl
                  border
                  transition
                  hover:-translate-y-1
                  hover:shadow-lg
                "
                style={{
                  borderColor:
                    "var(--card-border)",
                  backgroundColor:
                    "var(--card)",
                }}
              >

                {story.cover_url ? (
                  <Image
                    src={story.cover_url}
                    alt={story.title}
                    width={300}
                    height={450}
                    className="
                      h-64
                      w-full
                      object-cover
                      transition
                      duration-300
                      group-hover:scale-[1.02]
                    "
                  />
                ) : (
                  <div
                    className="
                      flex
                      h-64
                      w-full
                      items-center
                      justify-center
                      text-5xl
                      opacity-30
                    "
                  >
                    📖
                  </div>
                )}

                <div className="p-4">

                  <h3
                    className="
                      line-clamp-2
                      text-lg
                      font-bold
                    "
                  >
                    {story.title}
                  </h3>

                  {story.description && (
                    <p
                      className="
                        mt-2
                        line-clamp-3
                        text-sm
                        opacity-60
                      "
                    >
                      {story.description}
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

                </div>

              </Link>
            ))}

          </div>

        </section>
      )}

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
                  borderColor:
                    "var(--card-border)",
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

                <Button
                  href="/profile/become-author"
                  size="lg"
                >
                  Become an Author
                </Button>

                <Button
                  href="/explore"
                  variant="secondary"
                  size="lg"
                >
                  Explore Stories
                </Button>

              </div>

            </div>

            <Card
              elevated
              padding="lg"
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

            </Card>

          </div>

        </section>
      )}

      {/* LATEST STORIES */}

      <section id="latest">

        <SectionHeader
          title="Latest Stories"
          actionLabel="Browse All"
          actionHref="/explore"
        />

        {!stories?.length ? (

          <EmptyState
            icon="📚"
            title="No stories yet"
            description="Boundless is waiting for its first adventure."
          />

        ) : (

          <StoryGrid
            stories={stories ?? []}
          />

        )}

      </section>

    </main>
  );
}

