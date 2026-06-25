import Image from "next/image";
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

  <main className="max-w-4xl mx-auto p-6 md:p-8">

<h1 className="text-4xl md:text-5xl font-bold mb-8">
  My Profile
</h1>

<div
  className="rounded-xl border p-8"
  style={{
    backgroundColor: "var(--card)",
    borderColor: "var(--card-border)",
  }}
>

  <div
    className="
      flex
      flex-col
      md:flex-row
      gap-8
      items-center
      md:items-start
      text-center
      md:text-left
    "
  >

    <div>

      {profile?.avatar_url ? (
        <Image
          src={profile.avatar_url}
          alt="Profile Avatar"
          width={120}
          height={120}
          className="rounded-full"
        />
      ) : (
        <div
          className="
            w-[120px]
            h-[120px]
            md:w-[140px]
            md:h-[140px]
            rounded-full
            border
            flex
            items-center
            justify-center
            text-4xl
            font-bold
          "
          style={{
            borderColor:
              "var(--card-border)",
          }}
        >
          {(profile?.display_name ??
            profile?.username ??
            "U")
            .charAt(0)
            .toUpperCase()}
        </div>
      )}

    </div>

    <div className="flex-1">

      <h2 className="text-3xl font-bold">
        {profile?.display_name ??
          "Unnamed User"}
      </h2>

      <p className="mt-2 opacity-70">
        @{profile?.username ?? "unknown"}
      </p>

      <p className="mt-1 text-sm opacity-60">
        {user.email}
      </p>

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
          {profile?.is_author
            ? "Author"
            : "Reader"}
        </span>
      </div>

      <div className="mt-6">
        <h3 className="font-semibold text-lg">
          Bio
        </h3>

        <p className="mt-2 opacity-90">
          {profile?.bio ||
            "No bio added yet."}
        </p>
      </div>

    </div>

  </div>

  <div
    className="
      mt-8
      flex
      flex-col
      sm:flex-row
      flex-wrap
      gap-4
    "
>

    <Link
      href="/profile/edit"
      className="
        border
        rounded-lg
        px-4
        py-2
        text-center
        w-full
        sm:w-auto
        transition
        hover:shadow-md
      "
      style={{
        borderColor:
          "var(--card-border)",
      }}
    >
      Edit Profile
    </Link>

    <Link
      href="/library"
      className="
        border
        rounded-lg
        px-4
        py-2
        transition
        hover:shadow-md
      "
      style={{
        borderColor:
          "var(--card-border)",
      }}
    >
      My Library
    </Link>

    {profile?.is_author && (
      <Link
        href="/stories"
        className="
          border
          rounded-lg
          px-4
          py-2
          transition
          hover:shadow-md
        "
        style={{
          borderColor:
            "var(--card-border)",
        }}
      >
        Manage Stories
      </Link>
      )}
      
      <Link
        href="/auth/logout"
        className="
          border
          rounded-lg
          px-4
          py-2
          transition
          hover:shadow-md
        "
        style={{
          borderColor:
            "var(--card-border)",
        }}
      >
        Logout
    </Link>
      

    {!profile?.is_author && (
      <Link
        href="/profile/become-author"
        className="
          border
          rounded-lg
          px-4
          py-2
          transition
          hover:shadow-md
        "
        style={{
          borderColor:
            "var(--card-border)",
        }}
      >
        Become an Author
      </Link>
    )}

  </div>

</div>

  </main>
);
}