import { getPersonalizedRecommendations } from "../actions";

export default async function RecommendationsTestPage() {
  const recommendations =
    await getPersonalizedRecommendations(12);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <h1 className="text-3xl font-bold">
        Recommendation Test
      </h1>

      <p className="mt-2 opacity-60">
        {recommendations.length} recommendations found.
      </p>

      <div className="mt-8 space-y-4">
        {recommendations.map((story) => (
          <div
            key={story.id}
            className="rounded-2xl border p-5"
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            <h2 className="text-xl font-bold">
              {story.title}
            </h2>

            <p className="mt-1 text-sm opacity-60">
              {story.description || "No description"}
            </p>

            <p className="mt-3 text-xs opacity-50">
              Recommendation score:{" "}
              {story.recommendation_score.toFixed(2)}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}