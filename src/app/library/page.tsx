import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function LibraryPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: library } = await supabase
    .from("library")
    .select(`
      *,
      stories (
        id,
        title,
        slug,
        description,
        cover_url,
        status
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  const { data: readingHistory } =
    await supabase
      .from("reading_history")
      .select(`
        *,
        stories (
          id,
          title,
          slug,
          cover_url
        ),
        chapters (
          id,
          chapter_number,
          title
        )
      `)
      .eq("user_id", user.id)
      .order("last_read_at", {
        ascending: false,
      })
      .limit(1);

  const continueReading =
    readingHistory?.[0] ?? null;

  const stats = {
    saved: library?.length ?? 0,

    ongoing:
      library?.filter(
        (entry) =>
          entry.stories?.status === "Ongoing"
      ).length ?? 0,

    completed:
      library?.filter(
        (entry) =>
          entry.stories?.status === "Completed"
      ).length ?? 0,
  };

  return (
    <main className="max-w-7xl mx-auto px-5 py-10">

      <div className="flex items-center justify-between mb-10">

        <div>

          <h1 className="text-5xl font-bold">
            My Library
          </h1>

          <p className="opacity-70 mt-2">
            Your personal reading collection.
          </p>

        </div>

      </div>

      <div className="grid gap-8 lg:grid-cols-3">

        <section
          className="lg:col-span-2 rounded-2xl border p-8"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >

          <h2 className="text-3xl font-bold">
            Continue Reading
          </h2>

          {continueReading ? (

            <div className="mt-8 flex flex-col md:flex-row gap-6">
                            {continueReading.stories?.cover_url && (
                <img
                  src={continueReading.stories.cover_url}
                  alt={continueReading.stories.title}
                  className="
                    w-40
                    rounded-xl
                    object-cover
                  "
                />
              )}

              <div className="flex-1">

                <h3 className="text-3xl font-bold">
                  {continueReading.stories?.title}
                </h3>

                <p className="mt-3 opacity-75">
                  Chapter {continueReading.chapters?.chapter_number}
                </p>

                <p className="mt-1 text-lg">
                  {continueReading.chapters?.title}
                </p>

                <Link
                  href={`/chapter/${continueReading.chapter_id}`}
                  className="
                    inline-block
                    mt-8
                    rounded-xl
                    px-5
                    py-3
                    font-semibold
                    transition
                  "
                  style={{
                    backgroundColor: "var(--button)",
                    color: "var(--button-text)",
                  }}
                >
                  Continue Reading →
                </Link>

              </div>

            </div>

          ) : (

            <div
              className="
                mt-8
                rounded-xl
                border
                p-10
                text-center
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            >

              <div className="text-6xl mb-5">
                📖
              </div>

              <h3 className="text-2xl font-bold">
                Nothing to continue
              </h3>

              <p className="mt-3 opacity-70">
                Start reading any story and it
                will appear here.
              </p>

            </div>

          )}

        </section>

        <aside
          className="rounded-2xl border p-8"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >

          <h2 className="text-2xl font-bold">
            Reading Stats
          </h2>

          <div className="mt-8 space-y-6">

            <div className="flex justify-between">

              <span className="opacity-75">
                Saved Stories
              </span>

              <strong className="text-2xl">
                {stats.saved}
              </strong>

            </div>

            <div className="flex justify-between">

              <span className="opacity-75">
                Currently Reading
              </span>

              <strong className="text-2xl">
                {stats.ongoing}
              </strong>

            </div>

            <div className="flex justify-between">

              <span className="opacity-75">
                Completed
              </span>

              <strong className="text-2xl">
                {stats.completed}
              </strong>

            </div>

          </div>

        </aside>

      </div>

      <section className="mt-16">

        <div className="flex items-center justify-between mb-8">

          <h2 className="text-3xl font-bold">
            Saved Stories
          </h2>

          <span className="opacity-70">
            {stats.saved} saved
          </span>

        </div>

        {!library?.length ? (

          <div
            className="
              rounded-2xl
              border
              p-14
              text-center
            "
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >

            <div className="text-6xl mb-6">
              📚
            </div>

            <h3 className="text-3xl font-bold">
              Your Library is Empty
            </h3>

            <p className="mt-4 opacity-75">
              Save stories you love and they'll
              appear here.
            </p>

            <Link
              href="/"
              className="
                inline-block
                mt-8
                rounded-xl
                border
                px-5
                py-3
              "
              style={{
                borderColor: "var(--card-border)",
              }}
            >
              Browse Stories
            </Link>

          </div>

        ) : (

          <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                        {library.map((entry) => (

              <article
                key={entry.id}
                className="
                  rounded-2xl
                  border
                  overflow-hidden
                  transition
                  duration-200
                  hover:-translate-y-1
                  hover:shadow-xl
                "
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                }}
              >

                {entry.stories?.cover_url && (
                  <img
                    src={entry.stories.cover_url}
                    alt={entry.stories.title}
                    className="
                      w-full
                      aspect-[2/3]
                      object-cover
                    "
                  />
                )}

                <div className="p-6">

                  <Link
                    href={`/story/${entry.stories?.slug}`}
                    className="
                      text-2xl
                      font-bold
                      hover:text-cyan-500
                      transition
                    "
                  >
                    {entry.stories?.title}
                  </Link>

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
                      {entry.stories?.status}
                    </span>

                  </div>

                  <p
                    className="
                      mt-5
                      opacity-80
                      line-clamp-4
                    "
                  >
                    {entry.stories?.description}
                  </p>

                  <Link
                    href={`/story/${entry.stories?.slug}`}
                    className="
                      inline-block
                      mt-8
                      rounded-xl
                      border
                      px-5
                      py-3
                      transition
                      hover:bg-black
                      hover:text-white
                    "
                    style={{
                      borderColor:
                        "var(--card-border)",
                    }}
                  >
                    Open Story →
                  </Link>

                </div>

              </article>

            ))}

          </div>

        )}

      </section>

    </main>

  );
}
