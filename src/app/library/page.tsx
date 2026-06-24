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
        status
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", {
      ascending: false,
    });

  return (

  <main className="max-w-6xl mx-auto p-8">

```
<h1 className="text-5xl font-bold mb-10">
  My Library
</h1>

{!library?.length && (
  <div
    className="rounded-xl border p-8 text-center"
    style={{
      backgroundColor: "var(--card)",
      borderColor: "var(--card-border)",
    }}
  >
    <h2 className="text-2xl font-semibold">
      Your library is empty
    </h2>

    <p className="mt-3 opacity-80">
      Save stories to build your personal collection.
    </p>

    <Link
      href="/"
      className="
        inline-block
        mt-6
        border
        rounded-lg
        px-4
        py-2
      "
      style={{
        borderColor: "var(--card-border)",
      }}
    >
      Browse Stories
    </Link>
  </div>
)}

<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">

  {library?.map((entry) => (
    <div
      key={entry.id}
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

      {entry.stories.cover_url && (
        <img
          src={entry.stories.cover_url}
          alt={entry.stories.title}
          className="
            w-full
            rounded-lg
            mb-4
          "
        />
      )}

      <Link
        href={`/story/${entry.stories.slug}`}
        className="
          text-2xl
          font-bold
          hover:underline
        "
      >
        {entry.stories.title}
      </Link>

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
          {entry.stories.status}
        </span>
      </div>

      <p className="mt-4 opacity-90">
        {entry.stories.description}
      </p>

      <div className="mt-5">
        <Link
          href={`/story/${entry.stories.slug}`}
          className="
            inline-block
            border
            rounded-lg
            px-4
            py-2
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Read Story →
        </Link>
      </div>

    </div>
  ))}

</div>
```

  </main>
);
}