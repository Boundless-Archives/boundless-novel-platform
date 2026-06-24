import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function AuthorPage({
  params,
}: {
  params: Promise<{
    username: string;
  }>;
}) {
  const { username } = await params;

  const supabase =
    await createClient();

  const { data: profile } =
    await supabase
      .from("profiles")
      .select("*")
      .eq("username", username)
      .single();

  if (!profile) {
    notFound();
  }

  const { data: stories } =
    await supabase
      .from("stories")
      .select("*")
      .eq("author_id", profile.id)
      .neq("status", "Draft")
      .order("created_at", {
        ascending: false,
      });

  return (

  <main className="max-w-6xl mx-auto p-8">

```
<div
  className="rounded-xl border p-8 mb-10"
  style={{
    backgroundColor: "var(--card)",
    borderColor: "var(--card-border)",
  }}
>

  <div className="flex flex-col md:flex-row gap-8 items-start">

    <div>
      {profile.avatar_url ? (
        <Image
          src={profile.avatar_url}
          alt={profile.username}
          width={140}
          height={140}
          className="rounded-full"
        />
      ) : (
        <div
          className="
            w-[140px]
            h-[140px]
            rounded-full
            border
            flex
            items-center
            justify-center
            text-4xl
            font-bold
          "
          style={{
            borderColor:
              "var(--card-border)",
          }}
        >
          {(profile.display_name ??
            profile.username)
            .charAt(0)
            .toUpperCase()}
        </div>
      )}
    </div>

    <div className="flex-1">

      <h1 className="text-4xl font-bold">
        {profile.display_name ??
          profile.username}
      </h1>

      <p className="mt-2 opacity-70">
        @{profile.username}
      </p>

      <div className="mt-4">
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
            borderColor:
              "var(--card-border)",
          }}
        >
          Author
        </span>
      </div>

      <div className="mt-6">
        <h2 className="font-semibold text-lg">
          Bio
        </h2>

        <p className="mt-2 opacity-90">
          {profile.bio ||
            "This author hasn't added a bio yet."}
        </p>
      </div>

      <div className="mt-6 text-sm opacity-70">
        {stories?.length ?? 0} published
        stor{stories?.length === 1 ? "y" : "ies"}
      </div>

    </div>

  </div>

</div>

<h2 className="text-3xl font-bold mb-6">
  Stories
</h2>

{!stories?.length && (
  <div
    className="rounded-xl border p-8"
    style={{
      backgroundColor: "var(--card)",
      borderColor: "var(--card-border)",
    }}
  >
    No published stories yet.
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
        <Image
          src={story.cover_url}
          alt={story.title}
          width={300}
          height={450}
          className="
            rounded-lg
            mb-4
            w-full
            h-auto
          "
        />
      )}

      <Link
        href={`/story/${story.slug}`}
        className="
          text-2xl
          font-bold
          hover:underline
        "
      >
        {story.title}
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
            borderColor:
              "var(--card-border)",
          }}
        >
          {story.status}
        </span>
      </div>

      <p className="mt-4 opacity-90">
        {story.description}
      </p>

      <Link
        href={`/story/${story.slug}`}
        className="
          inline-block
          mt-5
          border
          rounded-lg
          px-4
          py-2
        "
        style={{
          borderColor:
            "var(--card-border)",
        }}
      >
        Read Story →
      </Link>

    </div>
  ))}

</div>
```

  </main>
);
}