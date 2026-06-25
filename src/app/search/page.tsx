import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
  }>;
}) {
  const { q } = await searchParams;

  const supabase = await createClient();

  let stories = [];

  if (q) {
    const { data } = await supabase
      .from("stories")
      .select("*")
      .neq("status", "Draft")
      .ilike("title", `%${q}%`)
      .order("created_at", {
        ascending: false,
      });

    stories = data ?? [];
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <h1 className="text-4xl font-bold mb-6">
        Search Stories
      </h1>

      <form className="mt-6">
        <input
          name="q"
          defaultValue={q}
          placeholder="🔍 Search stories..."
          className="
            w-full
            rounded-xl
            border
            px-5
            py-4
            text-lg
          "
          style={{
            borderColor: "var(--card-border)",
            backgroundColor: "var(--card)",
          }}
        />
      </form>

      {!q && (
  <div
    className="mt-10 rounded-2xl border p-12 text-center"
    style={{
      backgroundColor: "var(--card)",
      borderColor: "var(--card-border)",
    }}
  >
    <div className="text-5xl mb-4">
      🔍
    </div>

    <h2 className="text-2xl font-bold">
      Find your next favorite story
    </h2>

    <p className="mt-3 opacity-70">
      Search for novels, web serials, and authors.
    </p>
  </div>
)}

{q && stories.length === 0 && (
  <div
    className="mt-10 rounded-2xl border p-12 text-center"
    style={{
      backgroundColor: "var(--card)",
      borderColor: "var(--card-border)",
    }}
  >
    <div className="text-5xl mb-4">
      📭
    </div>

    <h2 className="text-2xl font-bold">
      No results found
    </h2>

    <p className="mt-3 opacity-70">
      We couldn't find any stories matching "{q}".
    </p>
  </div>
)}

      <div className="mt-8 space-y-4">
        {stories.map((story) => (
          <div
            key={story.id}
            className="
              rounded-xl
              border
              p-5
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
            <Link
              href={`/story/${story.slug}`}
              className="
                text-2xl
                font-bold
                hover:text-cyan-400
                transition
              "
            >
              {story.title}
            </Link>

            <p className="mt-2">
              {story.description}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}