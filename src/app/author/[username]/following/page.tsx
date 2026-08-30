import Link from "next/link";
import { notFound } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{
    username: string;
  }>;
};

export default async function FollowingPage({
  params,
}: Props) {
  const { username } = await params;

  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, username, display_name, is_author")
    .eq("username", username)
    .maybeSingle();

  if (!profile || !profile.is_author) {
    notFound();
  }

  const { data: following, error } = await supabase
    .from("followers")
    .select(`
      following_id,
      profiles:following_id (
        username,
        display_name,
        avatar_url,
        is_author
      )
    `)
    .eq("follower_id", profile.id)
    .order("created_at", {
      ascending: false,
    });

  if (error) {
    throw new Error(error.message);
  }

  return (
    <main className="mx-auto max-w-4xl px-5 py-10">

      <Link
        href={`/author/${profile.username}`}
        className="text-sm opacity-70 hover:underline"
      >
        ← Back to Author
      </Link>

      <h1 className="mt-6 text-4xl font-bold">
        Following
      </h1>

      <p className="mt-2 opacity-60">
        People followed by{" "}
        {profile.display_name ||
          profile.username}
      </p>

      <div className="mt-8 space-y-3">

        {!following?.length ? (
          <div
            className="
              rounded-2xl
              border
              p-8
              text-center
              opacity-60
            "
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            Not following anyone yet.
          </div>
        ) : (
          following.map((entry) => {
            const person = Array.isArray(
              entry.profiles
            )
              ? entry.profiles[0]
              : entry.profiles;

            if (!person) return null;

            const href = person.is_author
              ? `/author/${person.username}`
              : `/profile/${person.username}`;

            return (
              <Link
                key={entry.following_id}
                href={href}
                className="
                  flex
                  items-center
                  gap-4
                  rounded-2xl
                  border
                  p-4
                  transition
                  hover:-translate-y-0.5
                "
                style={{
                  borderColor:
                    "var(--card-border)",
                  backgroundColor:
                    "var(--card)",
                }}
              >

                {person.avatar_url ? (
                  <img
                    src={person.avatar_url}
                    alt={
                      person.display_name ||
                      person.username
                    }
                    className="
                      h-12
                      w-12
                      rounded-full
                      object-cover
                    "
                  />
                ) : (
                  <div
                    className="
                      flex
                      h-12
                      w-12
                      items-center
                      justify-center
                      rounded-full
                      border
                      opacity-50
                    "
                    style={{
                      borderColor:
                        "var(--card-border)",
                    }}
                  >
                    👤
                  </div>
                )}

                <div className="min-w-0">
                  <p className="font-semibold">
                    {person.display_name ||
                      person.username}
                  </p>

                  <p className="text-sm opacity-60">
                    @{person.username}
                  </p>
                </div>

              </Link>
            );
          })
        )}

      </div>

    </main>
  );
}