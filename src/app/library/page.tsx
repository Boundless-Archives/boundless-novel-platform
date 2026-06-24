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
    <main className="p-10 max-w-5xl">
      <h1 className="text-4xl font-bold mb-8">
        My Library
      </h1>

      <div className="space-y-6">
        {library?.map((entry) => (
          <div
            key={entry.id}
            className="border rounded p-4"
          >
            <Link
              href={`/story/${entry.stories.slug}`}
              className="text-2xl font-semibold underline"
            >
              {entry.stories.title}
            </Link>

            <p className="mt-2">
              Status: {entry.stories.status}
            </p>

            <p className="mt-2">
              {entry.stories.description}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}