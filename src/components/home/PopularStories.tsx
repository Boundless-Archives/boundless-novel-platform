import Link from "next/link";
import Image from "next/image";

import { getPopularStories } from "@/lib/discover";

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

      <div className="grid gap-6 md:grid-cols-2">

        {stories.map((story: any) => {

          const stats = story.story_stats;

          return (

            <Link
              key={story.id}
              href={`/story/${story.slug}`}
              className="
                flex
                gap-5
                rounded-2xl
                border
                p-5
                transition
                hover:-translate-y-1
                hover:shadow-xl
              "
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--card-border)",
              }}
            >

              {story.cover_url && (

                <Image
                  src={story.cover_url}
                  alt={story.title}
                  width={95}
                  height={140}
                  className="
                    h-[140px]
                    w-[95px]
                    rounded-xl
                    object-cover
                    shrink-0
                  "
                />

              )}

              <div className="flex flex-col flex-1">

                <h3 className="text-2xl font-bold">
                  {story.title}
                </h3>

                <p className="mt-2 opacity-70">

                  by{" "}

                  {story.profiles?.display_name ??
                    story.profiles?.username ??
                    "Unknown"}

                </p>

                <div
                  className="
                    mt-auto
                    pt-5
                    flex
                    flex-wrap
                    gap-4
                    text-sm
                    opacity-70
                  "
                >

                  {(stats?.views ?? 0) > 0 && (
                    <span>👁 {stats.views}</span>
                  )}

                  {(stats?.library_adds ?? 0) > 0 && (
                    <span>📚 {stats.library_adds}</span>
                  )}

                </div>

              </div>

            </Link>

          );

        })}

      </div>

    </section>
  );
}