import Image from "next/image";
import Link from "next/link";

import StoryStats from "./StoryStats";

type StoryCardProps = {
  story: any;
};

export default function StoryCard({
  story,
}: StoryCardProps) {
  const stats = story.story_stats;
console.log("StoryCard:", story.title);
console.log("story_stats =", story.story_stats);

  const author =
    story.profiles?.display_name ??
    story.profiles?.username ??
    "Unknown Author";

  return (
    <Link
      href={`/story/${story.slug}`}
      className="
        group
        flex
        gap-5
        rounded-2xl
        border
        p-5
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
      "
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      {/* Cover */}

      <div
        className="
          relative
          h-[180px]
          w-[125px]
          shrink-0
          overflow-hidden
          rounded-xl
        "
      >
        {story.cover_url ? (
          <Image
            src={story.cover_url}
            alt={story.title}
            fill
            className="
              object-cover
              transition-transform
              duration-300
              group-hover:scale-105
            "
          />
        ) : (
          <div
            className="
              flex
              h-full
              items-center
              justify-center
              rounded-xl
              text-5xl
            "
            style={{
              backgroundColor: "var(--background)",
            }}
          >
            📖
          </div>
        )}
      </div>

      {/* Content */}

      <div
        className="
          flex
          min-w-0
          flex-1
          flex-col
        "
      >
        {/* Title */}

        <h3
          className="
            text-2xl
            font-bold
            transition-colors
            group-hover:text-cyan-500
          "
        >
          {story.title}
        </h3>

        {/* Author */}

        <p
          className="
            mt-1
            text-sm
            opacity-75
          "
        >
          by {author}
        </p>

        {/* Description */}

        <p
          className="
            mt-4
            line-clamp-3
            opacity-85
          "
        >
          {story.description}
        </p>

        {/* Stats */}

        <div className="mt-5">
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

        {/* Footer */}

        <div
          className="
            mt-auto
            flex
            items-center
            justify-between
            pt-6
          "
        >
          <span
            className="
              rounded-full
              border
              px-3
              py-1
              text-sm
              font-medium
            "
            style={{
              borderColor:
                "var(--card-border)",
            }}
          >
            {story.status}
          </span>

          <span
            className="
              font-semibold
              text-cyan-500
              transition-transform
              duration-200
              group-hover:translate-x-1
            "
          >
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}