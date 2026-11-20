import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { nowMs } from "@/lib/guilds";
import { getCurrentSprint } from "@/lib/sprint";
import { VOTE_MESSAGES, prizeCloseMs, type PrizeSprint } from "@/lib/prize";
import { votePrizeAction } from "@/app/sprint/prizeActions";

/*
 * Shown on a story's page when that story is in the Winter Prize Track:
 * who is entered, the vote count, and a vote button that tells the reader
 * exactly what is still missing if they cannot vote yet.
 */
export default async function PrizeVoteCard({
  storyId,
  storySlug,
  vote,
}: {
  storyId: string;
  storySlug: string;
  vote?: string;
}) {
  const now = nowMs();
  const current = await getCurrentSprint(new Date(now).toISOString());
  if (!current) return null;
  const sprint = current.sprint as PrizeSprint;
  if (!sprint.prize_enabled) return null;

  const admin = createAdminClient();
  const { data: entry } = await admin
    .from("prize_entries")
    .select("user_id, genre_slug, disqualified")
    .eq("sprint_id", sprint.id)
    .eq("story_id", storyId)
    .maybeSingle();
  if (!entry || entry.disqualified) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const open = now < prizeCloseMs(sprint) && !sprint.results_announced;
  const { count: votes } = await admin
    .from("prize_votes")
    .select("voter_id", { count: "exact", head: true })
    .eq("sprint_id", sprint.id)
    .eq("story_id", storyId);

  let myVote: string | null = null;
  let status = "ok";
  if (user && open) {
    const [{ data: mine }, { data: check }] = await Promise.all([
      admin.from("prize_votes").select("story_id").eq("sprint_id", sprint.id).eq("voter_id", user.id).maybeSingle(),
      admin.rpc("prize_vote_check", { p_sprint: sprint.id, p_user: user.id, p_story: storyId }),
    ]);
    myVote = mine?.story_id ?? null;
    status = String(check ?? "failed");
  }

  const note = vote ? VOTE_MESSAGES[vote] ?? VOTE_MESSAGES.failed : null;
  const back = `/story/${storySlug}`;

  return (
    <section
      id="prize-vote"
      className="mb-6 rounded-xl border p-5"
      style={{ borderColor: "var(--card-border)", backgroundColor: "var(--card)" }}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">🏆 Winter Prize Track entry</p>
          <p className="mt-1 text-sm opacity-80">
            {votes ?? 0} {(votes ?? 0) === 1 ? "vote" : "votes"} ·{" "}
            <Link href="/sprint/rules" className="underline underline-offset-4">
              How winners are chosen
            </Link>
          </p>
        </div>

        {open && !user && (
          <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}>
            Sign in to vote
          </Link>
        )}

        {open && user && myVote === storyId && (
          <span className="text-sm font-semibold">✓ Your vote is here</span>
        )}

        {open && user && myVote !== storyId && status === "ok" && (
          <form action={votePrizeAction}>
            <input type="hidden" name="sprintId" value={sprint.id} />
            <input type="hidden" name="storyId" value={storyId} />
            <input type="hidden" name="back" value={back} />
            <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold" style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}>
              {myVote ? "Move my vote here" : "Vote for this story"}
            </button>
          </form>
        )}
      </div>

      {open && user && myVote !== storyId && status !== "ok" && (
        <p className="mt-3 text-sm opacity-80">
          {status === "noread"
            ? `To vote, finish at least ${sprint.vote_min_chapters} chapters of this story first. Your vote then counts.`
            : VOTE_MESSAGES[status]?.text ?? ""}
        </p>
      )}

      {note && <p className={`mt-3 text-sm ${note.bad ? "text-red-500" : ""}`}>{note.text}</p>}
    </section>
  );
}
