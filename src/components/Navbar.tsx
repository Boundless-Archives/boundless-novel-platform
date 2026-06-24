import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAuthor = false;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_author")
      .eq("id", user.id)
      .single();

    isAuthor = profile?.is_author ?? false;
  }

  return (
    <header className="border-b">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

        <Link
          href="/"
          className="text-2xl font-bold"
        >
          Boundless
        </Link>

        <nav className="flex items-center gap-6">

          <Link href="/">
            Home
          </Link>

          {user && (
            <>
              <Link href="/library">
                Library
              </Link>

              <Link href="/profile">
                Profile
              </Link>
            </>
          )}

          {isAuthor && (
            <Link href="/stories">
              Manage Stories
            </Link>
          )}

          {!user ? (
            <>
              <Link href="/auth/login">
                Login
              </Link>

              <Link href="/auth/sign-up">
                Sign Up
              </Link>
            </>
          ) : (
            <Link href="/auth/logout">
              Logout
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}