type Props = {
  storyId: string;

  stats: {
    views: number;
    unique_readers: number;
    likes: number;
    library_adds: number;
    reviews: number;
    average_rating: number;
    reading_sessions: number;
    chapters_read: number;
    last_activity_at: string | null;
  } | null;

  publishedCount: number;
  draftCount: number;
};

export default function StoryAnalyticsCard({
  storyId,
  stats,
  publishedCount,
  draftCount,
}: Props) {
  const analytics = stats ?? {
    views: 0,
    unique_readers: 0,
    likes: 0,
    library_adds: 0,
    reviews: 0,
    average_rating: 0,
    reading_sessions: 0,
    chapters_read: 0,
    last_activity_at: null,
  };

  return (
    <section
      className="rounded-2xl border p-6 mt-8"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">
            Story Analytics
          </h2>

          <p className="mt-1 text-sm opacity-65">
            A quick look at how your story is performing.
          </p>
        </div>

        <a
          href={`/stories/${storyId}/analytics`}
          className="
            inline-flex
            items-center
            justify-center
            rounded-lg
            border
            px-4
            py-2
            text-sm
            font-medium
            transition
            hover:-translate-y-0.5
            hover:shadow-md
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          View Analytics →
        </a>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs opacity-60">
            Views
          </p>

          <p className="mt-1 text-2xl font-bold">
            {analytics.views}
          </p>
        </div>

        <div>
          <p className="text-xs opacity-60">
            Readers
          </p>

          <p className="mt-1 text-2xl font-bold">
            {analytics.unique_readers}
          </p>
        </div>

        <div>
          <p className="text-xs opacity-60">
            Likes
          </p>

          <p className="mt-1 text-2xl font-bold">
            {analytics.likes}
          </p>
        </div>

        <div>
          <p className="text-xs opacity-60">
            Rating
          </p>

          <p className="mt-1 text-2xl font-bold">
            {analytics.reviews > 0
              ? `⭐ ${Number(
                  analytics.average_rating
                ).toFixed(1)}`
              : "—"}
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm opacity-65">
        <span>
          📖 {publishedCount} published
        </span>

        {draftCount > 0 && (
          <span>
            📝 {draftCount} draft
            {draftCount === 1 ? "" : "s"}
          </span>
        )}

        <span>
          💬 {analytics.reviews} review
          {analytics.reviews === 1 ? "" : "s"}
        </span>
      </div>
    </section>
  );
}