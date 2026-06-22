import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import Link from "next/link";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold">
        My Profile
      </h1>

      <div className="mt-6 space-y-2">
        <p>
          <strong>Username:</strong>{" "}
          {profile?.username ?? "-"}
        </p>

        <p>
          <strong>Display Name:</strong>{" "}
          {profile?.display_name ?? "-"}
        </p>

        <p>
          <strong>Bio:</strong>{" "}
          {profile?.bio ?? "-"}
        </p>

        <p>
          <strong>Status:</strong>{" "}
          {profile?.is_author ? "Author" : "Reader"}
        </p>
      </div>

      <div className="mt-6">
        {profile?.is_author && (
          <Link
            href="/stories"
            className="border rounded px-4 py-2"
          >
            Manage Stories
          </Link>
        )}
      </div>

      <div className="mt-6">
        {!profile?.is_author && (
      <Link
        href="/profile/become-author"
        className="border rounded px-4 py-2"
      >
        Become an Author
      </Link>
      )}
      </div>
    </main>
  );
}