import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { registerStreakDay } from "@/lib/streakEngine";
import { checkAndAwardBadges } from "@/app/badges/actions";
import { awardWritingXPForChapter } from "@/lib/cultivationXp";

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const expected = `Bearer ${process.env.CRON_SECRET}`;

  if (!process.env.CRON_SECRET || authHeader !== expected) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const adminClient = createAdminClient();

  const { data: dueChapters, error } = await adminClient
    .from("chapters")
    .select("id, story_id, stories ( author_id )")
    .eq("status", "Draft")
    .not("scheduled_at", "is", null)
    .lte("scheduled_at", new Date().toISOString());

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }

  const results: string[] = [];

  for (const chapter of dueChapters ?? []) {
    const story = Array.isArray(chapter.stories)
      ? chapter.stories[0]
      : chapter.stories;

    if (!story) continue;

    const publishedAt = new Date().toISOString();

    const { error: updateError } = await adminClient
      .from("chapters")
      .update({
        status: "Published",
        published_at: publishedAt,
      })
      .eq("id", chapter.id);

    if (updateError) {
      results.push(`${chapter.id}: failed — ${updateError.message}`);
      continue;
    }

    try {
      await registerStreakDay(story.author_id, "writer");
    } catch (e) {
      console.error("Writer streak registration failed:", e);
    }

    try {
      await awardWritingXPForChapter(chapter.id);
    } catch (e) {
      console.error("Writing XP award failed:", e);
    }

    try {
      await checkAndAwardBadges(story.author_id);
    } catch (e) {
      console.error("Badge check failed:", e);
    }

    results.push(`${chapter.id}: published`);
  }

  return NextResponse.json({
    processed: dueChapters?.length ?? 0,
    results,
  });
}