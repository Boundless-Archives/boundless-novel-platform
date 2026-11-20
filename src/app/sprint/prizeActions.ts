"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";

async function sessionUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  return user;
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

/* Only same-site paths, so a crafted form cannot send people elsewhere. */
function safeBack(raw: string, fallback: string) {
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}

function back(path: string, key: string, code: string) {
  const sep = path.includes("?") ? "&" : "?";
  redirect(`${path}${sep}${key}=${code}`);
}

function refresh() {
  revalidatePath("/sprint");
  revalidatePath("/sprint/prizes");
  revalidatePath("/sprint/judge");
  revalidatePath("/story/[slug]", "page");
}

export async function enterPrizeAction(formData: FormData) {
  const user = await sessionUser();
  const { data, error } = await createAdminClient().rpc("prize_enter", {
    p_user: user.id,
    p_sprint: str(formData, "sprintId"),
    p_story: str(formData, "storyId"),
    p_prompt: str(formData, "promptId"),
  });
  if (error) console.error("prize_enter failed:", error.message);
  refresh();
  back("/sprint/prizes", "e", error ? "failed" : String(data));
}

export async function withdrawPrizeAction(formData: FormData) {
  const user = await sessionUser();
  const { data, error } = await createAdminClient().rpc("prize_withdraw", {
    p_user: user.id,
    p_sprint: str(formData, "sprintId"),
  });
  if (error) console.error("prize_withdraw failed:", error.message);
  refresh();
  back("/sprint/prizes", "e", error ? "failed" : data === "ok" ? "withdrawn" : String(data));
}

export async function votePrizeAction(formData: FormData) {
  const user = await sessionUser();
  const path = safeBack(str(formData, "back"), "/sprint/prizes");
  const { data, error } = await createAdminClient().rpc("prize_vote", {
    p_user: user.id,
    p_sprint: str(formData, "sprintId"),
    p_story: str(formData, "storyId"),
  });
  if (error) console.error("prize_vote failed:", error.message);
  refresh();
  back(path, "v", error ? "failed" : String(data));
}

/* ---------- judging and results (the database checks the role too) ---------- */

export async function scoreEntryAction(formData: FormData) {
  const user = await sessionUser();
  const score = Number(str(formData, "score"));
  const { data, error } = await createAdminClient().rpc("prize_score", {
    p_judge: user.id,
    p_sprint: str(formData, "sprintId"),
    p_story: str(formData, "storyId"),
    p_score: Number.isFinite(score) ? score : null,
    p_note: str(formData, "note").slice(0, 1000),
  });
  if (error) console.error("prize_score failed:", error.message);
  refresh();
  back("/sprint/judge", "j", error ? "failed" : String(data));
}

export async function disqualifyAction(formData: FormData) {
  const user = await sessionUser();
  const { data, error } = await createAdminClient().rpc("prize_set_dq", {
    p_admin: user.id,
    p_sprint: str(formData, "sprintId"),
    p_story: str(formData, "storyId"),
    p_dq: str(formData, "dq") === "1",
    p_reason: str(formData, "reason").slice(0, 500),
  });
  if (error) console.error("prize_set_dq failed:", error.message);
  refresh();
  back("/sprint/judge", "j", error ? "failed" : String(data));
}

export async function setAwardAction(formData: FormData) {
  const user = await sessionUser();
  const place = Number(str(formData, "place"));
  const story = str(formData, "storyId");
  const { data, error } = await createAdminClient().rpc("prize_set_award", {
    p_admin: user.id,
    p_sprint: str(formData, "sprintId"),
    p_place: place,
    p_story: story === "" ? null : story,
  });
  if (error) console.error("prize_set_award failed:", error.message);
  refresh();
  back("/sprint/judge", "j", error ? "failed" : String(data));
}

export async function announceAction(formData: FormData) {
  const user = await sessionUser();
  const { data, error } = await createAdminClient().rpc("prize_announce", {
    p_admin: user.id,
    p_sprint: str(formData, "sprintId"),
  });
  if (error) console.error("prize_announce failed:", error.message);
  refresh();
  back("/sprint/judge", "j", error ? "failed" : String(data));
}
