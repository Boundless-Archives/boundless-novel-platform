import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ChaptersPage({
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

  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (!story) {
    notFound();
  }

  if (story.author_id !== user.id) {
    redirect("/stories");
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", id)
    .order("chapter_number");

  return (

  <main className="max-w-6xl mx-auto p-8">

<div className="flex items-center justify-between mb-8">

  <div>
    <h1 className="text-5xl font-bold">
      {story.title}
    </h1>

    <p className="mt-2 opacity-70">
      Manage Chapters
    </p>
  </div>

  <Link
    href={`/stories/${id}/chapters/new`}
    className="
      border
      rounded-lg
      px-5
      py-3
      font-medium
    "
    style={{
      borderColor: "var(--card-border)",
    }}
  >
    + Create Chapter
  </Link>

</div>

<div className="mb-8 opacity-70">
  📖 {chapters?.length ?? 0} chapter
  {(chapters?.length ?? 0) === 1 ? "" : "s"}
</div>

{!chapters?.length && (
  <div
    className="rounded-2xl border p-12 text-center"
    style={{
      backgroundColor: "var(--card)",
      borderColor: "var(--card-border)",
    }}
  >
    <div className="text-6xl mb-4">
      ✍️
    </div>

    <h2 className="text-3xl font-bold">
      Your story begins here
    </h2>

    <p className="mt-4 opacity-70 max-w-md mx-auto">
      Every great story starts with a first chapter.
      Create Chapter 1 and begin building your world.
    </p>

    <Link
      href={`/stories/${id}/chapters/new`}
      className="
        inline-block
        mt-8
        rounded-xl
        px-6
        py-3
        font-medium
        border
      "
      style={{
        borderColor: "var(--card-border)",
      }}
    >
      Create First Chapter
    </Link>
  </div>
)}

<div className="space-y-4">

  {chapters?.map((chapter) => (
    <div
      key={chapter.id}
      className="
        rounded-xl
        border
        p-5
        flex
        items-center
        justify-between
      "
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >

      <div>

        <div className="text-sm opacity-70">
          Chapter {chapter.chapter_number}
        </div>

        <h2 className="text-xl font-semibold mt-1">
          {chapter.title}
        </h2>

      </div>

      <div className="flex gap-3">

        <Link
          href={`/chapter/${chapter.id}`}
          className="
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
          Preview
        </Link>

        <Link
          href={`/stories/${id}/chapters/${chapter.id}/edit`}
          className="
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
          Edit
        </Link>

      </div>

    </div>
  ))}

</div>

<div className="mt-10">

  <Link
    href={`/stories/${id}`}
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
    ← Back to Story Dashboard
  </Link>

</div>

  </main>
);
}