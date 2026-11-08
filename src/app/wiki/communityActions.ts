"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

/* Co-authors and fan suggestions. Every rule lives in the database
   functions; these actions only pass the signed-in user. */

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

function safeReturn(path: string) {
  return path.startsWith("/wiki/") || path === "/my-universe" ? path : "/wiki";
}

export async function inviteCoAuthorAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const { data, error } = await createAdminClient().rpc("universe_invite_member", {
    p_owner: userId,
    p_universe: text(formData, "universeId"),
    p_username: text(formData, "username"),
  });

  if (error) console.error("universe_invite_member failed:", error.message);

  revalidatePath("/my-universe");
  redirect(`/my-universe?co=${error ? "failed" : data}`);
}

export async function removeCoAuthorAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const { error } = await createAdminClient().rpc("universe_remove_member", {
    p_actor: userId,
    p_universe: text(formData, "universeId"),
    p_member: text(formData, "memberId"),
  });

  if (error) console.error("universe_remove_member failed:", error.message);

  revalidatePath("/my-universe");
  redirect("/my-universe?co=removed");
}

export async function submitSuggestionAction(formData: FormData) {
  const userId = await currentUserId();
  const back = safeReturn(text(formData, "returnTo"));
  if (!userId) redirect("/auth/login");

  const entityId = text(formData, "entityId");

  const { data, error } = await createAdminClient().rpc("submit_entity_suggestion", {
    p_user: userId,
    p_universe: text(formData, "universeId"),
    p_entity: entityId || null,
    p_kind: text(formData, "kind"),
    p_name: text(formData, "name"),
    p_type: text(formData, "entityType") || null,
    p_summary: text(formData, "summary"),
    p_content: text(formData, "content"),
    p_note: text(formData, "note"),
  });

  if (error) console.error("submit_entity_suggestion failed:", error.message);

  redirect(`${back}?s=${error ? "failed" : data}`);
}

export async function resolveSuggestionAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const { data, error } = await createAdminClient().rpc("resolve_entity_suggestion", {
    p_owner: userId,
    p_id: text(formData, "id"),
    p_accept: text(formData, "decision") === "accept",
    p_origin_story: text(formData, "originStoryId") || null,
    p_reply: text(formData, "reply"),
  });

  if (error) console.error("resolve_entity_suggestion failed:", error.message);

  revalidatePath("/my-universe");
  redirect(`/my-universe?sg=${error ? "failed" : data}`);
}
