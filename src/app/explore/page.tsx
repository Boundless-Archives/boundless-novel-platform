import Image from "next/image";
import Link from "next/link";

import { createClient } from "@/utils/supabase/server";

export default async function ExplorePage() {
  const supabase = await createClient();

  const { data: stories } = await supabase
    .from("stories")
    .select(`
      *,
      profiles (
        username,
        display_name
      ),
      story_stats (
        views,
        likes,
        library_adds,
        reviews,
        average_rating
      )
    `)
    .neq("status", "Draft")
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">

      <section className="mb-12">

        <h1 className="text-5xl font-bold">
          Explore
        </h1>

        <p
          className="
            mt-4
            max-w-3xl
            text-lg
            opacity-80
          "
        >
          Discover fresh adventures, hidden gems,
          and stories waiting to become your next
          obsession.
        </p>

      </section>

      {!stories?.length ? (

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

          <div className="text-6xl mb-5">
            📚
          </div>

          <h2 className="text-3xl font-bold">
            Nothing here yet
          </h2>

          <p className="mt-4 opacity-70">
            New stories will appear here soon.
          </p>

        </div>

      ) : (

        <div className="space-y-6">
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
          width={120}
          height={170}
          className="
            h-[170px]
            w-[120px]
            rounded-xl
            object-cover
            shrink-0
          "
        />

      )}

      <div className="flex flex-col flex-1">

        <h2
          className="
            text-2xl
            font-bold
            transition
            hover:text-blue-600
          "
        >
          {story.title}
        </h2>

        <p className="mt-2 text-sm opacity-80">

          by{" "}

          {story.profiles?.display_name ??
            story.profiles?.username}

        </p>

        <div className="mt-4">

          <span
            className="
              inline-block
              rounded-full
              border
              px-3
              py-1
              text-sm
            "
            style={{
              borderColor:
                "var(--card-border)",
            }}
          >
            {story.status}
          </span>

        </div>

        <p
          className="
            mt-5
            opacity-80
            line-clamp-3
          "
        >
          {story.description}
        </p>

        <div
          className="
            mt-auto
            pt-6
            flex
            flex-wrap
            items-center
            gap-5
            text-sm
            opacity-70
          "
        >

          {(stats?.views ?? 0) > 0 && (
            <span>👁 {stats.views}</span>
          )}

          {(stats?.likes ?? 0) > 0 && (
            <span>❤ {stats.likes}</span>
          )}

          {(stats?.library_adds ?? 0) > 0 && (
            <span>📚 {stats.library_adds}</span>
          )}

          {(stats?.reviews ?? 0) > 0 && (
            <span>💬 {stats.reviews}</span>
          )}

          {(stats?.average_rating ?? 0) > 0 && (
            <span>
              ⭐ {Number(
                stats.average_rating
              ).toFixed(1)}
            </span>
          )}

        </div>

      </div>

    </Link>

  );

})}

        </div>

      )}

    </main>
  );
}