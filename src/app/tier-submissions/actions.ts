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

async function requireAdmin() {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["admin", "superadmin"].includes(profile.role)
  ) {
    throw new Error("Admin access required.");
  }

  return { supabase, user };
}

function nextTierFor(currentTier: string): "A" | "S" | null {
  if (currentTier === "B") return "A";
  if (currentTier === "A") return "S";
  return null;
}

/*
 * Submit a story for a tier upgrade.
 * The requested tier is always the next tier up
 * from the story's current tier.
 */
export async function submitTierUpgrade(
  storyId: string,
  outline: string,
  synopsis: string,
  excerpt: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  if (!outline.trim() || !synopsis.trim()) {
    throw new Error(
      "Outline and synopsis are required."
    );
  }

  const { data: story, error: storyError } =
    await supabase
      .from("stories")
      .select("id, author_id, canon_tier, title")
      .eq("id", storyId)
      .maybeSingle();

  if (storyError) {
    throw new Error(storyError.message);
  }

  if (!story || story.author_id !== user.id) {
    throw new Error(
      "You can only submit your own stories."
    );
  }

  const requestedTier = nextTierFor(story.canon_tier);

  if (!requestedTier) {
    throw new Error(
      "This story is already at the top tier."
    );
  }

  const { data: existingPending } = await supabase
    .from("tier_submissions")
    .select("id")
    .eq("story_id", storyId)
    .eq("status", "pending")
    .maybeSingle();

  if (existingPending) {
    throw new Error(
      "This story already has a pending submission."
    );
  }

  const { error: insertError } = await supabase
    .from("tier_submissions")
    .insert({
      story_id: storyId,
      submitted_by: user.id,
      requested_tier: requestedTier,
      outline,
      synopsis,
      excerpt: excerpt || null,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .in("role", ["admin", "superadmin"]);

  if (admins && admins.length > 0) {
    await supabase.from("notifications").insert(
      admins.map((admin) => ({
        user_id: admin.id,
        actor_id: user.id,
        type: "tier_submission",
        title: "New tier upgrade submission",
        message: `"${story.title}" was submitted for ${requestedTier}-Tier review.`,
        link: "/admin/tier-submissions",
      }))
    );
  }

  revalidatePath(`/stories/${storyId}`);
  revalidatePath("/admin/tier-submissions");
}

/*
 * Cancel a pending submission (author only).
 */
export async function cancelTierSubmission(
  submissionId: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { error } = await supabase
    .from("tier_submissions")
    .update({ status: "cancelled" })
    .eq("id", submissionId)
    .eq("submitted_by", user.id)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/tier-submissions");
}

/*
 * Approve or reject a submission (admin only).
 * Approval updates the story's canon_tier.
 */
export async function reviewTierSubmission(
  submissionId: string,
  approve: boolean,
  reviewerNotes: string
) {
  const { supabase, user } = await requireAdmin();

  const { data: submission, error: fetchError } =
    await supabase
      .from("tier_submissions")
      .select(
        "id, story_id, requested_tier, submitted_by, status"
      )
      .eq("id", submissionId)
      .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!submission || submission.status !== "pending") {
    throw new Error(
      "This submission has already been resolved."
    );
  }

  const newStatus = approve ? "approved" : "rejected";

  const { error: updateError } = await supabase
    .from("tier_submissions")
    .update({
      status: newStatus,
      reviewer_id: user.id,
      reviewer_notes: reviewerNotes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (updateError) {
    throw new Error(updateError.message);
  }

    if (approve) {
    const { error: tierError } = await supabase
      .from("stories")
      .update({ canon_tier: submission.requested_tier })
      .eq("id", submission.story_id);

    if (tierError) {
      throw new Error(tierError.message);
    }

    const { checkAndAwardBadges } = await import("@/app/badges/actions");
    await checkAndAwardBadges(submission.submitted_by);
  }

  await supabase.from("notifications").insert({
    user_id: submission.submitted_by,
    actor_id: user.id,
    type: "tier_submission_response",
    title: approve
      ? `Upgraded to ${submission.requested_tier}-Tier!`
      : "Tier submission was not approved",
    message: approve
      ? `Your story was approved for ${submission.requested_tier}-Tier.`
      : reviewerNotes ||
        "Your tier submission was not approved this time.",
    link: `/stories/${submission.story_id}`,
  });

  revalidatePath("/admin/tier-submissions");
  revalidatePath(`/stories/${submission.story_id}`);
}

/*
 * Get all submissions (any status) for a story,
 * newest first — used on the author's submission page.
 */
export async function getTierSubmissionsForStory(
  storyId: string
) {
  const { supabase } = await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("tier_submissions")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}