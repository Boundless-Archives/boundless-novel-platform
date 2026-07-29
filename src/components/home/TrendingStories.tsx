import Link from "next/link";
import Image from "next/image";
import { getTrendingStories } from "@/lib/discover";
import StoryGrid from "@/components/story/StoryGrid";

export default async function TrendingStories() {
  const stories = await getTrendingStories();

  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">

      <div className="flex items-center justify-between mb-8">

        <h2 className="text-3xl font-bold">
          🔥 Trending Stories
        </h2>

        <Link
          href="/trending"
          className="opacity-70 hover:opacity-100 transition"
        >
          View All →
        </Link>

      </div>

      <StoryGrid
        stories={stories}
        variant="compact"
      />

    </section>
  );
}