import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export default async function AuthorPage({
  params,
}: Props) {
  const { username } = await params;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("username", username)
    .single();

  if (!profile) {
    notFound();
  }

  return (
    <main className="p-10 max-w-3xl">
      <h1 className="text-4xl font-bold">
        {profile.display_name ||
          profile.username}
      </h1>

      <p className="mt-2 text-sm">
        @{profile.username}
      </p>

      <div className="mt-6">
        <p>
          {profile.bio ||
            "This author has not written a bio yet."}
        </p>
      </div>
    </main>
  );
}