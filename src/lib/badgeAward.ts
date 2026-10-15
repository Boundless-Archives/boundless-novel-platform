import { createAdminClient } from "@/utils/supabase/admin";

/*
 * Awards one badge, by its slug, to one user. Server-side only.
 *
 * This lives in src/lib (NOT in a "use server" file) on purpose:
 * every function exported from a "use server" file becomes a
 * public endpoint anyone can call. This one must only ever be
 * called from other server code that has already decided the
 * user earned the badge.
 *
 * Returns true if the badge was newly awarded, false if the user
 * already had it or the badge doesn't exist / is switched off.
 */
export async function awardBadgeBySlug(
  userId: string,
  slug: string
): Promise<boolean> {
  const adminClient = createAdminClient();

  const { data: badge } = await adminClient
    .from("badges")
    .select("id, name")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();

  if (!badge) return false;

  const { error } = await adminClient.from("user_badges").insert({
    user_id: userId,
    badge_id: badge.id,
    awarded_at: new Date().toISOString(),
  });

  if (error) {
    // 23505 = they already have it. Anything else is worth logging.
    if (error.code !== "23505") {
      console.error("Badge award failed:", error.message);
    }
    return false;
  }

  const { error: notifyError } = await adminClient
    .from("notifications")
    .insert({
      user_id: userId,
      type: "badge_earned",
      title: "New badge earned!",
      message: `You've earned the "${badge.name}" badge.`,
      link: "/profile",
    });

  if (notifyError) {
    console.error("Notification failed:", notifyError.message);
  }

  return true;
}