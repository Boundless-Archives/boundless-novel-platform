import { createClient } from "@/utils/supabase/server";
import NavbarClient from "./NavbarClient";

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
    <NavbarClient
      user={!!user}
      isAuthor={isAuthor}
    />
  );
}