type StoryStatsProps = {
  views?: number;
  likes?: number;
 libraryAdds?: number;
  reviews?: number;
  rating?: number;
};

export default function StoryStats({
  views = 0,
  likes = 0,
  libraryAdds = 0,
  reviews = 0,
  rating = 0,
}: StoryStatsProps) {
  const formatNumber = (value: number) => {
    if (value >= 1_000_000)
      return `${(value / 1_000_000).toFixed(1)}M`;

    if (value >= 1_000)
      return `${(value / 1_000).toFixed(1)}K`;

    return value.toString();
  };

  const items = [];

  if (reviews > 0) {
    items.push(
      <span key="rating">
        ⭐ {rating.toFixed(1)}
      </span>
    );
  }

  if (views > 0) {
    items.push(
      <span key="views">
        👁 {formatNumber(views)}
      </span>
    );
  }

  if (likes > 0) {
    items.push(
      <span key="likes">
        ❤ {formatNumber(likes)}
      </span>
    );
  }

  if (libraryAdds > 0) {
    items.push(
      <span key="library">
        📚 {formatNumber(libraryAdds)}
      </span>
    );
  }

  if (reviews > 0) {
    items.push(
      <span key="reviews">
        💬 {formatNumber(reviews)}
      </span>
    );
  }

  return (
    <div
      className="
        flex
        flex-wrap
        items-center
        gap-4
        text-sm
        opacity-75
      "
    >
      {items.length > 0 ? (
        items
      ) : (
        <span
          className="
            rounded-full
            border
            px-3
            py-1
            text-xs
            font-medium
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          🆕 New Release
        </span>
      )}
    </div>
  );
}