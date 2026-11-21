import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import SectionHeader from "@/components/layout/SectionHeader";
import HearthDivider from "@/components/winter/HearthDivider";
import { nowMs } from "@/lib/guilds";
import { getCurrentSprint } from "@/lib/sprint";
import {
  ENTER_MESSAGES,
  VOTE_MESSAGES,
  getGenreNames,
  getPrizeBoard,
  lastDayLabel,
  naira,
  prizeCloseMs,
  type PrizeSprint,
} from "@/lib/prize";
import { enterPrizeAction, votePrizeAction, withdrawPrizeAction } from "../prizeActions";

export const metadata = { title: "Winter Prize Track" };

export default async function PrizeTrackPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string; v?: string }>;
}) {
  const sp = await searchParams;
  const now = nowMs();
  const current = await getCurrentSprint(new Date(now).toISOString());
  const sprint = current?.sprint as PrizeSprint | undefined;

  if (!sprint || !sprint.prize_enabled) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <SectionHeader icon="🏆" title="Winter Prize Track" description="The Prize Track is not running right now." />
      </main>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const admin = createAdminClient();

  const entriesOpen = now >= new Date(sprint.starts_at).getTime() && now < new Date(sprint.ends_at).getTime();
  const votingOpen = now < prizeCloseMs(sprint) && !sprint.results_announced;
  const closeIso = new Date(prizeCloseMs(sprint)).toISOString();

  const [genres, board, promptsRes, awardsRes] = await Promise.all([
    getGenreNames(),
    getPrizeBoard(sprint.id),
    admin.from("sprint_prompts").select("id, genre_slug, title, body, sort").eq("sprint_id", sprint.id).order("sort"),
    admin.from("prize_awards").select("place, story_id").eq("sprint_id", sprint.id).order("place"),
  ]);
  const prompts = promptsRes.data ?? [];
  const promptById = new Map(prompts.map((p) => [p.id as string, p]));

  const storyIds = board.map((b) => b.story_id);
  const { data: storyRows } = storyIds.length
    ? await admin.from("stories").select("id, title, slug, cover_url, author_id").in("id", storyIds)
    : { data: [] };
  const stories = new Map((storyRows ?? []).map((s) => [s.id as string, s]));
  const authorIds = [...new Set((storyRows ?? []).map((s) => s.author_id as string))];
  const { data: people } = authorIds.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", authorIds)
    : { data: [] };
  const who = new Map((people ?? []).map((p) => [p.id as string, p]));

  let myEntry = null as (typeof board)[number] | null;
  let myVote: string | null = null;
  let myStories: { id: string; title: string; genres: string[] }[] = [];
  const checks = new Map<string, string>();

  if (user) {
    myEntry = board.find((b) => b.user_id === user.id) ?? null;

    const { data: v } = await admin
      .from("prize_votes")
      .select("story_id")
      .eq("sprint_id", sprint.id)
      .eq("voter_id", user.id)
      .maybeSingle();
    myVote = v?.story_id ?? null;

    if (!myEntry && entriesOpen) {
      const { data: mine } = await admin
        .from("stories")
        .select("id, title, status, created_at, story_genres(genres(slug))")
        .eq("author_id", user.id)
        .gte("created_at", sprint.starts_at)
        .neq("status", "Draft");
      myStories = (mine ?? []).map((s) => ({
        id: s.id as string,
        title: s.title as string,
        genres: ((s.story_genres ?? []) as unknown as { genres: { slug: string } | null }[])
          .map((g) => g.genres?.slug)
          .filter((x): x is string => !!x),
      }));
    }

    if (votingOpen) {
      await Promise.all(
        board
          .filter((b) => !b.disqualified)
          .map(async (b) => {
            const { data } = await admin.rpc("prize_vote_check", {
              p_sprint: sprint.id,
              p_user: user.id,
              p_story: b.story_id,
            });
            checks.set(b.story_id, String(data ?? "failed"));
          })
      );
    }
  }

  const byGenre = new Map<string, typeof board>();
  for (const b of board.filter((x) => !x.disqualified)) {
    byGenre.set(b.genre_slug, [...(byGenre.get(b.genre_slug) ?? []), b]);
  }
  for (const list of byGenre.values()) list.sort((a, b) => b.votes - a.votes || b.readers - a.readers);

  const promptGenres = [...new Set(prompts.map((p) => p.genre_slug as string))];
  const eNote = sp.e ? ENTER_MESSAGES[sp.e] ?? ENTER_MESSAGES.failed : null;
  const vNote = sp.v ? VOTE_MESSAGES[sp.v] ?? VOTE_MESSAGES.failed : null;
  const card = { borderColor: "var(--card-border)", backgroundColor: "var(--card)" };
  const btn = { backgroundColor: "var(--button)", color: "var(--button-text)" };
  const genreName = (slug: string) => genres.get(slug) ?? slug;

  const winners = sprint.results_announced
    ? (awardsRes.data ?? []).map((a) => ({ place: a.place as number, story: stories.get(a.story_id as string), id: a.story_id as string }))
    : [];
  // winners may not be on the board map if the story was withdrawn; fetch missing ones
  const missing = winners.filter((w) => !w.story).map((w) => w.id);
  if (missing.length) {
    const { data } = await admin.from("stories").select("id, title, slug, cover_url, author_id").in("id", missing);
    for (const s of data ?? []) stories.set(s.id as string, s);
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-10">
      <SectionHeader icon="🏆" title="Winter Prize Track" description="Write to a prompt, win cash prizes, and get readers voting for your story." />

      <div className="-mt-3 mb-6 flex flex-wrap gap-4 text-sm">
        <Link href="/sprint/rules" className="font-semibold underline underline-offset-4">
          Read the full rules
        </Link>
        <Link href="/sprint" className="underline underline-offset-4 opacity-80">
          Back to the sprint
        </Link>
      </div>

      {(eNote || vNote) && (
        <p className={`mb-4 text-sm ${(eNote ?? vNote)?.bad ? "text-red-500" : ""}`}>{(eNote ?? vNote)?.text}</p>
      )}

      {/* Prizes */}
      <section className="rounded-2xl border p-5 sm:p-6" style={card}>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            ["🥇", "1st", sprint.prize_1],
            ["🥈", "2nd", sprint.prize_2],
            ["🥉", "3rd", sprint.prize_3],
          ].map(([icon, label, amount]) => (
            <div key={String(label)}>
              <p className="text-2xl">{icon}</p>
              <p className="mt-1 text-xl font-bold sm:text-2xl">{naira(Number(amount))}</p>
              <p className="text-xs opacity-70">{label} place</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs opacity-70">
          Entries close {lastDayLabel(sprint.ends_at)} · voting and reading close {lastDayLabel(closeIso)} · terms and conditions apply
        </p>
      </section>

      {winners.length > 0 && (
        <section className="mt-6 rounded-2xl border p-5 sm:p-6" style={card}>
          <h2 className="text-lg font-bold">🎉 The winners</h2>
          <ol className="mt-3 space-y-2">
            {winners.map((w) => {
              const a = w.story ? who.get(w.story.author_id as string) : null;
              return (
                <li key={w.place} className="flex items-baseline gap-3">
                  <span className="w-12 font-semibold">{["🥇", "🥈", "🥉"][w.place - 1]}</span>
                  {w.story ? (
                    <Link href={`/story/${w.story.slug}`} className="font-semibold underline underline-offset-4">
                      {w.story.title}
                    </Link>
                  ) : (
                    <span>Story</span>
                  )}
                  {a && <span className="text-sm opacity-70">by {a.display_name || a.username}</span>}
                </li>
              );
            })}
          </ol>
        </section>
      )}

      <HearthDivider />

      {/* My entry / enter */}
      <section className="rounded-2xl border p-5 sm:p-6" style={card}>
        <h2 className="text-lg font-bold">Your entry</h2>

        {!user ? (
          <p className="mt-2 text-sm opacity-80">
            <Link href="/auth/login" className="underline underline-offset-4">
              Sign in
            </Link>{" "}
            to enter or vote.
          </p>
        ) : myEntry ? (
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <span className="font-semibold">{stories.get(myEntry.story_id)?.title}</span> ·{" "}
              {genreName(myEntry.genre_slug)} · prompt: “{promptById.get(myEntry.prompt_id)?.title}”
            </p>
            {myEntry.disqualified ? (
              <p className="text-red-500">This entry has been disqualified. See the rules for why entries can be removed.</p>
            ) : (
              <ul className="grid gap-1 sm:grid-cols-2">
                <li>
                  {myEntry.words >= sprint.prize_min_words ? "✅" : "⬜"} Words:{" "}
                  {myEntry.words.toLocaleString()} / {sprint.prize_min_words.toLocaleString()}
                </li>
                <li>
                  {myEntry.readers >= sprint.prize_min_readers ? "✅" : "⬜"} Readers: {myEntry.readers} /{" "}
                  {sprint.prize_min_readers}
                </li>
                <li>🗳️ Votes: {myEntry.votes}</li>
                <li>
                  {myEntry.eligible ? "✅ You currently qualify for a prize." : "⬜ Not yet qualifying for a prize."}
                </li>
              </ul>
            )}
            <p className="text-xs opacity-70">
              Word count is measured when entries close. A reader counts once they have finished{" "}
              {sprint.vote_min_chapters} chapters of your story.
            </p>
            {entriesOpen && (
              <form action={withdrawPrizeAction}>
                <input type="hidden" name="sprintId" value={sprint.id} />
                <button type="submit" className="text-xs underline underline-offset-4 opacity-70 hover:opacity-100">
                  Withdraw my entry
                </button>
              </form>
            )}
          </div>
        ) : !entriesOpen ? (
          <p className="mt-2 text-sm opacity-80">Entries are closed.</p>
        ) : myStories.length === 0 ? (
          <p className="mt-2 text-sm opacity-80">
            To enter you need a published story that you started on or after{" "}
            {new Date(sprint.starts_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Africa/Lagos" })}{" "}
            with a genre that matches a prompt below.{" "}
            <Link href="/stories" className="underline underline-offset-4">
              Go to your stories
            </Link>
            .
          </p>
        ) : (
          <form action={enterPrizeAction} className="mt-3 space-y-3 text-sm">
            <input type="hidden" name="sprintId" value={sprint.id} />
            <label className="block">
              <span className="mb-1 block font-semibold">Your story</span>
              <select name="storyId" required className="w-full rounded-lg border bg-transparent p-2" style={{ borderColor: "var(--card-border)" }}>
                {myStories.map((s) => (
                  <option key={s.id} value={s.id} className="text-black">
                    {s.title}
                    {s.genres.length ? ` (${s.genres.map(genreName).join(", ")})` : " (no genre set)"}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-semibold">Prompt</span>
              <select name="promptId" required className="w-full rounded-lg border bg-transparent p-2" style={{ borderColor: "var(--card-border)" }}>
                {promptGenres.map((g) => (
                  <optgroup key={g} label={genreName(g)}>
                    {prompts
                      .filter((p) => p.genre_slug === g)
                      .map((p) => (
                        <option key={p.id as string} value={p.id as string} className="text-black">
                          {p.title as string}
                        </option>
                      ))}
                  </optgroup>
                ))}
              </select>
            </label>
            <p className="text-xs opacity-70">
              One story per writer. Your story must carry the prompt&apos;s genre. You may withdraw until entries close.
            </p>
            <button type="submit" className="rounded-lg px-5 py-2 font-semibold" style={btn}>
              Enter the Prize Track
            </button>
          </form>
        )}
      </section>

      {/* Prompts */}
      <section className="mt-10">
        <h2 className="text-xl font-bold">The prompts</h2>
        <p className="mt-1 text-sm opacity-75">Pick one prompt in your story&apos;s genre. The “Hook” is a suggested twist: use it, bend it, or build your own. Treat the prompt as a spark, not a cage.</p>
        <div className="mt-4 space-y-3">
          {promptGenres.map((g) => (
            <details key={g} className="rounded-2xl border p-4" style={card}>
              <summary className="cursor-pointer font-semibold">{genreName(g)}</summary>
              <ul className="mt-3 space-y-3">
                {prompts
                  .filter((p) => p.genre_slug === g)
                  .map((p) => (
                    <li key={p.id as string}>
                      <p className="font-semibold">{p.title as string}</p>
                      <p className="text-sm opacity-80">{p.body as string}</p>
                    </li>
                  ))}
              </ul>
            </details>
          ))}
        </div>
      </section>

      <HearthDivider />

      {/* Entries and voting */}
      <section>
        <h2 className="text-xl font-bold">Entries</h2>
        <p className="mt-1 text-sm opacity-75">
          Each story is ranked against others in its own genre. Votes are one part of the final score (see the{" "}
          <Link href="/sprint/rules" className="underline underline-offset-4">
            rules
          </Link>
          ). To vote you must finish {sprint.vote_min_chapters} chapters of the story, and you have one vote.
        </p>

        {byGenre.size === 0 ? (
          <p className="mt-4 text-sm opacity-70">No entries yet. Be the first.</p>
        ) : (
          [...byGenre.entries()].map(([g, list]) => (
            <div key={g} className="mt-6">
              <h3 className="font-semibold">{genreName(g)}</h3>
              <ul className="mt-2 space-y-3">
                {list.map((b) => {
                  const st = stories.get(b.story_id);
                  const a = st ? who.get(st.author_id as string) : null;
                  const status = checks.get(b.story_id);
                  return (
                    <li key={b.story_id} className="flex items-center gap-4 rounded-2xl border p-3" style={card}>
                      {st?.cover_url ? (
                        <Image src={st.cover_url as string} alt="" width={48} height={72} className="h-[72px] w-12 rounded object-cover" />
                      ) : (
                        <div className="h-[72px] w-12 rounded" style={{ backgroundColor: "var(--accent-soft)" }} />
                      )}
                      <div className="min-w-0 flex-1">
                        {st ? (
                          <Link href={`/story/${st.slug}`} className="block truncate font-semibold hover:underline">
                            {st.title as string}
                          </Link>
                        ) : (
                          <span className="font-semibold">Story</span>
                        )}
                        <p className="truncate text-xs opacity-70">
                          {a ? `by ${a.display_name || a.username} · ` : ""}“{promptById.get(b.prompt_id)?.title}”
                        </p>
                        <p className="mt-1 text-xs opacity-70">
                          🗳️ {b.votes} {b.votes === 1 ? "vote" : "votes"} · 📖 {b.readers} {b.readers === 1 ? "reader" : "readers"}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        {votingOpen && user && myVote === b.story_id ? (
                          <span className="text-xs font-semibold">✓ Your vote</span>
                        ) : votingOpen && user && status === "ok" ? (
                          <form action={votePrizeAction}>
                            <input type="hidden" name="sprintId" value={sprint.id} />
                            <input type="hidden" name="storyId" value={b.story_id} />
                            <input type="hidden" name="back" value="/sprint/prizes" />
                            <button type="submit" className="rounded-lg px-3 py-1.5 text-xs font-semibold" style={btn}>
                              {myVote ? "Move vote" : "Vote"}
                            </button>
                          </form>
                        ) : votingOpen && user && st ? (
                          <Link href={`/story/${st.slug}`} className="text-xs underline underline-offset-4 opacity-80">
                            {status === "noread" ? `Read ${sprint.vote_min_chapters} chapters to vote` : "Open story"}
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))
        )}
      </section>
    </main>
  );
}
