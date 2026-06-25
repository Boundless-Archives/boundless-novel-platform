import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SaveStoryButton from "@/components/SaveStoryButton";

type Props = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PublicStoryPage({
  params,
}: Props) {
  const { slug } = await params;

  const supabase = await createClient();

  const { data: story } = await supabase
    .from("stories")
    .select(`
      *,
      profiles (
        username,
        display_name
      )
    `)
    .eq("slug", slug)
    .single();

  if (!story) {
    notFound();
  }

  if (story.status === "Draft") {
    notFound();
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("*")
    .eq("story_id", story.id)
    .order("chapter_number");

  return (

  <main className="max-w-6xl mx-auto p-8">


<div
  className="rounded-xl border p-6"
  style={{
    backgroundColor: "var(--card)",
    borderColor: "var(--card-border)",
  }}
>
  <div className="flex flex-col md:flex-row gap-8">

    {story.cover_url && (
      <Image
        src={story.cover_url}
        alt={story.title}
        width={280}
        height={420}
        className="rounded-lg object-cover"
      />
    )}

    <div className="flex-1">

      <h1 className="text-5xl font-bold">
        {story.title}
      </h1>

      <p className="mt-3 opacity-80">
        By{" "}
        <Link
          href={`/author/${story.profiles?.username}`}
          className="underline"
        >
          {story.profiles?.display_name ??
            story.profiles?.username}
        </Link>
      </p>

      <div className="mt-5 flex flex-wrap gap-3">

        <span
          className="px-3 py-1 rounded-full border text-sm"
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          {story.status}
        </span>

        <span
          className="px-3 py-1 rounded-full border text-sm"
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          {chapters?.length ?? 0} Chapters
        </span>

      </div>

      <div className="mt-6 flex flex-wrap gap-3 items-center">
        <SaveStoryButton
          storyId={story.id}
        />

        {chapters?.[0] && (
          <Link
            href={`/chapter/${chapters[0].id}`}
            className="
              px-4
              py-2
              rounded-lg
              border
              font-medium
              transition
              hover:bg-black
              hover:text-white
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            Read First Chapter
          </Link>
        )}
      </div>

      <div
        className="mt-8 rounded-xl border p-5"
        style={{
          backgroundColor: "var(--background)",
          borderColor: "var(--card-border)",
        }}
      >
        <h2 className="text-xl font-semibold">
          Synopsis
        </h2>

        <p className="mt-3 leading-8 opacity-90">
          {story.description}
        </p>
      </div>

    </div>

  </div>
</div>

<div className="mt-10">
  <h2 className="text-3xl font-bold">
    Chapters
  </h2>

{!chapters?.length ? (
<div
className="
mt-6
rounded-xl
border
p-10
text-center
"
style={{
backgroundColor: "var(--card)",
borderColor: "var(--card-border)",
}}
> <div className="text-5xl mb-4">
✍️ </div>


  <h3 className="text-2xl font-semibold">
    Chapters coming soon
  </h3>

  <p className="mt-3 opacity-80">
    This story has not published any chapters yet.
  </p>
</div>


) : ( <div className="mt-6 space-y-3">
{chapters.map((chapter) => (
<Link
key={chapter.id}
href={`/chapter/${chapter.id}`}
className="
block
rounded-xl
border
p-4
transition
hover:shadow-md
"
style={{
backgroundColor: "var(--card)",
borderColor: "var(--card-border)",
}}
> <div className="flex items-center justify-between"> <div> <div className="font-semibold">
Chapter {chapter.chapter_number} </div>


          <div className="opacity-80">
            {chapter.title}
          </div>
        </div>

        <div className="text-sm opacity-70">
          Read →
        </div>
      </div>
    </Link>
  ))}
</div>
)}
</div>
  </main>
);
}