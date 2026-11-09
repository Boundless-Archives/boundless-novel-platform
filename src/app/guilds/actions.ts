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
  // straight to settings so the founder can add an emblem and banner
  redirect(`/guilds/${result.slug}/settings?welcome=1`);
}

export async function joinGuildAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");

  const { data } = await createAdminClient().rpc("join_guild", {
    p_user: userId,
    p_guild: text(formData, "guildId"),
  });

  revalidatePath(`/guilds/${slug}`);
  revalidatePath("/guilds");

  if (data === "private") redirect(`/guilds/join`);
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

/* ---------- upgrade: images, settings, officers, invite codes ---------- */

const IMAGE_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/gif": "gif",
};

async function isFounderOrSuper(userId: string, guildId: string) {
  const admin = createAdminClient();
  const [{ data: guild }, { data: profile }] = await Promise.all([
    admin.from("guilds").select("owner_id").eq("id", guildId).maybeSingle(),
    admin.from("profiles").select("role").eq("id", userId).maybeSingle(),
  ]);
  return !!guild && (guild.owner_id === userId || profile?.role === "superadmin");
}

async function uploadGuildImage(
  file: FormDataEntryValue | null,
  guildId: string,
  kind: "emblem" | "banner"
): Promise<string | null> {
  if (!(file instanceof File) || file.size === 0) return null;

  const ext = IMAGE_TYPES[file.type];
  if (!ext || file.size > 2_000_000) return null;

  const path = `${guildId}/${kind}-${Date.now()}.${ext}`;
  const admin = createAdminClient();

  const { error } = await admin.storage
    .from("guild-images")
    .upload(path, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    console.error("guild image upload failed:", error.message);
    return null;
  }

  return admin.storage.from("guild-images").getPublicUrl(path).data.publicUrl;
}

export async function updateGuildProfileAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const guildId = text(formData, "guildId");
  const slug = text(formData, "slug");

  if (!(await isFounderOrSuper(userId, guildId))) {
    redirect(`/guilds/${slug}?e=failed`);
  }

  const emblem = formData.get("emblem");
  const banner = formData.get("banner");

  const emblemUrl = await uploadGuildImage(emblem, guildId, "emblem");
  const bannerUrl = await uploadGuildImage(banner, guildId, "banner");

  const failedUpload =
    (emblem instanceof File && emblem.size > 0 && !emblemUrl) ||
    (banner instanceof File && banner.size > 0 && !bannerUrl);

  const { data, error } = await createAdminClient().rpc("update_guild_profile", {
    p_user: userId,
    p_guild: guildId,
    p_description: text(formData, "description"),
    p_motto: text(formData, "motto"),
    p_rules: text(formData, "rules"),
    p_private: text(formData, "private") === "on",
    p_emblem: text(formData, "emblemRemove") === "on" ? "" : emblemUrl,
    p_banner: text(formData, "bannerRemove") === "on" ? "" : bannerUrl,
  });

  revalidatePath(`/guilds/${slug}`);
  revalidatePath("/guilds");

  const status = error ? "failed" : String(data);
  redirect(
    `/guilds/${slug}/settings?${status === "ok" ? (failedUpload ? "e=image" : "saved=1") : `e=${status}`}`
  );
}

export async function regenerateCodeAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");
  await createAdminClient().rpc("regenerate_guild_code", {
    p_user: userId,
    p_guild: text(formData, "guildId"),
  });

  revalidatePath(`/guilds/${slug}/settings`);
  redirect(`/guilds/${slug}/settings?saved=code`);
}

export async function setRoleAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");
  const { data } = await createAdminClient().rpc("set_guild_role", {
    p_user: userId,
    p_guild: text(formData, "guildId"),
    p_member: text(formData, "memberId"),
    p_role: text(formData, "role"),
  });

  revalidatePath(`/guilds/${slug}/members`);
  redirect(`/guilds/${slug}/members${data === "limit" ? "?e=limit" : ""}`);
}

export async function removeMemberAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");
  await createAdminClient().rpc("remove_guild_member", {
    p_actor: userId,
    p_guild: text(formData, "guildId"),
    p_member: text(formData, "memberId"),
  });

  revalidatePath(`/guilds/${slug}/members`);
  revalidatePath(`/guilds/${slug}`);
  redirect(`/guilds/${slug}/members`);
}

export async function transferGuildAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");
  const { data } = await createAdminClient().rpc("transfer_guild", {
    p_owner: userId,
    p_guild: text(formData, "guildId"),
    p_new: text(formData, "newOwnerId"),
  });

  revalidatePath(`/guilds/${slug}`);
  redirect(data === "ok" ? `/guilds/${slug}` : `/guilds/${slug}/settings?e=${data === "limit" ? "limit" : "failed"}`);
}

export async function pinPostAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const slug = text(formData, "slug");
  const postId = text(formData, "postId");

  await createAdminClient().rpc("pin_guild_post", {
    p_user: userId,
    p_guild: text(formData, "guildId"),
    p_post: text(formData, "unpin") === "1" ? null : postId,
  });

  revalidatePath(`/guilds/${slug}`);
  redirect(`/guilds/${slug}/post/${postId}`);
}

export async function joinWithCodeAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const { data, error } = await createAdminClient().rpc("join_guild_with_code", {
    p_user: userId,
    p_code: text(formData, "code"),
  });

  const result = (data ?? { status: "failed" }) as { status: string; slug?: string };

  if (error || !result.slug) {
    redirect(`/guilds/join?e=${error ? "failed" : result.status}`);
  }

  revalidatePath("/guilds");
  redirect(`/guilds/${result.slug}`);
}
