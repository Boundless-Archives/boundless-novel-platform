import StoryCard from "./StoryCard";

type StoryGridProps = {
  stories: any[];
  variant?: "default" | "compact" | "ranking";
};

export default function StoryGrid({
  stories,
  variant = "default",
}: StoryGridProps) {
  if (!stories?.length) {
    return (
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
        <div className="mb-5 text-6xl">
          📚
        </div>

        <h3 className="text-3xl font-bold">
          No stories found
        </h3>

        <p className="mt-4 opacity-70">
          There are no stories available yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {stories.map((story) => (
        <StoryCard
          key={story.id}
          story={story}
          variant={variant}
        />
      ))}
    </div>
  );
}