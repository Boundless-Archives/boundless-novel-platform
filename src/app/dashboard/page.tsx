import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  return (
    <main className="p-10">
      <h1 className="text-4xl font-bold">
        Dashboard
      </h1>

      <p className="mt-4">
        Logged in as:
      </p>

      <p className="font-semibold">
        {user.email}
      </p>

      <div className="mt-6">
      <Link
        href="/auth/logout"
        className="border rounded px-4 py-2"
      >
        Logout
      </Link>
      </div>
    </main>
  );
}