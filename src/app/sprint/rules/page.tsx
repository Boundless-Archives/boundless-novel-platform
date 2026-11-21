import Link from "next/link";
import SectionHeader from "@/components/layout/SectionHeader";
import HearthDivider from "@/components/winter/HearthDivider";
import { nowMs } from "@/lib/guilds";
import { getCurrentSprint } from "@/lib/sprint";
import { lastDayLabel, naira, prizeCloseMs, type PrizeSprint } from "@/lib/prize";

export const metadata = { title: "Winter Prize Track: Rules" };

function Block({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="mt-8 scroll-mt-20">
      <h2 className="text-xl font-bold">{title}</h2>
      <div className="mt-2 space-y-2 text-sm leading-relaxed opacity-90">{children}</div>
    </section>
  );
}

export default async function PrizeRulesPage() {
  const current = await getCurrentSprint(new Date(nowMs()).toISOString());
  const s = current?.sprint as PrizeSprint | undefined;

  if (!s || !s.prize_enabled) {
    return (
      <main className="max-w-2xl mx-auto px-6 py-10">
        <SectionHeader icon="📜" title="Prize Track rules" description="There is no Prize Track running right now." />
      </main>
    );
  }

  const closeIso = new Date(prizeCloseMs(s)).toISOString();
  const start = new Date(s.starts_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Lagos" });
  const card = { borderColor: "var(--card-border)", backgroundColor: "var(--card)" };

  const weights: [string, number, string][] = [
    ["Judges", s.w_judges, "Our judges read and score each qualifying story for craft, voice, how well it answers its prompt and how much it makes them want the next chapter."],
    ["Real reading", s.w_reading, "How many different counted readers finished the required chapters, and how many of them came back on another day."],
    ["Ratings", s.w_ratings, "Star ratings from counted readers. A rating counts for more as more people rate, so one 5-star does not beat many 4-stars."],
    ["Community", s.w_community, "Different counted readers who comment, add the story to their library, or follow the author during the contest."],
    ["Votes", s.w_votes, "Valid votes. Votes carry the smallest weight, so a story cannot win on votes alone."],
  ];

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <SectionHeader icon="📜" title="Winter Prize Track: the rules" description="Everything in one place, so nobody is surprised at the end." />

      <div className="-mt-3 mb-4 flex flex-wrap gap-4 text-sm">
        <Link href="/sprint/prizes" className="font-semibold underline underline-offset-4">
          Back to the Prize Track
        </Link>
      </div>

      <nav className="rounded-2xl border p-4 text-sm" style={card}>
        <p className="font-semibold">In short</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 opacity-90">
          <li>Enter one new story, written to a prompt in its genre. Entry is free.</li>
          <li>
            Prizes: 1st {naira(s.prize_1)}, 2nd {naira(s.prize_2)}, 3rd {naira(s.prize_3)}.
          </li>
          <li>
            To win, your story needs {s.prize_min_words.toLocaleString()}+ words by {lastDayLabel(s.ends_at)} and at least{" "}
            {s.prize_min_readers} real readers.
          </li>
          <li>
            Readers vote after finishing {s.vote_min_chapters} chapters. One vote each. Votes are only {s.w_votes}% of the score.
          </li>
          <li>Judges carry the most weight ({s.w_judges}%).</li>
        </ul>
      </nav>

      <Block id="dates" title="1. Dates">
        <ul className="list-disc pl-5">
          <li>The contest starts on {start}.</li>
          <li>Entries and the word-count deadline: end of {lastDayLabel(s.ends_at)} (West Africa Time).</li>
          <li>Reading, rating and voting stay open until the end of {lastDayLabel(closeIso)}.</li>
          <li>Judging follows, and winners are announced here and by notification after that.</li>
        </ul>
      </Block>

      <Block id="enter" title="2. Who can enter and what can be entered">
        <ul className="list-disc pl-5">
          <li>Entry is free. No purchase or payment is needed, ever.</li>
          <li>You need an author account in good standing. You must be 18 or older to receive a cash prize.</li>
          <li>One entry per writer, and one story per entry.</li>
          <li>
            The story must be new: created on or after {start}. It must be published (drafts cannot enter), original, and
            written by you. You can withdraw until entries close.
          </li>
          <li>The “Hook” in each prompt is a suggestion, not a requirement. Judges reward how well the story answers the prompt&apos;s spirit.</li>
          <li>
            Pick a prompt, and give your story that prompt&apos;s genre. You are ranked against the other stories in that
            genre.
          </li>
          <li>
            Entries must follow the site&apos;s Terms. Plagiarised work, work copied from other writers or sources, and
            text that is generated in bulk and posted without real authorship are not allowed.
          </li>
        </ul>
      </Block>

      <Block id="qualify" title="3. What a story needs to be eligible for a prize">
        <p>Being first on the board is not enough. By the deadlines, an entry must also have:</p>
        <ul className="list-disc pl-5">
          <li>
            <strong>{s.prize_min_words.toLocaleString()} words</strong> across its published chapters by the end of{" "}
            {lastDayLabel(s.ends_at)}.
          </li>
          <li>
            <strong>{s.prize_min_readers} counted readers</strong> by the end of {lastDayLabel(closeIso)}. A counted reader
            is someone who finished at least {s.vote_min_chapters} chapters of your story, is not you, and has an account
            older than {s.vote_min_account_hours} hours.
          </li>
          <li>No disqualification (see section 8).</li>
        </ul>
        <p>You can see your own progress on these on the Prize Track page.</p>
      </Block>

      <Block id="voting" title="4. How voting works">
        <ul className="list-disc pl-5">
          <li>You have one vote for the whole contest. It goes to one story.</li>
          <li>
            To vote, you must be signed in, have an account older than {s.vote_min_account_hours} hours, and have finished at
            least {s.vote_min_chapters} chapters of the story you are voting for.
          </li>
          <li>You cannot vote for your own story.</li>
          <li>You can move your vote to another story until voting closes. Your old vote is removed when you do.</li>
          <li>
            You can still help other stories you love without voting for them: leave a rating, comment, add the story to
            your library, or follow the author. These are scored separately, with more weight than a vote.
          </li>
          <li>Votes from accounts that do not meet these rules are not counted.</li>
        </ul>
      </Block>

      <Block id="ranking" title="5. How the final score works">
        <p>Each qualifying story gets a score out of 100, made up like this:</p>
        <div className="overflow-hidden rounded-2xl border" style={card}>
          {weights.map(([name, w, text]) => (
            <div key={name} className="flex gap-4 border-b p-4 last:border-b-0" style={{ borderColor: "var(--card-border)" }}>
              <p className="w-16 shrink-0 text-2xl font-bold">{w}%</p>
              <div>
                <p className="font-semibold">{name}</p>
                <p className="text-sm opacity-80">{text}</p>
              </div>
            </div>
          ))}
        </div>
        <p>
          Each part is compared against the best qualifying story in the same genre, so a popular genre does not crowd out
          a quieter one. Only counted accounts (see sections 3 and 4) add to reading, ratings, community and votes.
          Activity from the author&apos;s own account does not count.
        </p>
      </Block>

      <Block id="winners" title="6. How the winners are chosen">
        <ul className="list-disc pl-5">
          <li>Every genre has a ranking. The top qualifying story in each genre is a genre winner.</li>
          <li>
            The judges then choose the overall 1st, 2nd and 3rd places from the genre winners, using the scores above and
            a final read.
          </li>
          <li>Before any prize is paid, the top entries are checked for fair play.</li>
          <li>Judges&apos; decisions are final.</li>
        </ul>
      </Block>

      <Block id="prizes" title="7. Prizes and payment">
        <ul className="list-disc pl-5">
          <li>
            1st place {naira(s.prize_1)}, 2nd place {naira(s.prize_2)}, 3rd place {naira(s.prize_3)}.
          </li>
          <li>
            Winners are contacted through the site. Prizes are paid by bank transfer to an account in the winner&apos;s own
            name, after identity and fair-play checks. Please allow a reasonable time after the announcement.
          </li>
          <li>If a winner cannot be reached or verified within a reasonable time, the prize may go to the next qualifying entry.</li>
          <li>Winners also receive the Winter Laureate badge.</li>
          <li>Any taxes that apply to a prize are the winner&apos;s responsibility.</li>
        </ul>
      </Block>

      <Block id="fair" title="8. Fair play and disqualification">
        <p>We may remove an entry, discard votes or other activity, and withhold a prize if we find or reasonably suspect:</p>
        <ul className="list-disc pl-5">
          <li>fake or duplicate accounts, or accounts created to vote, rate or comment;</li>
          <li>votes, ratings, comments or reads that are bought, traded or otherwise arranged in bulk;</li>
          <li>automated or scripted reading or voting;</li>
          <li>plagiarism, or work that is not the entrant&apos;s own;</li>
          <li>harassment or any breach of the site Terms.</li>
        </ul>
        <p>
          You are welcome to share your story with friends and invite them to read it. Real readers are the point. We
          just need them to be real.
        </p>
      </Block>

      <Block id="terms" title="9. Terms and conditions">
        <ul className="list-disc pl-5">
          <li>By entering you accept these rules and the site Terms and Privacy policy.</li>
          <li>You keep full ownership and rights to your story. You allow us to feature the entry and the winning stories, with your name and cover, on the site and our social channels.</li>
          <li>Judges and site staff who enter are not eligible for prizes, and judges do not score their own stories.</li>
          <li>We may adjust dates, thresholds or rules if needed to keep the contest fair, and we will post the change here. A change never reduces a prize that has been announced.</li>
          <li>We may cancel or pause the contest if it cannot be run fairly.</li>
          <li>This contest is not sponsored or endorsed by any third party.</li>
        </ul>
      </Block>

      <HearthDivider />
      <p className="text-center text-sm opacity-70">
        Questions? Reach us through the contact link in the footer.
      </p>
    </main>
  );
}
