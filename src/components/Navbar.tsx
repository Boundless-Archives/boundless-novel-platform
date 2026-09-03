import { createClient } from "@/utils/supabase/server";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isAuthor = false;
  let role:
    | "reader"
    | "author"
    | "editor"
    | "admin"
    | "superadmin"
    | null = null;

  let unreadNotificationCount = 0;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_author, role")
      .eq("id", user.id)
      .single();

    isAuthor = profile?.is_author ?? false;
    role = profile?.role ?? null;

    const { count } = await supabase
      .from("notifications")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    unreadNotificationCount = count ?? 0;
  }

  return (
    <NavbarClient
      user={!!user}
      isAuthor={isAuthor}
      role={role}
      unreadNotificationCount={unreadNotificationCount}
    />
  );
}