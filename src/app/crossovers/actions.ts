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
 * Get the current user's own stories,
 * for the "pick your story" selector.
 */
export async function getMyStoriesForCrossover() {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { data, error } = await supabase
    .from("stories")
    .select("id, title, slug")
    .eq("author_id", user.id)
    .order("title");

  if (error) {
    throw new Error(error.message);
  }

  return data ?? [];
}

/*
 * Request a crossover between one of the
 * current user's stories and a target story.
 */
export async function requestCrossover(
  requestingStoryId: string,
  targetStoryId: string,
  message: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { data: requestingStory, error: reqError } =
    await supabase
      .from("stories")
      .select("id, title, author_id")
      .eq("id", requestingStoryId)
      .maybeSingle();

  if (reqError) {
    throw new Error(reqError.message);
  }

  if (!requestingStory || requestingStory.author_id !== user.id) {
    throw new Error(
      "You can only request a crossover using your own story."
    );
  }

  const { data: targetStory, error: targetError } =
    await supabase
      .from("stories")
      .select("id, title, author_id, slug")
      .eq("id", targetStoryId)
      .maybeSingle();

  if (targetError) {
    throw new Error(targetError.message);
  }

  if (!targetStory) {
    throw new Error("Target story not found.");
  }

  if (targetStory.author_id === user.id) {
    throw new Error(
      "You cannot request a crossover with your own story."
    );
  }

  const { data: existing } = await supabase
    .from("crossover_requests")
    .select("id")
    .eq("requesting_story_id", requestingStoryId)
    .eq("target_story_id", targetStoryId)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) {
    throw new Error(
      "There's already a pending crossover request between these stories."
    );
  }

  const { error: insertError } = await supabase
    .from("crossover_requests")
    .insert({
      requesting_story_id: requestingStoryId,
      target_story_id: targetStoryId,
      requested_by: user.id,
      target_author_id: targetStory.author_id,
      message: message || null,
    });

  if (insertError) {
    throw new Error(insertError.message);
  }

  await supabase.from("notifications").insert({
    user_id: targetStory.author_id,
    actor_id: user.id,
    type: "crossover_request",
    title: "New crossover request",
    message: `Someone wants to crossover "${requestingStory.title}" with your story "${targetStory.title}".`,
    link: "/crossovers",
  });

  revalidatePath("/crossovers");
  revalidatePath(`/story/${targetStory.slug}`);
}

/*
 * Accept or decline an incoming crossover request.
 * Only the target author can respond.
 */
export async function respondToCrossoverRequest(
  requestId: string,
  accept: boolean
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { data: request, error: fetchError } =
    await supabase
      .from("crossover_requests")
      .select(
        `
        id,
        status,
        requested_by,
        target_author_id,
        requesting_story:requesting_story_id ( title, slug ),
        target_story:target_story_id ( title, slug )
      `
      )
      .eq("id", requestId)
      .maybeSingle();

  if (fetchError) {
    throw new Error(fetchError.message);
  }

  if (!request || request.target_author_id !== user.id) {
    throw new Error("Request not found.");
  }

  if (request.status !== "pending") {
    throw new Error("This request has already been resolved.");
  }

  const newStatus = accept ? "accepted" : "declined";

  const { error: updateError } = await supabase
    .from("crossover_requests")
    .update({
      status: newStatus,
      responded_at: new Date().toISOString(),
    })
    .eq("id", requestId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  const requestingStory = Array.isArray(request.requesting_story)
    ? request.requesting_story[0]
    : request.requesting_story;

  const targetStory = Array.isArray(request.target_story)
    ? request.target_story[0]
    : request.target_story;

  await supabase.from("notifications").insert({
    user_id: request.requested_by,
    actor_id: user.id,
    type: "crossover_response",
    title: accept
      ? "Crossover request accepted"
      : "Crossover request declined",
    message: accept
      ? `Your crossover request for "${requestingStory?.title}" x "${targetStory?.title}" was accepted!`
      : `Your crossover request for "${requestingStory?.title}" x "${targetStory?.title}" was declined.`,
    link: "/crossovers",
  });

  revalidatePath("/crossovers");
}

/*
 * Cancel a request the current user sent.
 */
export async function cancelCrossoverRequest(
  requestId: string
) {
  const { supabase, user } =
    await getAuthenticatedUser();

  const { error } = await supabase
    .from("crossover_requests")
    .update({ status: "cancelled" })
    .eq("id", requestId)
    .eq("requested_by", user.id)
    .eq("status", "pending");

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/crossovers");
}