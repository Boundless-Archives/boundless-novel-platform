import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

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
      </div>
    </main>
  );
}