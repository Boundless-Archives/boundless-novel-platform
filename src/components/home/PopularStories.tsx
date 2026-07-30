import Link from "next/link";
import Image from "next/image";
import { getPopularStories } from "@/lib/discover";
import StoryGrid from "@/components/story/StoryGrid";
import SectionHeader from "@/components/layout/SectionHeader";

export default async function PopularStories() {
  const stories = await getPopularStories();

  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">

      <SectionHeader
        title="Popular Stories"
        icon="⭐"
      />

      <StoryGrid
        stories={stories}
        variant="compact"
      />

    </section>
  );
}