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
    .select("is_author")
    .eq("id", user.id)
    .single();

  if (!profile?.is_author) {
    redirect("/profile");
  }

  const { data: stories } = await supabase
    .from("stories")
    .select("*")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false });

  return (

  <main className="max-w-6xl mx-auto p-8">

```
<div className="flex items-center justify-between mb-8">

  <div>
    <h1 className="text-5xl font-bold">
      My Stories
    </h1>

    <p className="mt-2 opacity-70">
      Manage your stories and chapters.
    </p>
  </div>

  <Link
    href="/stories/new"
    className="
      border
      rounded-lg
      px-5
      py-3
      font-medium
      transition
      hover:shadow-md
    "
    style={{
      borderColor: "var(--card-border)",
    }}
  >
    + Create New Story
  </Link>

</div>

{!stories?.length && (
  <div
    className="rounded-xl border p-10 text-center"
    style={{
      backgroundColor: "var(--card)",
      borderColor: "var(--card-border)",
    }}
  >
    <h2 className="text-2xl font-semibold">
      No stories yet
    </h2>

    <p className="mt-3 opacity-70">
      Create your first story and start
      publishing chapters.
    </p>

    <Link
      href="/stories/new"
      className="
        inline-block
        mt-6
        border
        rounded-lg
        px-5
        py-3
      "
      style={{
        borderColor: "var(--card-border)",
      }}
    >
      Create Story
    </Link>
  </div>
)}

<div className="grid gap-6 md:grid-cols-2">

  {stories?.map((story) => (
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
        <img
          src={story.cover_url}
          alt={story.title}
          className="
            w-full
            h-72
            object-cover
            rounded-lg
            mb-4
          "
        />
      )}

      <h2 className="text-2xl font-bold">
        {story.title}
      </h2>

      <div className="mt-3">
        <span
          className="
            inline-block
            px-3
            py-1
            rounded-full
            border
            text-sm
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          {story.status}
        </span>
      </div>

      {story.description && (
        <p className="mt-4 opacity-90 line-clamp-3">
          {story.description}
        </p>
      )}

      <div className="flex gap-3 mt-6">

        <Link
          href={`/stories/${story.id}`}
          className="
            border
            rounded-lg
            px-4
            py-2
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Manage
        </Link>

        <Link
          href={`/stories/${story.id}/edit`}
          className="
            border
            rounded-lg
            px-4
            py-2
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Edit
        </Link>

      </div>

    </div>
  ))}

</div>
```

  </main>
);
}