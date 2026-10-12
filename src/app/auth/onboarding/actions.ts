"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

const USERNAME_PATTERN = /^[a-z0-9_]{3,20}$/;

const RESERVED_USERNAMES = new Set([
  "admin",
  "administrator",
  "staff",
  "support",
  "help",
  "moderator",
  "mod",
  "editor",
  "system",
  "boundless",
  "official",
  "root",
  "null",
  "undefined",
]);

export async function completeOnboarding(
  rawUsername: string,
  rawDisplayName: string
) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  const username = rawUsername.trim().toLowerCase();
  const displayName = rawDisplayName.trim();

  if (!USERNAME_PATTERN.test(username)) {
    throw new Error(
      "Usernames must be 3–20 characters: lowercase letters, numbers, and underscores only."
    );
  }

  if (RESERVED_USERNAMES.has(username)) {
    throw new Error("That username isn't available.");
  }

  if (displayName.length > 40) {
    throw new Error(
      "Display names can be at most 40 characters."
    );
  }

  const adminClient = createAdminClient();

  // Case-insensitive uniqueness check. Escape LIKE wildcards so
  // "_" is matched literally instead of meaning "any character".
  const escaped = username.replace(/[\\%_]/g, "\\$&");

  const { data: taken } = await adminClient
    .from("profiles")
    .select("id")
    .ilike("username", escaped)
    .neq("id", user.id)
    .limit(1);

  if (taken && taken.length > 0) {
    throw new Error("That username is already taken.");
  }

  const { error } = await adminClient
    .from("profiles")
    .update({
      username,
      display_name: displayName || null,
      onboarding_completed: true,
    })
    .eq("id", user.id);

  if (error) {
    if (error.code === "23505") {
      throw new Error("That username is already taken.");
    }

    throw new Error(error.message);
  }

  revalidatePath("/profile");
}