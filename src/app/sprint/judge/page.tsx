import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import SectionHeader from "@/components/layout/SectionHeader";
import { nowMs } from "@/lib/guilds";
import { getCurrentSprint } from "@/lib/sprint";
import { getGenreNames, getPrizeBoard, type PrizeSprint } from "@/lib/prize";
import { announceAction, disqualifyAction, scoreEntryAction, setAwardAction } from "../prizeActions";

export const metadata = { title: "Prize Track: judging" };

const NOTES: Record<string, string> = {
  ok: "Saved.",
  forbidden: "You do not have permission for that.",
  missing: "That entry could not be found.",
  bad: "Scores run from 0 to 10.",
  own: "You cannot score your own story.",
  locked: "Results are announced, so awards are locked.",
  already: "Results were already announced.",
  empty: "Pick at least one winner first.",
  failed: "Something went wrong.",
};

export default async function JudgePage({ searchParams }: { searchParams: Promise<{ j?: string }> }) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const current = await getCurrentSprint(new Date(nowMs()).toISOString());
  const sprint = current?.sprint as PrizeSprint | undefined;
  if (!sprint || !sprint.prize_enabled) redirect("/sprint");

  const admin = createAdminClient();
  const [{ data: isJudge }, { data: isAdmin }] = await Promise.all([
    admin.rpc("prize_is_judge", { p_user: user.id, p_sprint: sprint.id }),
    admin.rpc("prize_is_admin", { p_user: user.id }),
  ]);
  if (!isJudge) redirect("/sprint");

  const [board, genres, awardsRes, scoresRes] = await Promise.all([
    getPrizeBoard(sprint.id),
    getGenreNames(),
    admin.from("prize_awards").select("place, story_id").eq("sprint_id", sprint.id),
    admin.from("prize_judge_scores").select("story_id, score, note").eq("sprint_id", sprint.id).eq("judge_id", user.id),
  ]);

  const ids = board.map((b) => b.story_id);
  const { data: storyRows } = ids.length
    ? await admin.from("stories").select("id, title, slug, author_id").in("id", ids)
    : { data: [] };
  const stories = new Map((storyRows ?? []).map((s) => [s.id as string, s]));
  const myScores = new Map((scoresRes.data ?? []).map((s) => [s.story_id as string, s]));
  const awards = new Map((awardsRes.data ?? []).map((a) => [a.place as number, a.story_id as string]));

  const byGenre = new Map<string, typeof board>();
  for (const b of board) byGenre.set(b.genre_slug, [...(byGenre.get(b.genre_slug) ?? []), b]);

  const genreWinners = [...byGenre.values()]
    .map((l) => l.find((b) => b.genre_rank === 1))
    .filter((b): b is (typeof board)[number] => !!b);

  const note = sp.j ? NOTES[sp.j] ?? NOTES.failed : null;
  const card = { borderColor: "var(--card-border)", backgroundColor: "var(--card)" };
  const btn = { backgroundColor: "var(--button)", color: "var(--button-text)" };
  const input = { borderColor: "var(--card-border)" };
  const title = (id: string) => stories.get(id)?.title ?? "Story";

  return (
    <main className="max-w-5xl mx-auto px-6 py-10">
      <SectionHeader icon="⚖️" title="Prize Track: judging" description="Only judges and admins can see this page." />
      <p className="-mt-3 mb-4 text-sm">
        <Link href="/sprint/prizes" className="underline underline-offset-4">
          Public Prize Track page
        </Link>
      </p>
      {note && <p className={`mb-4 text-sm ${sp.j === "ok" ? "" : "text-red-500"}`}>{note}</p>}

      {isAdmin && (
        <section className="mb-8 rounded-2xl border p-5" style={card}>
          <h2 className="text-lg font-bold">Winners</h2>
          <p className="mt-1 text-xs opacity-70">
            Genre winners (top qualifying entry in each genre):{" "}
            {genreWinners.length ? genreWinners.map((b) => `${genres.get(b.genre_slug) ?? b.genre_slug}: ${title(b.story_id)}`).join(" · ") : "none yet"}
          </p>
          <div className="mt-3 space-y-2">
            {[1, 2, 3].map((place) => (
              <form key={place} action={setAwardAction} className="flex flex-wrap items-center gap-2 text-sm">
                <input type="hidden" name="sprintId" value={sprint.id} />
                <input type="hidden" name="place" value={place} />
                <span className="w-16 font-semibold">{["1st", "2nd", "3rd"][place - 1]}</span>
                <select name="storyId" defaultValue={awards.get(place) ?? ""} disabled={sprint.results_announced} className="min-w-0 flex-1 rounded-lg border bg-transparent p-2" style={input}>
                  <option value="" className="text-black">
                    (none)
                  </option>
                  {board.filter((b) => !b.disqualified).map((b) => (
                    <option key={b.story_id} value={b.story_id} className="text-black">
                      {title(b.story_id)} ({genres.get(b.genre_slug) ?? b.genre_slug}, {b.total})
                    </option>
                  ))}
                </select>
                {!sprint.results_announced && (
                  <button type="submit" className="rounded-lg px-3 py-2 text-xs font-semibold" style={btn}>
                    Set
                  </button>
                )}
              </form>
            ))}
          </div>
          {sprint.results_announced ? (
            <p className="mt-3 text-sm">✅ Results are announced.</p>
          ) : (
            <form action={announceAction} className="mt-4">
              <input type="hidden" name="sprintId" value={sprint.id} />
              <button type="submit" className="rounded-lg px-4 py-2 text-sm font-semibold" style={btn}>
                Announce results (notifies winners, cannot be undone)
              </button>
            </form>
          )}
        </section>
      )}

      {[...byGenre.entries()].map(([g, list]) => (
        <section key={g} className="mb-8">
          <h2 className="text-lg font-bold">{genres.get(g) ?? g}</h2>
          <div className="mt-3 space-y-3">
            {list.map((b) => {
              const mine = myScores.get(b.story_id);
              const own = stories.get(b.story_id)?.author_id === user.id;
              return (
                <div key={b.story_id} className="rounded-2xl border p-4" style={card}>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <p className="font-semibold">
                      {b.genre_rank ? `#${b.genre_rank} ` : ""}
                      <Link href={`/story/${stories.get(b.story_id)?.slug}`} className="underline underline-offset-4">
                        {title(b.story_id)}
                      </Link>
                      {b.disqualified && <span className="ml-2 text-xs text-red-500">disqualified</span>}
                      {!b.eligible && !b.disqualified && <span className="ml-2 text-xs opacity-70">not qualifying yet</span>}
                    </p>
                    <p className="text-sm font-bold">{b.total}/100</p>
                  </div>
                  <p className="mt-1 text-xs opacity-75">
                    {b.words.toLocaleString()} words · {b.readers} readers ({b.returning_readers} returned) · {b.rating_n} ratings
                    {b.rating_avg ? ` (${b.rating_avg}★)` : ""} · {b.commenters} commenters · {b.library_adds} library adds ·{" "}
                    {b.new_followers} new followers · {b.votes} votes · judges {b.judge_avg ?? "-"} ({b.judge_n})
                  </p>

                  {!own && !b.disqualified && (
                    <form action={scoreEntryAction} className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                      <input type="hidden" name="sprintId" value={sprint.id} />
                      <input type="hidden" name="storyId" value={b.story_id} />
                      <input name="score" type="number" min={0} max={10} step={0.25} defaultValue={mine?.score as number | undefined} placeholder="0-10" required className="w-24 rounded-lg border bg-transparent p-2" style={input} />
                      <input name="note" defaultValue={(mine?.note as string) ?? ""} maxLength={1000} placeholder="Private note" className="min-w-0 flex-1 rounded-lg border bg-transparent p-2" style={input} />
                      <button type="submit" className="rounded-lg px-3 py-2 text-xs font-semibold" style={btn}>
                        Save score
                      </button>
                    </form>
                  )}

                  {isAdmin && (
                    <form action={disqualifyAction} className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <input type="hidden" name="sprintId" value={sprint.id} />
                      <input type="hidden" name="storyId" value={b.story_id} />
                      <input type="hidden" name="dq" value={b.disqualified ? "0" : "1"} />
                      {!b.disqualified && (
                        <input name="reason" maxLength={500} placeholder="Reason (private)" className="min-w-0 flex-1 rounded-lg border bg-transparent p-1.5" style={input} />
                      )}
                      <button type="submit" className="underline underline-offset-4 opacity-80 hover:opacity-100">
                        {b.disqualified ? "Restore entry" : "Disqualify"}
                      </button>
                    </form>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {board.length === 0 && <p className="text-sm opacity-70">No entries yet.</p>}
    </main>
  );
}
