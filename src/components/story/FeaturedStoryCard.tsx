import Image from "next/image";
import Link from "next/link";
import StoryStats from "./StoryStats";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

type FeaturedStoryCardProps = {
  story: any;
};

export default function FeaturedStoryCard({
  story,
}: FeaturedStoryCardProps) {
  const stats = story.story_stats;

  const author =
    story.profiles?.display_name ??
    story.profiles?.username ??
    "Unknown Author";

  return (
    <div className="mb-16">
      <Card
        hover
        elevated
        padding="lg"
        className="overflow-hidden"
      >

      <div
        className="
          grid
          gap-10
          items-center
          lg:grid-cols-[280px_1fr]
        "
>
        {/* Cover */}

        <div
          className="
            relative
            mx-auto
            h-[370px]
            w-[250px]
            overflow-hidden
            rounded-2xl
          "
        >
          {story.cover_url ? (
            <Image
              src={story.cover_url}
              alt={story.title}
              fill
              priority
              className="object-cover"
            />
          ) : (
            <div
              className="
                flex
                h-full
                items-center
                justify-center
                text-7xl
              "
              style={{
                backgroundColor:
                  "var(--background)",
              }}
            >
              📖
            </div>
          )}
        </div>

        {/* Information */}

        <div className="flex flex-col">

          <span
            className="
              mb-4
              w-fit
              rounded-full
              border
              px-4
              py-1
              text-sm
              font-semibold
            "
            style={{
              borderColor:
                "var(--card-border)",
            }}
          >
            ⭐ Featured Story
          </span>

          <h1
            className="
              text-5xl
              font-bold
            "
          >
            {story.title}
          </h1>

          <p
            className="
              mt-3
              text-lg
              opacity-75
            "
          >
            by {author}
          </p>

          <p
            className="
              mt-8
              max-w-3xl
              text-lg
              leading-8
              opacity-85
            "
          >
            {story.description}
          </p>

          <div className="mt-8">
            <StoryStats
              views={stats?.views}
              likes={stats?.likes}
              libraryAdds={stats?.library_adds}
              reviews={stats?.reviews}
              rating={Number(
                stats?.average_rating ?? 0
              )}
            />
          </div>

          <div
            className="
              mt-auto
              flex
              flex-wrap
              gap-4
              pt-10
            "
          >
            <Button
              href={`/story/${story.slug}`}
              size="lg"
            >
              Read Now →
            </Button>

            <span
              className="
                rounded-xl
                border
                px-5
                py-3
                font-medium
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
        </div>
      </Card>
    </div>
  );
}