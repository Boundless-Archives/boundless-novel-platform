import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import DeleteSeriesButton from "./DeleteSeriesButton";
import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function SeriesManagementPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  /*
   * Load the series.
   */
  const { data: series } = await supabase
    .from("series")
    .select("*")
    .eq("id", id)
    .single();

  if (!series) {
    notFound();
  }

  /*
   * Only the series owner can manage it.
   */
  if (series.author_id !== user.id) {
    redirect("/author/series");
  }

  /*
   * Load stories currently inside this series.
   */
  const { data: seriesStoryRows } = await supabase
    .from("series_stories")
    .select("story_id, position")
    .eq("series_id", series.id)
    .order("position", {
      ascending: true,
    });

  const storyIds = (seriesStoryRows ?? []).map(
    (row) => row.story_id
  );

  /*
   * Load the actual stories.
   */
  const { data: seriesStories } =
    storyIds.length > 0
      ? await supabase
          .from("stories")
          .select(
            "id, title, slug, cover_url, status, description"
          )
          .in("id", storyIds)
      : { data: [] };

  /*
   * Preserve the position from series_stories.
   */
  const storiesById = new Map(
    (seriesStories ?? []).map((story) => [
      story.id,
      story,
    ])
  );

  const orderedStories = (seriesStoryRows ?? [])
    .map((row) => ({
      position: row.position,
      story: storiesById.get(row.story_id),
    }))
    .filter((item) => item.story);

  /*
   * Load all stories owned by this author.
   */
  const { data: authorStories } = await supabase
    .from("stories")
    .select(
      "id, title, slug, cover_url, status, description"
    )
    .eq("author_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  /*
   * Only show stories that aren't already
   * inside this series.
   */
  const availableStories = (authorStories ?? []).filter(
    (story) => !storyIds.includes(story.id)
  );

  /*
   * Add a story to the series.
   *
   * We use the current number of books + 1
   * as the next position.
   */
  async function addStoryToSeries(
    formData: FormData
  ) {
    "use server";

    const storyId = formData.get("storyId");

    if (
      typeof storyId !== "string" ||
      !storyId
    ) {
      return;
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/login");
    }

    const { data: currentSeries } =
      await supabase
        .from("series")
        .select("id, author_id")
        .eq("id", id)
        .single();

    if (!currentSeries) {
      return;
    }

    if (
      currentSeries.author_id !== user.id
    ) {
      redirect("/author/series");
    }

    /*
     * Make sure the story belongs to this author.
     */
    const { data: story } = await supabase
      .from("stories")
      .select("id")
      .eq("id", storyId)
      .eq("author_id", user.id)
      .single();

    if (!story) {
      return;
    }

    /*
     * Find the next position.
     */
    const { data: lastStory } =
      await supabase
        .from("series_stories")
        .select("position")
        .eq("series_id", id)
        .order("position", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    const nextPosition =
      (lastStory?.position ?? 0) + 1;

    /*
     * Insert the story into the series.
     */
    await supabase
      .from("series_stories")
      .insert({
        series_id: id,
        story_id: storyId,
        position: nextPosition,
      });

    redirect(`/author/series/${id}`);
  }

  /*
   * Remove a story from the series.
   */
  async function removeStoryFromSeries(
    formData: FormData
  ) {
    "use server";

    const storyId = formData.get("storyId");

    if (
      typeof storyId !== "string" ||
      !storyId
    ) {
      return;
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/login");
    }

    const { data: currentSeries } =
      await supabase
        .from("series")
        .select("id, author_id")
        .eq("id", id)
        .single();

    if (!currentSeries) {
      return;
    }

    if (
      currentSeries.author_id !== user.id
    ) {
      redirect("/author/series");
    }

    await supabase
      .from("series_stories")
      .delete()
      .eq("series_id", id)
      .eq("story_id", storyId);

    redirect(`/author/series/${id}`);
  }

  /*
   * Move a story up or down within the series.
   */
  async function moveStory(
    formData: FormData
  ) {
    "use server";

    const storyId = formData.get("storyId");
    const direction = formData.get("direction");

    if (
      typeof storyId !== "string" ||
      !storyId ||
      (direction !== "up" &&
        direction !== "down")
    ) {
      return;
    }

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/login");
    }

    /*
     * Verify series ownership.
     */
    const { data: currentSeries } =
      await supabase
        .from("series")
        .select("id, author_id")
        .eq("id", id)
        .single();

    if (!currentSeries) {
      return;
    }

    if (currentSeries.author_id !== user.id) {
      redirect("/author/series");
    }

    /*
     * Get all stories in their current order.
     */
    const { data: rows } =
      await supabase
        .from("series_stories")
        .select("story_id, position")
        .eq("series_id", id)
        .order("position", {
          ascending: true,
        });

    if (!rows || rows.length < 2) {
      redirect(`/author/series/${id}`);
    }

    const currentIndex = rows.findIndex(
      (row) => row.story_id === storyId
    );

    if (currentIndex === -1) {
      redirect(`/author/series/${id}`);
    }

    const targetIndex =
      direction === "up"
        ? currentIndex - 1
        : currentIndex + 1;

    /*
     * Already at the top/bottom.
     */
    if (
      targetIndex < 0 ||
      targetIndex >= rows.length
    ) {
      redirect(`/author/series/${id}`);
    }

    const currentRow = rows[currentIndex];
    const targetRow = rows[targetIndex];

    /*
     * Temporarily move the current story
     * to a position outside the normal range.
     *
     * This avoids violating:
     * UNIQUE(series_id, position)
     */
    const temporaryPosition =
      rows.length + 1000;

    const { error: tempError } =
      await supabase
        .from("series_stories")
        .update({
          position: temporaryPosition,
        })
        .eq("series_id", id)
        .eq("story_id", currentRow.story_id);

    if (tempError) {
      console.error(tempError);
      redirect(`/author/series/${id}`);
    }

    /*
     * Move the neighboring story into
     * the current story's old position.
     */
    const { error: targetError } =
      await supabase
        .from("series_stories")
        .update({
          position: currentRow.position,
        })
        .eq("series_id", id)
        .eq("story_id", targetRow.story_id);

    if (targetError) {
      console.error(targetError);

      /*
       * Attempt to restore the original position.
       */
      await supabase
        .from("series_stories")
        .update({
          position: currentRow.position,
        })
        .eq("series_id", id)
        .eq("story_id", currentRow.story_id);

      redirect(`/author/series/${id}`);
    }

    /*
     * Put the moved story into the neighbor's
     * former position.
     */
    const { error: finalError } =
      await supabase
        .from("series_stories")
        .update({
          position: targetRow.position,
        })
        .eq("series_id", id)
        .eq("story_id", currentRow.story_id);

    if (finalError) {
      console.error(finalError);
      redirect(`/author/series/${id}`);
    }

    redirect(`/author/series/${id}`);
  }

  /*
   * Delete the entire series.
   *
   * Stories are NOT deleted.
   * The series_stories rows are removed automatically
   * because series_id has ON DELETE CASCADE.
   */
  async function deleteSeries() {
    "use server";

    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      redirect("/auth/login");
    }

    const { data: currentSeries } =
      await supabase
        .from("series")
        .select("id, author_id, cover_url")
        .eq("id", id)
        .single();

    if (!currentSeries) {
      notFound();
    }

    if (currentSeries.author_id !== user.id) {
      redirect("/author/series");
    }

    /*
     * Delete the database record.
     *
     * series_stories rows cascade automatically.
     */
    const { error } = await supabase
      .from("series")
      .delete()
      .eq("id", id)
      .eq("author_id", user.id);

    if (error) {
      console.error(error);
      redirect(`/author/series/${id}`);
    }

    /*
     * Remove the series cover from storage.
     * This is cleanup only; failure here should not
     * recreate the deleted series.
     */
    if (currentSeries.cover_url) {
      const marker =
        "/storage/v1/object/public/Series-covers/";

      const index =
        currentSeries.cover_url.indexOf(marker);

      if (index !== -1) {
        const oldPath =
          currentSeries.cover_url.substring(
            index + marker.length
          );

        await supabase.storage
          .from("Series-covers")
          .remove([oldPath]);
      }
    }

    redirect("/author/series");
  }


  return (
    <main className="max-w-6xl mx-auto p-8">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/author/series"
          className="
            text-sm
            opacity-70
            hover:opacity-100
            transition
          "
        >
          ← Back to Series
        </Link>

        <div
          className="
            mt-6
            rounded-2xl
            border
            p-8
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <div className="flex flex-col md:flex-row gap-8">
            {series.cover_url ? (
              <Image
                src={series.cover_url}
                alt={series.title}
                width={220}
                height={220}
                className="
                  rounded-xl
                  w-[180px]
                  h-[180px]
                  object-cover
                "
              />
            ) : (
              <div
                className="
                  w-[180px]
                  h-[180px]
                  rounded-xl
                  border
                  flex
                  items-center
                  justify-center
                  text-5xl
                  font-bold
                  opacity-40
                "
                style={{
                  borderColor:
                    "var(--card-border)",
                }}
              >
                📚
              </div>
            )}

            <div className="flex-1">
              <h1 className="text-4xl font-bold">
                {series.title}
              </h1>

              <p className="mt-4 opacity-80 whitespace-pre-wrap">
                {series.description ||
                  "No description provided."}
              </p>

              <div className="flex flex-wrap gap-3 mt-6">
                <Link
                  href={`/author/series/${series.id}/edit`}
                  className="
                    border
                    rounded-lg
                    px-4
                    py-2
                    transition
                    hover:-translate-y-0.5
                  "
                  style={{
                    borderColor:
                      "var(--card-border)",
                  }}
                >
                  Edit Series
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Books in series */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-3xl font-bold">
              Books in this Series
            </h2>

            <p className="mt-1 opacity-70">
              Manage the order of your books.
            </p>
          </div>

          <span className="text-sm opacity-60">
            {orderedStories.length}{" "}
            {orderedStories.length === 1
              ? "Book"
              : "Books"}
          </span>
        </div>

        {!orderedStories.length && (
          <div
            className="
              rounded-2xl
              border
              p-10
              text-center
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor:
                "var(--card-border)",
            }}
          >
            <div className="text-5xl">
              📚
            </div>

            <h3 className="mt-4 text-xl font-semibold">
              No books yet
            </h3>

            <p className="mt-2 opacity-70">
              Add one of your stories below
              to start this series.
            </p>
          </div>
        )}

        {orderedStories.length > 0 && (
          <div className="space-y-4">
            {orderedStories.map(
              ({ position, story }) => (
                <div
                  key={story!.id}
                  className="
                    rounded-2xl
                    border
                    p-5
                    flex
                    flex-col
                    md:flex-row
                    gap-5
                    items-start
                    md:items-center
                  "
                  style={{
                    backgroundColor:
                      "var(--card)",
                    borderColor:
                      "var(--card-border)",
                  }}
                >
                  <div
                    className="
                      shrink-0
                      w-12
                      h-12
                      rounded-full
                      border
                      flex
                      items-center
                      justify-center
                      font-bold
                    "
                    style={{
                      borderColor:
                        "var(--card-border)",
                    }}
                  >
                    {position}
                  </div>

                  {story!.cover_url && (
                    <Image
                      src={story!.cover_url}
                      alt={story!.title}
                      width={80}
                      height={110}
                      className="
                        rounded-lg
                        w-20
                        h-28
                        object-cover
                      "
                    />
                  )}

                  <div className="flex-1">
                    <h3 className="text-xl font-bold">
                      {story!.title}
                    </h3>

                    <p className="mt-1 text-sm opacity-60">
                      Book {position}
                    </p>

                    <span
                      className="
                        inline-block
                        mt-3
                        px-3
                        py-1
                        rounded-full
                        border
                        text-xs
                      "
                      style={{
                        borderColor:
                          "var(--card-border)",
                      }}
                    >
                      {story!.status}
                    </span>
                  </div>

<div className="flex flex-wrap gap-2">
  {/* Move up */}
  <form action={moveStory}>
    <input
      type="hidden"
      name="storyId"
      value={story!.id}
    />

    <input
      type="hidden"
      name="direction"
      value="up"
    />

    <button
      type="submit"
      disabled={position === 1}
      className="
        border
        rounded-lg
        px-3
        py-2
        transition
        hover:-translate-y-0.5
        disabled:opacity-30
        disabled:cursor-not-allowed
      "
      style={{
        borderColor:
          "var(--card-border)",
      }}
      title="Move book up"
    >
      ↑
    </button>
  </form>

  {/* Move down */}
  <form action={moveStory}>
    <input
      type="hidden"
      name="storyId"
      value={story!.id}
    />

    <input
      type="hidden"
      name="direction"
      value="down"
    />

    <button
      type="submit"
      disabled={
        position === orderedStories.length
      }
      className="
        border
        rounded-lg
        px-3
        py-2
        transition
        hover:-translate-y-0.5
        disabled:opacity-30
        disabled:cursor-not-allowed
      "
      style={{
        borderColor:
          "var(--card-border)",
      }}
      title="Move book down"
    >
      ↓
    </button>
  </form>

  {/* Remove */}
  <form action={removeStoryFromSeries}>
    <input
      type="hidden"
      name="storyId"
      value={story!.id}
    />

    <button
      type="submit"
      className="
        border
        rounded-lg
        px-4
        py-2
        transition
        hover:-translate-y-0.5
      "
      style={{
        borderColor:
          "var(--card-border)",
      }}
    >
      Remove
    </button>
  </form>
</div>
                </div>
              )
            )}
          </div>
        )}
      </section>

      {/* Add books */}
      <section>
        <div className="mb-5">
          <h2 className="text-3xl font-bold">
            Add a Book
          </h2>

          <p className="mt-1 opacity-70">
            Choose one of your stories to add
            to this series.
          </p>
        </div>

        {!availableStories.length && (
          <div
            className="
              rounded-2xl
              border
              p-8
              text-center
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor:
                "var(--card-border)",
            }}
          >
            <p className="opacity-70">
              All of your stories are already
              in this series.
            </p>
          </div>
        )}

        {availableStories.length > 0 && (
          <div
            className="
              grid
              grid-cols-1
              md:grid-cols-2
              lg:grid-cols-3
              gap-5
            "
          >
            {availableStories.map((story) => (
              <div
                key={story.id}
                className="
                  rounded-2xl
                  border
                  p-5
                "
                style={{
                  backgroundColor:
                    "var(--card)",
                  borderColor:
                    "var(--card-border)",
                }}
              >
                {story.cover_url && (
                  <Image
                    src={story.cover_url}
                    alt={story.title}
                    width={300}
                    height={180}
                    className="
                      w-full
                      h-44
                      object-cover
                      rounded-xl
                      mb-4
                    "
                  />
                )}

                <h3 className="text-xl font-bold">
                  {story.title}
                </h3>

                <p className="mt-2 text-sm opacity-60">
                  {story.status}
                </p>

                <form
                  action={addStoryToSeries}
                  className="mt-5"
                >
                  <input
                    type="hidden"
                    name="storyId"
                    value={story.id}
                  />

                  <button
                    type="submit"
                    className="
                      w-full
                      border
                      rounded-lg
                      px-4
                      py-2
                      transition
                      hover:-translate-y-0.5
                    "
                    style={{
                      borderColor:
                        "var(--card-border)",
                    }}
                  >
                    + Add to Series
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
      
      {/* Danger zone */}
      <section className="mt-16">
        <div
          className="
            rounded-2xl
            border
            p-6
          "
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <h2 className="text-xl font-bold">
            Danger Zone
          </h2>

          <p className="mt-2 text-sm opacity-70">
            Deleting this series will remove the
            series itself and its book ordering.
            Your stories will not be deleted.
          </p>

          <div className="mt-5">
            <DeleteSeriesButton
              action={deleteSeries}
              seriesTitle={series.title}
            />
          </div>
        </div>
      </section>

    </main>
  );
}