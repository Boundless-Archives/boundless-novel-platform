import Link from "next/link";
import Image from "next/image";
import { getTrendingStories } from "@/lib/discover";
import StoryGrid from "@/components/story/StoryGrid";
import SectionHeader from "@/components/layout/SectionHeader";

export default async function TrendingStories() {
  const stories = await getTrendingStories();

  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">

      <SectionHeader
        title="Trending Stories"
        icon="🔥"
        actionLabel="View All"
        actionHref="/trending"
      />

      <StoryGrid
        stories={stories}
        variant="compact"
      />

    </section>
  );
}