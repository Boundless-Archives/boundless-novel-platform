import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import StoryAnalyticsCard from "@/components/story/StoryAnalyticsCard";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

export default async function StoryPage({
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

  /*
   * Determine the current user's role.
   */
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  const role = profile?.role ?? null;

  /*
   * Permission rules:
   *
   * Author:
   *   Can access their own stories.
   *
   * Editor:
   *   Can access stories belonging to authors assigned to them.
   *
   * Admin / Superadmin:
   *   Can access every story.
   */
  let canAccess = false;

  if (story.author_id === user.id) {
    canAccess = true;
  } else if (
    role === "admin" ||
    role === "superadmin"
  ) {
    canAccess = true;
  } else if (role === "editor") {
    const { data: assignment } = await supabase
      .from("editor_author_assignments")
      .select("id")
      .eq("editor_id", user.id)
      .eq("author_id", story.author_id)
      .maybeSingle();

    canAccess = !!assignment;
  }

  if (!canAccess) {
    redirect("/stories");
  }

  const { data: stats } = await supabase
    .from("story_stats")
    .select("*")
    .eq("story_id", story.id)
    .maybeSingle();

  const { count: publishedCount } = await supabase
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .eq("story_id", story.id)
    .eq("status", "Published");

  const { count: draftCount } = await supabase
    .from("chapters")
    .select("*", { count: "exact", head: true })
    .eq("story_id", story.id)
    .eq("status", "Draft");

  return (
    <main className="max-w-6xl mx-auto p-8">
      <div
        className="rounded-xl border p-8"
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
              width={300}
              height={450}
              className="rounded-lg"
            />
          )}

          <div className="flex-1">
            <h1 className="text-5xl font-bold">
              {story.title}
            </h1>

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
                {story.status}
              </span>
            </div>

            <Link
                
                href={`/stories/${story.id}/tier-submission`}
                className="
                  inline-block
                  mb-4
                  text-sm
                  underline
                  opacity-80
                "
              >
                Request a tier upgrade →
              </Link>

            <div className="mt-6">
              <h2 className="text-xl font-semibold">
                Description
              </h2>

              <p className="mt-3 opacity-90">
                {story.description ||
                  "No description provided."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3 mt-8">
              <Link
                href={`/stories/${story.id}/edit`}
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
                Edit Story
              </Link>

              <Link
                href={`/stories/${story.id}/chapters`}
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
                Manage Chapters
              </Link>

              <Link
                href={`/stories/${story.id}/chapters/new`}
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
                + Add Chapter
              </Link>
                         

              <Link
                href={`/story/${story.slug}`}
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
                View Public Story
              </Link>
            </div>
          </div>
        </div>
      </div>

      <StoryAnalyticsCard
        storyId={story.id}
        stats={stats}
        publishedCount={publishedCount ?? 0}
        draftCount={draftCount ?? 0}
      />
    </main>
  );
}