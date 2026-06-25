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
<header
className="sticky top-0 z-50 backdrop-blur border-b"
style={{
backgroundColor: "rgba(255,255,255,0.75)",
borderColor: "var(--card-border)",
}}
> <div
    className="
      max-w-6xl
      mx-auto
      px-4
      py-4
      flex
      flex-col
      gap-4
      md:flex-row
      md:items-center
      md:justify-between
    "
  >

    <Link
      href="/"
      className="
        flex
        items-center
        gap-2
        text-2xl
        font-bold
      "
    >
      <span className="text-3xl">
        ∞
      </span>

      <span>
        Boundless
      </span>
    </Link>
    <nav
      className="
        flex
        flex-wrap
        gap-4
        md:gap-6
      " 
    >

      <Link
        href="/"
        className="hover:opacity-70 transition"
      >
        Home
      </Link>

      {user && (
        <>
          <Link
            href="/library"
            className="hover:opacity-70 transition"
          >
            Library
          </Link>

          <Link
            href="/profile"
            className="hover:opacity-70 transition"
          >
            Profile
          </Link>
        </>
      )}

      {isAuthor && (
        <Link
          href="/stories"
          className="
            px-3
            py-2
            rounded-lg
            border
            hover:shadow-md
            transition
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Manage Stories
        </Link>
      )}

      {!user ? (
        <>
          <Link
            href="/auth/login"
            className="hover:opacity-70 transition"
          >
            Login
          </Link>

          <Link
            href="/auth/signup"
            className="
              px-4
              py-2
              rounded-lg
              border
              font-medium
              hover:shadow-md
              transition
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            Sign Up
          </Link>
        </>
      ) : (
        <Link
          href="/auth/logout"
          className="
            px-4
            py-2
            rounded-lg
            border
            hover:shadow-md
            transition
          "
          style={{
            borderColor: "var(--card-border)",
          }}
        >
          Logout
        </Link>
      )}
    </nav>
  </div>
</header>
);
}