import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";
import { getPersonalizedRecommendations } from "./actions";

export default async function RecommendationsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const recommendations =
    await getPersonalizedRecommendations(12);

  return (
    <main className="mx-auto max-w-6xl px-5 py-10">

      <div>
        <h1 className="text-4xl font-bold">
          Recommended For You
        </h1>

        <p className="mt-2 opacity-60">
          Stories selected based on your reading
          and library activity.
        </p>
      </div>

      {recommendations.length === 0 ? (
        <section
          className="
            mt-10
            rounded-2xl
            border
            p-10
            text-center
          "
          style={{
            borderColor: "var(--card-border)",
            backgroundColor: "var(--card)",
          }}
        >
          <div className="text-5xl">
            📚
          </div>

          <h2 className="mt-4 text-2xl font-bold">
            We need a little more activity
          </h2>

          <p className="mx-auto mt-2 max-w-md opacity-60">
            Read some stories or add books to your
            library and we'll start learning what
            you like.
          </p>

          <Link
            href="/"
            className="
              mt-6
              inline-block
              rounded-xl
              px-5
              py-3
              font-semibold
            "
            style={{
              backgroundColor: "var(--button)",
              color: "var(--button-text)",
            }}
          >
            Browse Stories
          </Link>
        </section>
      ) : (
        <section
          className="
            mt-10
            grid
            grid-cols-1
            gap-6
            sm:grid-cols-2
            lg:grid-cols-3
            xl:grid-cols-4
          "
        >
          {recommendations.map((story) => (
            <Link
              key={story.id}
              href={`/story/${story.slug}`}
              className="
                group
                overflow-hidden
                rounded-2xl
                border
                transition
                hover:-translate-y-1
              "
              style={{
                borderColor: "var(--card-border)",
                backgroundColor: "var(--card)",
              }}
            >
              {story.cover_url ? (
                <Image
                  src={story.cover_url}
                  alt={story.title}
                  width={400}
                  height={520}
                  className="
                    h-64
                    w-full
                    object-cover
                    transition
                    duration-300
                    group-hover:scale-[1.02]
                  "
                />
              ) : (
                <div
                  className="
                    flex
                    h-64
                    w-full
                    items-center
                    justify-center
                    text-5xl
                    opacity-30
                  "
                >
                  📖
                </div>
              )}

              <div className="p-5">

                <h2 className="line-clamp-2 text-xl font-bold">
                  {story.title}
                </h2>

                {story.description && (
                  <p className="mt-2 line-clamp-3 text-sm opacity-60">
                    {story.description}
                  </p>
                )}

                <div className="mt-4">
                  <span
                    className="
                      inline-block
                      rounded-full
                      border
                      px-3
                      py-1
                      text-xs
                    "
                    style={{
                      borderColor:
                        "var(--card-border)",
                    }}
                  >
                    {story.status}
                  </span>
                </div>

              </div>
            </Link>
          ))}
        </section>
      )}

    </main>
  );
}