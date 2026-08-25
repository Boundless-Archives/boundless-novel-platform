import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

export default async function AuthorSeriesPage() {
const supabase = await createClient();

const {
data: { user },
} = await supabase.auth.getUser();

if (!user) {
redirect("/auth/login");
}

const { data: profile } = await supabase
.from("profiles")
.select("is_author")
.eq("id", user.id)
.single();

if (!profile?.is_author) {
redirect("/profile");
}

const { data: series } = await supabase
.from("series")
.select("*")
.eq("author_id", user.id)
.order("created_at", {
ascending: false,
});

const seriesIds = (series ?? []).map(
(item) => item.id
);

const { data: seriesStories } =
seriesIds.length > 0
? await supabase
.from("series_stories")
.select("series_id, story_id")
.in("series_id", seriesIds)
: { data: [] };

const storyCounts = new Map<string, number>();

for (const item of seriesStories ?? []) {
storyCounts.set(
item.series_id,
(storyCounts.get(item.series_id) ?? 0) + 1
);
}

return ( <main className="max-w-6xl mx-auto p-8">

  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">

    <div>
      <h1 className="text-4xl font-bold">
        Series
      </h1>

      <p className="mt-2 opacity-70">
        Organize your stories into connected
        book series.
      </p>
    </div>

    <Link
      href="/author/series/new"
      className="
        inline-flex
        items-center
        justify-center
        rounded-xl
        border
        px-5
        py-3
        font-medium
        transition
        hover:-translate-y-0.5
        hover:shadow-md
      "
      style={{
        borderColor: "var(--card-border)",
      }}
    >
      + Create Series
    </Link>

  </div>

  {!series?.length && (
    <div
      className="
        rounded-2xl
        border
        p-10
        text-center
      "
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >

      <h2 className="text-2xl font-semibold">
        You don't have any series yet
      </h2>

      <p className="mt-3 opacity-70">
        If you have multiple connected stories,
        you can group them into a series and
        arrange them in reading order.
      </p>

      <Link
        href="/author/series/new"
        className="
          inline-flex
          mt-6
          rounded-xl
          border
          px-5
          py-3
          transition
          hover:-translate-y-0.5
          hover:shadow-md
        "
        style={{
          borderColor: "var(--card-border)",
        }}
      >
        Create Your First Series
      </Link>

    </div>
  )}

  {series && series.length > 0 && (
    <div
      className="
        grid
        grid-cols-1
        md:grid-cols-2
        lg:grid-cols-3
        gap-6
      "
    >

      {series.map((item) => (
        <div
          key={item.id}
          className="
            rounded-2xl
            border
            overflow-hidden
            transition
            duration-200
            hover:-translate-y-1
            hover:shadow-lg
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >

          {item.cover_url ? (
            <Image
              src={item.cover_url}
              alt={item.title}
              width={600}
              height={300}
              className="
                w-full
                h-56
                object-cover
              "
            />
          ) : (
            <div
              className="
                w-full
                h-56
                flex
                items-center
                justify-center
                text-5xl
                font-bold
              "
              style={{
                backgroundColor:
                  "var(--background)",
              }}
            >
              {item.title
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div className="p-6">

            <h2 className="text-2xl font-bold">
              {item.title}
            </h2>

            <p className="mt-2 text-sm opacity-60">
              {storyCounts.get(item.id) ?? 0}{" "}
              {(storyCounts.get(item.id) ?? 0) === 1
                ? "book"
                : "books"}
            </p>

            <p className="mt-4 opacity-80 line-clamp-3">
              {item.description ||
                "No description provided."}
            </p>

            <div className="mt-6 flex gap-3">

              <Link
                href={`/author/series/${item.id}`}
                className="
                  inline-flex
                  rounded-lg
                  border
                  px-4
                  py-2
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                "
                style={{
                  borderColor:
                    "var(--card-border)",
                }}
              >
                Manage
              </Link>

              <Link
                href={`/author/series/${item.id}/edit`}
                className="
                  inline-flex
                  rounded-lg
                  border
                  px-4
                  py-2
                  transition
                  hover:-translate-y-0.5
                  hover:shadow-md
                "
                style={{
                  borderColor:
                    "var(--card-border)",
                }}
              >
                Edit
              </Link>

            </div>

          </div>

        </div>
      ))}

    </div>
  )}

</main>

);
}
