"use server";

import { createClient } from "@/utils/supabase/server";

type Result = { ok: true } | { ok: false; error: string };

export async function submitPlagiarismReport(input: {
  storyId: string;
  chapterId?: string | null;
  originalUrl?: string;
  details: string;
}): Promise<Result> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false, error: "Please log in to report a story." };
  }

  const details = (input.details ?? "").trim();
  const originalUrl = (input.originalUrl ?? "").trim();

  if (details.length < 20) {
    return {
      ok: false,
      error: "Please describe what was copied (at least 20 characters).",
    };
  }

  if (details.length > 2000) {
    return { ok: false, error: "Please keep the description under 2000 characters." };
  }

  if (originalUrl) {
    if (originalUrl.length > 500 || !/^https?:\/\//i.test(originalUrl)) {
      return {
        ok: false,
        error: "The link to the original must start with http:// or https://.",
      };
    }
  }

  const { data: story } = await supabase
    .from("stories")
    .select("id, author_id")
    .eq("id", input.storyId)
    .maybeSingle();

  if (!story) {
    return { ok: false, error: "That story could not be found." };
  }

  if (story.author_id === user.id) {
    return { ok: false, error: "You can't report your own story." };
  }

  const { error } = await supabase.from("plagiarism_reports").insert({
    reporter_id: user.id,
    story_id: story.id,
    chapter_id: input.chapterId ?? null,
    original_url: originalUrl || null,
    details,
  });

  if (error) {
    // one open report per reader per story
    if (error.code === "23505") {
      return {
        ok: false,
        error: "You already have an open report for this story. Our team is reviewing it.",
      };
    }

    console.error("Plagiarism report failed:", error.message);

    return { ok: false, error: "Something went wrong. Please try again." };
  }

  return { ok: true };
}