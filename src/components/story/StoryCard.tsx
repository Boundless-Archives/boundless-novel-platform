import Image from "next/image";
import Link from "next/link";
import StoryStats from "./StoryStats";
import Card from "@/components/ui/Card";
import CanonTierBadge from "./CanonTierBadge";

function updatedAgo(iso: string) {
  const days = Math.floor((new Date().getTime() - new Date(iso).getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

type StoryCardProps = {
  story: any;
  variant?: "default" | "compact" | "ranking";
};

export default function StoryCard({
  story,
  variant = "default",
}: StoryCardProps) {
  const stats = story.story_stats;

  const author =
    story.profiles?.display_name ??
    story.profiles?.username ??
    "Unknown Author";

  const compact = variant === "compact";
  const ranking = variant === "ranking";

  return (
    <Card hover padding="none" className="p-2 sm:p-5">
      <Link
      href={`/story/${story.slug}`}
      className="
        group
        flex
        gap-3
        sm:gap-5
        rounded-2xl
        border
        p-3
        sm:p-5
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
  className={`
    relative
    shrink-0
    overflow-hidden
    rounded-xl
    ${
      compact
        ? "h-[120px] w-[82px] sm:h-[140px] sm:w-[95px]"
        : "h-[150px] w-[100px] sm:h-[180px] sm:w-[125px]"
    }
  `}
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

      <div className="flex min-w-0 flex-1 flex-col">

        {/* Ranking badge */}

        {ranking && (
          <div className="mb-3 flex items-center justify-between">

            <span
              className="
                rounded-full
                bg-orange-500
                px-3
                py-1
                text-sm
                font-bold
                text-white
              "
            >
              🔥 {story.trendingScore}
            </span>

          </div>
        )}

        {/* Title */}

        <h3
          className={`
            font-bold
            transition-colors
            group-hover:text-cyan-500
            ${
              compact
                ? "text-xl"
                : "text-2xl"
            }
          `}
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

        {/* Genres */}

        {Array.isArray(story.genreNames) && story.genreNames.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {story.genreNames.slice(0, 3).map((name: string) => (
              <span
                key={name}
                className="rounded-full border px-2.5 py-0.5 text-xs opacity-80"
                style={{ borderColor: "var(--card-border)" }}
              >
                {name}
              </span>
            ))}
          </div>
        )}

        {/* Description */}

        {!compact && (
          <p
            className="
              mt-4
              line-clamp-3
              opacity-85
            "
          >
            {story.description}
          </p>
        )}

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
            flex-wrap
            items-center
            justify-between
            gap-x-3
            gap-y-2
            pt-4
            sm:pt-6
          "
        >
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <CanonTierBadge tier={story.canon_tier} size="sm" />

            <span
              className="
                rounded-full
                border
                px-2.5
                py-0.5
                text-xs
                font-medium
                sm:px-3
                sm:py-1
                sm:text-sm
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >
              {story.status}
            </span>

            {story.updated_at && (
              <span className="whitespace-nowrap text-xs opacity-55">
                Updated {updatedAgo(story.updated_at)}
              </span>
            )}
          </div>

          <span
            className="
              shrink-0
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
      </Card>
    );
}