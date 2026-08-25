import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function StoriesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_author, display_name, username")
    .eq("id", user.id)
    .single();

  if (!profile?.is_author) {
    redirect("/profile");
  }

  const { data: stories } = await supabase
    .from("stories")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  const storyIds = (stories ?? []).map((story) => story.id);

  const { data: statsRows } =
    storyIds.length > 0
      ? await supabase
          .from("story_stats")
          .select(
            `
              story_id,
              views,
              unique_readers,
              likes,
              library_adds,
              reviews,
              average_rating
            `
          )
          .in("story_id", storyIds)
      : { data: [] };

  const statsByStory = new Map(
    (statsRows ?? []).map((row) => [
      row.story_id,
      row,
    ])
  );

  const totalViews = (statsRows ?? []).reduce(
    (total, row) => total + (row.views ?? 0),
    0
  );

  const totalReaders = (statsRows ?? []).reduce(
    (total, row) =>
      total + (row.unique_readers ?? 0),
    0
  );

  const totalLikes = (statsRows ?? []).reduce(
    (total, row) => total + (row.likes ?? 0),
    0
  );

  const publishedStories =
    (stories ?? []).filter(
      (story) => story.status !== "Draft"
    ).length;

  const draftStories =
    (stories ?? []).filter(
      (story) => story.status === "Draft"
    ).length;

  const formatNumber = (value: number) => {
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }

    if (value >= 1_000) {
      return `${(value / 1_000).toFixed(1)}K`;
    }

    return value.toString();
  };

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">

      {/* Header */}

      <section className="mb-10">

        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">

          <div>
            <p className="text-sm opacity-60">
              Author Dashboard
            </p>

            <h1 className="mt-2 text-4xl md:text-5xl font-bold">
              Welcome back,{" "}
              {profile.display_name ??
                profile.username}
            </h1>

            <p className="mt-3 opacity-70 max-w-2xl">
              Manage your stories, track your
              audience, and keep your writing
              moving forward.
            </p>
          </div>

          <Link
            href="/stories/new"
            className="
              inline-flex
              items-center
              justify-center
              rounded-xl
              px-5
              py-3
              font-semibold
              border
              transition
              hover:-translate-y-0.5
              hover:shadow-lg
            "
            style={{
              borderColor: "var(--card-border)",
              backgroundColor: "var(--card)",
            }}
          >
            + Create New Story
          </Link>

        </div>

      </section>


      {/* Overview */}

      <section
        className="
          grid
          grid-cols-2
          lg:grid-cols-4
          gap-4
          mb-10
        "
      >

        <div
          className="rounded-2xl border p-6"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <p className="text-sm opacity-60">
            Stories
          </p>

          <p className="mt-2 text-3xl font-bold">
            {stories?.length ?? 0}
          </p>

          <p className="mt-1 text-xs opacity-50">
            {publishedStories} published ·{" "}
            {draftStories} drafts
          </p>
        </div>


        <div
          className="rounded-2xl border p-6"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <p className="text-sm opacity-60">
            Total Views
          </p>

          <p className="mt-2 text-3xl font-bold">
            {formatNumber(totalViews)}
          </p>

          <p className="mt-1 text-xs opacity-50">
            Across all stories
          </p>
        </div>


        <div
          className="rounded-2xl border p-6"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <p className="text-sm opacity-60">
            Readers
          </p>

          <p className="mt-2 text-3xl font-bold">
            {formatNumber(totalReaders)}
          </p>

          <p className="mt-1 text-xs opacity-50">
            Unique readers
          </p>
        </div>


        <div
          className="rounded-2xl border p-6"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <p className="text-sm opacity-60">
            Likes
          </p>

          <p className="mt-2 text-3xl font-bold">
            {formatNumber(totalLikes)}
          </p>

          <p className="mt-1 text-xs opacity-50">
            From your stories
          </p>
        </div>

      </section>


      {/* Quick Actions */}

      <section className="mb-10">

        <div className="flex items-center justify-between mb-4">

          <div>
            <h2 className="text-2xl font-bold">
              Quick Actions
            </h2>

            <p className="text-sm opacity-60 mt-1">
              Jump straight into your author tools.
            </p>
          </div>

        </div>


        <div
          className="
            grid
            grid-cols-1
            sm:grid-cols-2
            lg:grid-cols-5
            gap-4
          "
        >

          <Link
            href="/stories/new"
            className="
              rounded-2xl
              border
              p-5
              transition
              hover:-translate-y-1
              hover:shadow-lg
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="text-2xl">
              ✍️
            </div>

            <h3 className="mt-3 font-semibold">
              New Story
            </h3>

            <p className="mt-1 text-sm opacity-60">
              Start something new.
            </p>
          </Link>


          <Link
            href="/profile"
            className="
              rounded-2xl
              border
              p-5
              transition
              hover:-translate-y-1
              hover:shadow-lg
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="text-2xl">
              👤
            </div>

            <h3 className="mt-3 font-semibold">
              Author Profile
            </h3>

            <p className="mt-1 text-sm opacity-60">
              Update your public profile.
            </p>
          </Link>


          <Link
            href="/explore"
            className="
              rounded-2xl
              border
              p-5
              transition
              hover:-translate-y-1
              hover:shadow-lg
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="text-2xl">
              🔎
            </div>

            <h3 className="mt-3 font-semibold">
              Explore
            </h3>

            <p className="mt-1 text-sm opacity-60">
              See what readers are discovering.
            </p>
          </Link>


          <Link
            href="/library"
            className="
              rounded-2xl
              border
              p-5
              transition
              hover:-translate-y-1
              hover:shadow-lg
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="text-2xl">
              📚
            </div>

            <h3 className="mt-3 font-semibold">
              My Library
            </h3>

            <p className="mt-1 text-sm opacity-60">
              Browse saved stories.
            </p>
          </Link>

          <Link
            href="/author/series"
            className="
              rounded-2xl
              border
              p-5
              transition
              hover:-translate-y-1
              hover:shadow-lg
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <div className="text-2xl">
              📚
            </div>

            <h3 className="mt-3 font-semibold">
              Series
            </h3>

            <p className="mt-1 text-sm opacity-60">
              Organize connected stories into series.
            </p>
          </Link>

        </div>

      </section>


      {/* Stories */}

      <section>

        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">

          <div>
            <h2 className="text-2xl font-bold">
              Your Stories
            </h2>

            <p className="mt-1 text-sm opacity-60">
              Your latest writing projects.
            </p>
          </div>

          <span className="text-sm opacity-50">
            {stories?.length ?? 0} total
          </span>

        </div>


        {!stories?.length && (
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

            <div className="text-4xl">
              ✍️
            </div>

            <h3 className="mt-4 text-xl font-semibold">
              Your author journey starts here.
            </h3>

            <p className="mt-2 opacity-60 max-w-md mx-auto">
              Create your first story and begin
              building your audience.
            </p>

            <Link
              href="/stories/new"
              className="
                inline-flex
                mt-6
                rounded-xl
                border
                px-5
                py-3
                font-semibold
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            >
              Create Your First Story
            </Link>

          </div>
        )}


        {stories && stories.length > 0 && (
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              xl:grid-cols-3
              gap-6
            "
          >

            {stories.map((story) => {

              const stats =
                statsByStory.get(story.id);

              return (
                <div
                  key={story.id}
                  className="
                    overflow-hidden
                    rounded-2xl
                    border
                    transition
                    duration-200
                    hover:-translate-y-1
                    hover:shadow-xl
                  "
                  style={{
                    backgroundColor:
                      "var(--card)",
                    borderColor:
                      "var(--card-border)",
                  }}
                >

                  {story.cover_url ? (
                    <img
                      src={story.cover_url}
                      alt={story.title}
                      className="
                        w-full
                        h-64
                        object-cover
                      "
                    />
                  ) : (
                    <div
                      className="
                        w-full
                        h-64
                        flex
                        items-center
                        justify-center
                        text-5xl
                        opacity-30
                      "
                      style={{
                        backgroundColor:
                          "var(--background)",
                      }}
                    >
                      📖
                    </div>
                  )}


                  <div className="p-5">

                    <div className="flex items-start justify-between gap-3">

                      <h3 className="text-xl font-bold line-clamp-2">
                        {story.title}
                      </h3>

                      <span
                        className="
                          shrink-0
                          rounded-full
                          border
                          px-2.5
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


                    {story.description && (
                      <p className="mt-3 text-sm opacity-70 line-clamp-3">
                        {story.description}
                      </p>
                    )}


                    <div
                      className="
                        flex
                        flex-wrap
                        gap-x-4
                        gap-y-2
                        mt-5
                        text-xs
                        opacity-60
                      "
                    >

                      <span>
                        👁 {formatNumber(
                          stats?.views ?? 0
                        )}
                      </span>

                      <span>
                        ❤️ {formatNumber(
                          stats?.likes ?? 0
                        )}
                      </span>

                      <span>
                        📚 {formatNumber(
                          stats?.library_adds ?? 0
                        )}
                      </span>

                      {Number(
                        stats?.average_rating ?? 0
                      ) > 0 && (
                        <span>
                          ⭐{" "}
                          {Number(
                            stats?.average_rating
                          ).toFixed(1)}
                        </span>
                      )}

                    </div>


                    <div className="flex flex-wrap gap-2 mt-6">

                      <Link
                        href={`/stories/${story.id}`}
                        className="
                          rounded-lg
                          border
                          px-4
                          py-2
                          text-sm
                          font-medium
                          transition
                          hover:-translate-y-0.5
                        "
                        style={{
                          borderColor:
                            "var(--card-border)",
                        }}
                      >
                        Manage
                      </Link>

                      <Link
                        href={`/stories/${story.id}/edit`}
                        className="
                          rounded-lg
                          border
                          px-4
                          py-2
                          text-sm
                          transition
                          hover:-translate-y-0.5
                        "
                        style={{
                          borderColor:
                            "var(--card-border)",
                        }}
                      >
                        Edit
                      </Link>

                      <Link
                        href={`/stories/${story.id}/analytics`}
                        className="
                          rounded-lg
                          border
                          px-4
                          py-2
                          text-sm
                          transition
                          hover:-translate-y-0.5
                        "
                        style={{
                          borderColor:
                            "var(--card-border)",
                        }}
                      >
                        Analytics
                      </Link>

                    </div>

                  </div>

                </div>
              );
            })}

          </div>
        )}

      </section>

    </main>
  );
}