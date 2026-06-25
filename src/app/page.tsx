import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();

  const { data: stories } = await supabase
    .from("stories")
    .select(`
      *,
      profiles (
        username,
        display_name
      )
    `)
    .neq("status", "Draft")
    .order("created_at", {
      ascending: false,
    });

  return (
    <main className="p-6 md:p-10 max-w-6xl mx-auto">
     
  <section
  className="
    text-center
    py-20
    px-6
    rounded-3xl
    mb-16
  "
  style={{
    background:
      "radial-gradient(circle at top, rgba(99,102,241,0.15), transparent 60%)",
  }}
>
  <div className="flex flex-col items-center">

    <div
      className="
        text-7xl
        font-bold
        mb-4
      "
    >
      ∞
    </div>

    <h1 className="text-6xl font-bold">
      Boundless
    </h1>

    <p
      className="
        mt-6
        text-xl
        opacity-80
        max-w-2xl
      "
    >
      Discover novels, web serials,
      and original stories from
      writers around the world.
    </p>

    <form
      action="/search"
      className="
        mt-8
        w-full
        max-w-2xl
      "
    >
      <input
        name="q"
        placeholder="🔍 Search stories and authors..."
        className="
          w-full
          rounded-xl
          border
          px-5
          py-4
          text-lg
        "
        style={{
          borderColor:
            "var(--card-border)",
          backgroundColor:
            "var(--card)",
        }}
      />
    </form>

    <div
      className="
        mt-8
        flex
        flex-wrap
        justify-center
        gap-6
        text-sm
        opacity-70
      "
    >
      <span>📚 Original Stories</span>
      <span>✍️ Community Authors</span>
      <span>🔍 Search & Discover</span>
      <span>❤️ Personal Library</span>
    </div>

  </div>
</section>

<h2 className="text-3xl font-bold mb-6">
  Latest Stories
</h2>

{!stories?.length ? (

  <div
    className="
      rounded-xl
      border
      p-10
      text-center
    "
    style={{
      backgroundColor: "var(--card)",
      borderColor: "var(--card-border)",
    }}
  >
    <div className="text-5xl mb-4">
      📚
    </div>

```
<h3 className="text-2xl font-semibold">
  No stories yet
</h3>

<p className="mt-3 opacity-80">
  The Boundless library is waiting for its first story.
</p>
```

  </div>
) : (
  <div className="mt-10 grid gap-6 md:grid-cols-2">
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
        {story.cover_url && (
          <Image
            src={story.cover_url}
            alt={story.title}
            width={220}
            height={330}
            className="
              rounded-lg
              mb-4
              object-cover
              w-full
              h-auto
            "
          />
        )}

```
    <Link
      href={`/story/${story.slug}`}
      className="
        text-2xl
        font-bold
        hover:text-blue-600
        transition
      "
    >
      {story.title}
    </Link>

    <p className="mt-2 text-sm opacity-80">
      By{" "}
      <Link
        href={`/author/${story.profiles?.username}`}
        className="underline"
      >
        {story.profiles?.display_name ??
          story.profiles?.username}
      </Link>
    </p>

    <div className="mt-3">
      <span
        className="
          inline-block
          px-3
          py-1
          text-sm
          rounded-full
          border
        "
        style={{
          borderColor: "var(--card-border)",
        }}
      >
        {story.status}
      </span>
    </div>

    <p className="mt-4 opacity-90">
      {story.description}
    </p>

    <div className="mt-4">
      <Link
        href={`/story/${story.slug}`}
        className="
          inline-block
          px-4
          py-2
          rounded-lg
          border
          hover:bg-black
          hover:text-white
          transition
        "
        style={{
          borderColor: "var(--card-border)",
        }}
      >
        Read Story
      </Link>
    </div>
  </div>
))}
```

  </div>
)}
    </main>
  );
}