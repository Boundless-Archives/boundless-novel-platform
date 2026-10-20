"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { validateUsername } from "@/lib/username";
import { registerReferralAfterOnboarding } from "@/lib/referralServer";

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

  const usernameError = validateUsername(username);

  if (usernameError) {
    throw new Error(usernameError);
  }

  if (displayName.length > 40) {
    throw new Error(
      "Display names can be at most 40 characters."
    );
  }

  const adminClient = createAdminClient();

  // Usernames are set once. If onboarding is already done, stop.
  const { data: current } = await adminClient
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (current?.onboarding_completed) {
    throw new Error(
      "Your username has already been set and cannot be changed."
    );
  }

  // Case-insensitive availability check, done in the database so
  // "_" is treated as a plain character, not a wildcard.
  const { data: available } = await supabase.rpc(
    "is_username_available",
    { candidate: username }
  );

  if (!available) {
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
    // Two people grabbing the same name at the same moment.
    if (error.code === "23505") {
      throw new Error("That username is already taken.");
    }

    throw new Error(error.message);
  }

  // If they came through a referral link, record it and reward the referrer
  await registerReferralAfterOnboarding(user);

  revalidatePath("/profile");
}