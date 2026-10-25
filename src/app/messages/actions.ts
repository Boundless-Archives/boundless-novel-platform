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

const text = (fd: FormData, k: string) => String(fd.get(k) ?? "");

/* Every rule (blocks, who may message whom, limits) lives in the database. */

export async function sendMessageAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const username = text(formData, "username");
  const to = `/messages/${encodeURIComponent(username)}`;

  const { data, error } = await createAdminClient().rpc("send_message", {
    p_sender: userId,
    p_recipient: text(formData, "recipientId"),
    p_body: text(formData, "body"),
  });

  const status = error ? "failed" : String(data);

  revalidatePath("/messages");
  revalidatePath(to);

  if (status !== "ok") redirect(`${to}?e=${encodeURIComponent(status)}`);
  redirect(to);
}

export async function deleteThreadAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  await createAdminClient().rpc("delete_thread", {
    p_user: userId,
    p_other: text(formData, "otherId"),
  });

  revalidatePath("/messages");
  redirect("/messages");
}

export async function blockUserAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const username = text(formData, "username");

  await createAdminClient().rpc("block_user", {
    p_user: userId,
    p_target: text(formData, "otherId"),
  });

  revalidatePath("/messages");
  revalidatePath(`/messages/${encodeURIComponent(username)}`);
}

export async function unblockUserAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const username = text(formData, "username");

  await createAdminClient().rpc("unblock_user", {
    p_user: userId,
    p_target: text(formData, "otherId"),
  });

  revalidatePath("/messages");
  if (username) revalidatePath(`/messages/${encodeURIComponent(username)}`);
}
