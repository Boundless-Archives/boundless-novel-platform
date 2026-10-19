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
 * Mark one notification as read.
 */
export async function markNotificationAsRead(
  notificationId: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/notifications");
}

const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/*
 * Open Notifications
 */
export async function openNotification(
  notificationId: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { data: notification, error } =
    await supabase
      .from("notifications")
      .select("id, link, type, actor_id")
      .eq("id", notificationId)
      .eq("user_id", user.id)
      .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!notification) {
    throw new Error(
      "Notification not found."
    );
  }

  await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("id", notificationId)
    .eq("user_id", user.id);

  revalidatePath("/notifications");

  let destination: string | null = notification.link;

  // A "new follower" notification opens the follower's public profile
  if (notification.type === "follow") {
    const followerId =
      notification.actor_id ?? notification.link?.match(UUID_RE)?.[0];

    if (followerId) {
      const { data: follower } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", followerId)
        .maybeSingle();

      if (follower?.username) {
        destination = `/author/${follower.username}`;
      }
    }
  }

  return destination;
}


/*
 * Mark all notifications as read.
 */
export async function markAllNotificationsAsRead() {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/notifications");
}

/*
 * Get unread notification count.
 */
export async function getUnreadNotificationCount() {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { count, error } = await supabase
    .from("notifications")
    .select("id", {
      count: "exact",
      head: true,
    })
    .eq("user_id", user.id)
    .eq("is_read", false);

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}