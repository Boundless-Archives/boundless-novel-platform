import { createAdminClient } from "@/utils/supabase/admin";
import { countWords } from "@/lib/wordCount";

/*
 * Cultivation XP engine. Server-side only.
 *
 * Lives in src/lib (NOT in a "use server" file) on purpose: everything
 * exported from a "use server" file is a public endpoint, and these
 * functions take a userId and mint XP, which now also pays Sparks at
 * every breakthrough. The browser-facing entry points are in
 * src/app/cultivation/actions.ts, and they work out the user (and what
 * is really owed) for themselves.
 */

const XP_PER_WORD_DIVISOR = 40;
const WRITING_XP_WINDOW_MS = 3 * 24 * 60 * 60 * 1000;

export type BreakthroughResult = {
  new_total_xp: number;
  old_major: number;
  old_minor: number;
  new_major: number;
  new_minor: number;
  is_major_breakthrough: boolean;
  is_minor_breakthrough: boolean;
  new_major_name: string | null;
  new_minor_name: string | null;
  cultivation_path: string | null;
};

/*
 * Core XP-award function. Handles breakthrough detection and the
 * resulting celebration (notification, badge for major breakthroughs).
 * The Sparks for a breakthrough are paid by the database itself, in the
 * same moment the realm changes.
 */
export async function awardCultivationXP(
  userId: string,
  xp: number,
  source: string
) {
  if (xp <= 0) return null;

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("award_cultivation_xp", {
      p_user_id: userId,
      p_xp: xp,
      p_source: source,
    })
    // A user who hasn't chosen a path gets no rows back; that is normal.
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  const result = data as BreakthroughResult | null;

  if (!result || result.cultivation_path === null) {
    // User hasn't chosen a path yet — nothing to award.
    return null;
  }

  await announceBreakthrough(userId, result);

  return result;
}

export async function announceBreakthrough(
  userId: string,
  result: BreakthroughResult
) {
  if (result.is_major_breakthrough) {
    await handleMajorBreakthrough(userId, result);
  } else if (result.is_minor_breakthrough) {
    await handleMinorBreakthrough(userId, result);
  }
}

async function handleMinorBreakthrough(
  userId: string,
  result: BreakthroughResult
) {
  const adminClient = createAdminClient();

  const label = result.new_minor_name
    ? `${result.new_major_name}, ${result.new_minor_name}`
    : `${result.new_major_name}, Stage ${result.new_minor}`;

  const { error } = await adminClient.from("notifications").insert({
    user_id: userId,
    type: "cultivation_breakthrough",
    title: "Cultivation Advanced",
    message: `You've advanced to ${label}. Breakthrough Sparks are in your wallet.`,
    link: "/profile",
  });

  if (error) {
    console.error("Cultivation notification failed:", error.message);
  }
}

async function handleMajorBreakthrough(
  userId: string,
  result: BreakthroughResult
) {
  const adminClient = createAdminClient();

  const { error: notifyError } = await adminClient
    .from("notifications")
    .insert({
      user_id: userId,
      type: "cultivation_breakthrough",
      title: "Realm Breakthrough!",
      message: `You've broken through to ${result.new_major_name} (Realm ${result.new_major}). Breakthrough Sparks are in your wallet.`,
      link: "/profile",
    });

  if (notifyError) {
    console.error("Cultivation notification failed:", notifyError.message);
  }

  const { data: badge } = await adminClient
    .from("badges")
    .select("id, name")
    .eq("slug", `realm_${result.new_major}`)
    .maybeSingle();

  if (badge) {
    const { error: badgeError } = await adminClient
      .from("user_badges")
      .insert({ user_id: userId, badge_id: badge.id });

    if (!badgeError) {
      await adminClient.from("notifications").insert({
        user_id: userId,
        type: "badge_earned",
        title: "New badge earned!",
        message: `You've earned the "${badge.name}" badge.`,
        link: "/profile",
      });
    }
  }

  // Realm 7+ triggers a brief, live, site-wide fanfare —
  // broadcast only, nothing persisted to any table.
  if (result.new_major >= 7) {
    const { data: profile } = await adminClient
      .from("profiles")
      .select("username, display_name")
      .eq("id", userId)
      .maybeSingle();

    const name =
      profile?.display_name ?? profile?.username ?? "A cultivator";

    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/realtime/v1/api/broadcast`,
        {
          method: "POST",
          headers: {
            apikey: process.env.SUPABASE_SECRET_KEY!,
            Authorization: `Bearer ${process.env.SUPABASE_SECRET_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              {
                topic: "global-events",
                event: "cultivation_breakthrough",
                payload: {
                  name,
                  realmName: result.new_major_name,
                  path: result.cultivation_path,
                },
              },
            ],
          }),
        }
      );
    } catch (e) {
      console.error("Breakthrough broadcast failed:", e);
    }
  }
}

/*
 * Writing XP for a chapter that has gone live. The XP is worked out
 * here from the chapter as it is stored in the database (never from
 * anything the browser sends), and the database allows it once per
 * chapter, ever, with a cap per chapter and per day.
 *
 * `onlyForUserId`: when a signed-in user asks, pass their id so they
 * can only claim for their own chapters. The cron route leaves it out.
 */
export async function awardWritingXPForChapter(
  chapterId: string,
  onlyForUserId?: string
) {
  const adminClient = createAdminClient();

  const { data: chapter } = await adminClient
    .from("chapters")
    .select("id, content, status, published_at, stories ( author_id )")
    .eq("id", chapterId)
    .maybeSingle();

  if (!chapter || chapter.status !== "Published") return null;

  const story = Array.isArray(chapter.stories)
    ? chapter.stories[0]
    : chapter.stories;

  if (!story) return null;

  if (onlyForUserId && story.author_id !== onlyForUserId) return null;

  const publishedAt = chapter.published_at
    ? Date.parse(chapter.published_at)
    : 0;

  if (Date.now() - publishedAt > WRITING_XP_WINDOW_MS) return null;

  const xp = Math.floor(
    countWords(chapter.content ?? "") / XP_PER_WORD_DIVISOR
  );

  if (xp <= 0) return null;

  const { data: granted, error } = await adminClient.rpc(
    "claim_writing_xp",
    {
      p_user: story.author_id,
      p_chapter: chapter.id,
      p_xp: xp,
    }
  );

  if (error) {
    throw new Error(error.message);
  }

  const grant = (granted as number) ?? 0;

  if (grant < 1) return null;

  try {
    const result = await awardCultivationXP(
      story.author_id,
      grant,
      "writing"
    );

    if (!result) {
      // No cultivation path yet: hand the claim back so it isn't lost.
      await adminClient.rpc("release_writing_xp", {
        p_user: story.author_id,
        p_chapter: chapter.id,
      });
    }

    return result;
  } catch (e) {
    await adminClient.rpc("release_writing_xp", {
      p_user: story.author_id,
      p_chapter: chapter.id,
    });

    throw e;
  }
}
