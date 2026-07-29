import Link from "next/link";
import Image from "next/image";
import { getPopularStories } from "@/lib/discover";
import StoryGrid from "@/components/story/StoryGrid";

export default async function PopularStories() {
  const stories = await getPopularStories();

  if (stories.length === 0) {
    return null;
  }

  return (
    <section className="mb-16">

      <div className="flex items-center justify-between mb-8">

        <h2 className="text-3xl font-bold">
          ⭐ Popular Stories
        </h2> 
      </div>

      <StoryGrid
        stories={stories}
        variant="compact"
      />

    </section>
  );
}