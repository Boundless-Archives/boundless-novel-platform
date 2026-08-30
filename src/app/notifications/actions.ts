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
 * Create a notification.
 * Internal server-side helper.
 */
async function createNotification(
  userId: string,
  actorId: string | null,
  type: string,
  title: string,
  message: string | null,
  link: string | null
) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc(
    "create_notification",
    {
      p_user_id: userId,
      p_actor_id: actorId,
      p_type: type,
      p_title: title,
      p_message: message,
      p_link: link,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/notifications");

  return data;
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
      .select("id, link")
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

  return notification.link;
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

/*
 * Create a follow notification.
 */
export async function createFollowNotification(
  followingId: string
) {
  const { user } =
    await getAuthenticatedUser();

  if (user.id === followingId) {
    return;
  }

  const supabase = await createClient();

  const { data: actor } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const actorName =
    actor?.display_name ||
    actor?.username ||
    "Someone";

  return createNotification(
    followingId,
    user.id,
    "follow",
    `${actorName} followed you`,
    null,
    actor?.username
      ? `/profile/${actor.username}`
      : null
  );
}