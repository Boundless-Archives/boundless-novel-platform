import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

/* Admin-only pages and actions: signed in, and an admin or superadmin. */
export async function requireAdminUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "superadmin"].includes(profile.role)) {
    redirect("/");
  }

  return { user };
}
