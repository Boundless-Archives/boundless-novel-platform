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
    <main className="p-10 max-w-4xl">
      {profile.avatar_url && (
        <Image
        src={profile.avatar_url}
        alt={profile.username}
        width={120}
        height={120}
        className="rounded-full mb-6"
        />
    )}
      <h1 className="text-4xl font-bold">
        {profile.display_name ??
          profile.username}
      </h1>

      <p className="mt-2 text-gray-600">
        @{profile.username}
      </p>

      {profile.bio && (
        <p className="mt-6">
          {profile.bio}
        </p>
      )}

      <h2 className="text-2xl font-semibold mt-10 mb-4">
        Stories
      </h2>

      <div className="space-y-4">
        {stories?.map((story) => (
          <div
            key={story.id}
            className="border rounded p-4"
          >
            <Link
              href={`/story/${story.slug}`}
              className="text-xl font-semibold underline"
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