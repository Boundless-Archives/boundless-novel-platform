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

function validIso(v: string) {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

/* Who may create what is decided in the database (create_event). */
export async function createEventAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  const guildId = text(formData, "guildId") || null;
  const guildSlug = text(formData, "guildSlug");
  const back = guildSlug ? `/events/new?guild=${encodeURIComponent(guildSlug)}` : "/events/new";

  const starts = validIso(text(formData, "startsAt"));
  const endsRaw = text(formData, "endsAt");
  const ends = endsRaw ? validIso(endsRaw) : null;

  if (!starts) redirect(`${back}${back.includes("?") ? "&" : "?"}e=invalid`);

  const { data, error } = await createAdminClient().rpc("create_event", {
    p_user: userId,
    p_guild: guildId,
    p_title: text(formData, "title"),
    p_summary: text(formData, "summary"),
    p_body: text(formData, "body"),
    p_starts: starts,
    p_ends: ends,
    p_link: text(formData, "link") || null,
  });

  const result = (data ?? {}) as { status?: string };

  if (error || result.status !== "ok") {
    const e = error ? "failed" : (result.status ?? "failed");
    redirect(`${back}${back.includes("?") ? "&" : "?"}e=${encodeURIComponent(e)}`);
  }

  revalidatePath("/events");
  if (guildSlug) {
    revalidatePath(`/guilds/${guildSlug}`);
    redirect(`/guilds/${guildSlug}`);
  }
  redirect("/events");
}

export async function rsvpAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  await createAdminClient().rpc("toggle_event_rsvp", {
    p_user: userId,
    p_event: text(formData, "eventId"),
  });

  revalidatePath("/events");
  const slug = text(formData, "guildSlug");
  if (slug) revalidatePath(`/guilds/${slug}`);
}

export async function cancelEventAction(formData: FormData) {
  const userId = await currentUserId();
  if (!userId) redirect("/auth/login");

  await createAdminClient().rpc("cancel_event", {
    p_user: userId,
    p_event: text(formData, "eventId"),
  });

  revalidatePath("/events");
  const slug = text(formData, "guildSlug");
  if (slug) revalidatePath(`/guilds/${slug}`);
}
