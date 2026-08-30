"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

async function getAuthenticatedUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  return { supabase, user };
}

/*
 * Follow a user.
 */
export async function followUser(
  followingId: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  if (user.id === followingId) {
    throw new Error(
      "You cannot follow yourself."
    );
  }

  const { data: target, error: targetError } =
    await supabase
      .from("profiles")
      .select("id")
      .eq("id", followingId)
      .maybeSingle();

  if (targetError) {
    throw new Error(targetError.message);
  }

  if (!target) {
    throw new Error("User not found.");
  }

  const { error } = await supabase
    .from("followers")
    .insert({
      follower_id: user.id,
      following_id: followingId,
    });

  if (error) {
    if (error.code === "23505") {
      return;
    }

    throw new Error(error.message);
  }

  revalidatePath("/profile");
  revalidatePath("/author");

  return;
}

/*
 * Unfollow a user.
 */
export async function unfollowUser(
  followingId: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { error } = await supabase
    .from("followers")
    .delete()
    .eq("follower_id", user.id)
    .eq("following_id", followingId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/profile");
  revalidatePath("/author");

  return;
}

/*
 * Check whether the current user
 * follows another user.
 */
export async function isFollowing(
  followingId: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("followers")
    .select("id")
    .eq("follower_id", user.id)
    .eq("following_id", followingId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  return !!data;
}

/*
 * Get follower count.
 */
export async function getFollowerCount(
  userId: string
) {
  const { supabase } =
    await getAuthenticatedUser();

  const { count, error } = await supabase
    .from("followers")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("following_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}

/*
 * Get following count.
 */
export async function getFollowingCount(
  userId: string
) {
  const { supabase } =
    await getAuthenticatedUser();

  const { count, error } = await supabase
    .from("followers")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("follower_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}