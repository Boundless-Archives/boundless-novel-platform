import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import SectionHeader from "@/components/layout/SectionHeader";
import SprintProgressBar from "@/components/winter/SprintProgressBar";
import WinterToggle from "@/components/winter/WinterToggle";
import { nowMs } from "@/lib/guilds";
import { TIER_META, getCurrentSprint, getSprintProgress, tierFor } from "@/lib/sprint";
import { joinSprintAction } from "./actions";

export const metadata = { title: "Winter Writing Sprint" };

const MESSAGES: Record<string, { text: string; bad?: boolean }> = {
  ok: { text: "🎉 You're in! Chapters you've already published in the window count straight away." },
  already: { text: "You've already joined." },
  author: { text: "Only authors can join. Start a story first, then come back.", bad: true },
  closed: { text: "This sprint has finished.", bad: true },
  failed: { text: "Something went wrong. Please try again.", bad: true },
};

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });

export default async function SprintPage({
  searchParams,
}: {
  searchParams: Promise<{ j?: string }>;
}) {
  const sp = await searchParams;
  const now = nowMs();

  const current = await getCurrentSprint(new Date(now).toISOString());

  if (!current) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <SectionHeader icon="❄️" title="Winter Writing Sprint" description="No sprint is running right now. Check back soon." />
      </main>
    );
  }

  const { sprint, live } = current;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const [progress, standingsRes, profileRes] = await Promise.all([
    user ? getSprintProgress(sprint.id, user.id) : Promise.resolve({ joined: false, chapters: 0 }),
    admin.rpc("sprint_standings", { p_sprint: sprint.id, p_limit: 25 }),
    user
      ? admin.from("profiles").select("is_author").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const standings = (standingsRes.data ?? []) as { user_id: string; chapters: number }[];

  const ids = standings.map((s) => s.user_id);
  const { data: people } = ids.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", ids)
    : { data: [] };
  const who = new Map((people ?? []).map((p) => [p.id, p]));

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(sprint.ends_at).getTime() - now) / 86400000)
  );
  const myTier = tierFor(sprint, progress.chapters);
  const goals = [sprint.tier1_goal, sprint.tier2_goal, sprint.tier3_goal];
  const rewards = [sprint.reward_tier1, sprint.reward_tier2, sprint.reward_tier3];
  const nextGoal = goals.find((g) => progress.chapters < g);

  const note = sp.j ? MESSAGES[sp.j] ?? MESSAGES.failed : null;
  const border = { borderColor: "var(--card-border)" };
  const btn = { backgroundColor: "var(--button)", color: "var(--button-text)" };

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <SectionHeader icon="❄️" title={sprint.title} description={sprint.description} />

      <p className="-mt-2 mb-6 text-sm opacity-70">
        {fmtDate(sprint.starts_at)} to {fmtDate(new Date(new Date(sprint.ends_at).getTime() - 60000).toISOString())}
        {live ? ` · ${daysLeft} ${daysLeft === 1 ? "day" : "days"} left` : " · finished"}
      </p>

      {note && <p className={`mb-4 text-sm ${note.bad ? "text-red-500" : ""}`}>{note.text}</p>}

      {(sprint as unknown as { prize_enabled?: boolean }).prize_enabled && (
        <Link
          href="/sprint/prizes"
          className="mb-6 block rounded-2xl border p-5 sm:p-6"
          style={{ ...border, backgroundColor: "var(--card)" }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide opacity-70">🏆 New: Winter Prize Track</p>
          <p className="mt-1 text-lg font-bold">Write to a prompt and win up to ₦20,000</p>
          <p className="mt-1 text-sm opacity-80">
            Genre prompts, reader voting and judges. Cash prizes for 1st, 2nd and 3rd. See the prompts, enter your story and read the rules →
          </p>
        </Link>
      )}

      <section className="rounded-2xl border p-5 sm:p-6" style={{ ...border, backgroundColor: "var(--card)" }}>
        {!user ? (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm opacity-80">Sign in to join the sprint and track your chapters.</p>
            <Link href="/auth/login" className="rounded-lg px-4 py-2 text-sm font-semibold" style={btn}>
              Sign in
            </Link>
          </div>
        ) : progress.joined ? (
          <>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="font-semibold">Your sprint</h2>
              <span className="text-sm opacity-70">
                {myTier > 0 ? `${TIER_META[myTier - 1].icon} ${TIER_META[myTier - 1].name}` : "Just getting started"}
              </span>
            </div>
            <p className="mt-2 text-3xl font-bold">
              {progress.chapters}{" "}
              <span className="text-base font-normal opacity-70">
                {progress.chapters === 1 ? "chapter" : "chapters"}
              </span>
            </p>
            <SprintProgressBar sprint={sprint} chapters={progress.chapters} />
            <p className="mt-2 text-sm opacity-75">
              {nextGoal
                ? `${nextGoal - progress.chapters} more to reach ${TIER_META[goals.indexOf(nextGoal)].name}.`
                : "You've completed every tier. Remarkable."}
            </p>
            {live && (
              <Link href="/stories" className="mt-4 inline-block text-sm font-semibold underline underline-offset-4">
                Go write →
              </Link>
            )}
          </>
        ) : !live ? (
          <p className="text-sm opacity-80">This sprint has finished.</p>
        ) : profileRes.data?.is_author ? (
          <form action={joinSprintAction} className="flex flex-wrap items-center justify-between gap-3">
            <input type="hidden" name="sprintId" value={sprint.id} />
            <p className="text-sm opacity-80">
              Join to appear on the board and earn winter badges. Chapters you&apos;ve already published in the window count.
            </p>
            <button type="submit" className="rounded-lg px-5 py-2 text-sm font-semibold" style={btn}>
              Join the sprint
            </button>
          </form>
        ) : (
          <p className="text-sm opacity-80">
            The sprint is for authors.{" "}
            <Link href="/profile/become-author" className="underline underline-offset-4">
              Become an author
            </Link>{" "}
            to take part and start writing.
          </p>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">Tiers &amp; rewards</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {TIER_META.map((t, i) => (
            <div key={t.key} className="rounded-xl border p-4 text-center" style={border}>
              <p className="text-3xl">{t.icon}</p>
              <p className="mt-1 font-semibold">{t.name}</p>
              <p className="text-sm opacity-70">{goals[i]} chapters</p>
              <p className="mt-2 text-xs opacity-60">
                Badge{rewards[i] > 0 ? ` + ${rewards[i]} Sparks` : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">How it counts</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm opacity-85">
          <li>Published chapters of {sprint.min_words}+ words count, one each.</li>
          <li>Only chapters published inside the sprint dates count. Scheduled chapters count when they go live.</li>
          <li>Drafts, very short chapters and chapters from before the sprint don&apos;t.</li>
          <li>Badges arrive automatically the moment you reach a tier.</li>
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-bold">The board</h2>
        {standings.length === 0 ? (
          <p className="mt-3 text-sm opacity-70">Nobody has joined yet. Be the first.</p>
        ) : (
          <ol className="mt-3 divide-y" style={border}>
            {standings.map((s, i) => {
              const p = who.get(s.user_id);
              const tier = tierFor(sprint, s.chapters);
              return (
                <li key={s.user_id} className="flex items-center gap-3 py-2.5 text-sm" style={border}>
                  <span className="w-6 text-right opacity-60">{i + 1}</span>
                  {p ? (
                    <Link href={`/author/${p.username}`} className="min-w-0 flex-1 truncate font-medium hover:underline">
                      {p.display_name || p.username}
                    </Link>
                  ) : (
                    <span className="min-w-0 flex-1 truncate">A writer</span>
                  )}
                  <span title={tier > 0 ? TIER_META[tier - 1].name : ""}>
                    {tier > 0 ? TIER_META[tier - 1].icon : ""}
                  </span>
                  <span className="w-20 text-right font-semibold">
                    {s.chapters} ch
                  </span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <div className="mt-10">
        <WinterToggle />
      </div>
    </main>
  );
}
