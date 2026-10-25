"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

async function currentUserId() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function text(fd: FormData, key: string) {
  return String(fd.get(key) ?? "");
}

/* Every rule (realm 7, superadmin bypass, limits, ownership) is enforced
   in the database functions. These actions only pass the signed-in user. */

export async function createGuildAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const { data, error } = await createAdminClient().rpc("create_guild", {
    p_user: userId,
    p_kind: text(formData, "kind"),
    p_name: text(formData, "name"),
    p_description: text(formData, "description"),
  });

  if (error) {
    console.error("create_guild failed:", error.message);
    redirect("/guilds/new?e=failed");
  }

  const result = data as { status: string; slug?: string };

  if (result.status !== "ok" || !result.slug) {
    redirect(`/guilds/new?e=${encodeURIComponent(result.status)}`);
  }

  revalidatePath("/guilds");
  redirect(`/guilds/${result.slug}`);
}

export async function joinGuildAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");

  await createAdminClient().rpc("join_guild", {
    p_user: userId,
    p_guild: text(formData, "guildId"),
  });

  revalidatePath(`/guilds/${slug}`);
  revalidatePath("/guilds");
}

export async function leaveGuildAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");

  await createAdminClient().rpc("leave_guild", {
    p_user: userId,
    p_guild: text(formData, "guildId"),
  });

  revalidatePath(`/guilds/${slug}`);
  revalidatePath("/guilds");
}

export async function createPostAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");

  const { data, error } = await createAdminClient().rpc("create_guild_post", {
    p_user: userId,
    p_guild: text(formData, "guildId"),
    p_title: text(formData, "title"),
    p_body: text(formData, "body"),
  });

  const result = (data ?? { status: "failed" }) as { status: string; id?: string };

  if (error || result.status !== "ok" || !result.id) {
    redirect(`/guilds/${slug}?e=${encodeURIComponent(error ? "failed" : result.status)}`);
  }

  revalidatePath(`/guilds/${slug}`);
  redirect(`/guilds/${slug}/post/${result.id}`);
}

export async function createReplyAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");
  const postId = text(formData, "postId");

  const { data, error } = await createAdminClient().rpc("create_guild_reply", {
    p_user: userId,
    p_post: postId,
    p_body: text(formData, "body"),
  });

  const status = error ? "failed" : String(data);

  if (status !== "ok") {
    redirect(`/guilds/${slug}/post/${postId}?e=${encodeURIComponent(status)}`);
  }

  revalidatePath(`/guilds/${slug}/post/${postId}`);
  redirect(`/guilds/${slug}/post/${postId}`);
}

export async function deletePostAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");

  await createAdminClient().rpc("delete_guild_post", {
    p_user: userId,
    p_post: text(formData, "postId"),
  });

  revalidatePath(`/guilds/${slug}`);
  redirect(`/guilds/${slug}`);
}

export async function deleteReplyAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");
  const postId = text(formData, "postId");

  await createAdminClient().rpc("delete_guild_reply", {
    p_user: userId,
    p_reply: text(formData, "replyId"),
  });

  revalidatePath(`/guilds/${slug}/post/${postId}`);
  redirect(`/guilds/${slug}/post/${postId}`);
}

export async function disbandGuildAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  await createAdminClient().rpc("delete_guild", {
    p_user: userId,
    p_guild: text(formData, "guildId"),
  });

  revalidatePath("/guilds");
  redirect("/guilds");
}
