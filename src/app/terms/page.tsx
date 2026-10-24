import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { getPublicSettings } from "@/lib/platform";

export const metadata = { title: "Terms of Service" };

export default async function TermsPage() {
  const s = await getPublicSettings();
  const name = s.platform_name;

  return (
    <LegalPage
      title="Terms of Service"
      updated="October 24, 2026"
      intro={`These terms are the agreement between you and ${name} (“we”, “us”). By creating an account or using the site, you agree to them. If you don't agree, please don't use the site.`}
    >
      <LegalSection title="1. Your account">
        <ul>
          <li>You must be at least 13 years old. If you are under 18, you confirm a parent or guardian is happy for you to use the site.</li>
          <li>Give accurate information, keep your password private, and don&apos;t share your account. You are responsible for what happens under it.</li>
          <li>Usernames are unique and cannot be changed once set. You may not impersonate someone else.</li>
          <li>One person, one account. Creating extra accounts to farm rewards, ranks or gifts is not allowed.</li>
        </ul>
      </LegalSection>

      <LegalSection title="2. Reading and the community">
        <p>
          Comments, reviews and reactions are public. Be respectful. Critique the writing, not the person, and keep spoilers out of places where readers don&apos;t expect them.
        </p>
      </LegalSection>

      <LegalSection title="3. Your writing">
        <ul>
          <li><strong>You own your work.</strong> We don&apos;t claim ownership of stories, chapters or anything else you post.</li>
          <li>You give us a non-exclusive, worldwide licence to host, display, format, back up, and distribute your work on and through {name} (including reader apps, notifications, previews and offline reading) for as long as you keep it on the site. You can remove your work at any time, and the licence ends once it is removed from our systems, except for copies that readers have already saved for personal offline use and backups that expire in the ordinary course.</li>
          <li>Post only work you wrote yourself or have the right to share. Copying someone else&apos;s writing, in whole or in part, is plagiarism and will be removed.</li>
          <li>You are responsible for what you post.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. What is not allowed">
        <ul>
          <li>Anything illegal, and any sexual content involving minors (this is removed immediately and may be reported to the authorities).</li>
          <li>Harassment, threats, hate speech, doxxing, or targeting anyone for who they are.</li>
          <li>Spam, scams, or unrequested advertising.</li>
          <li>Plagiarised or stolen work, or work that infringes someone else&apos;s rights.</li>
          <li>Trying to break, overload or gain unauthorised access to the site, or to cheat streaks, quests, reading counts, leaderboards or gifts (for example with bots, scripts, or fake accounts).</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Moderation">
        <p>
          Anyone can report comments, reviews and profiles, and plagiarism has its own report form. We may remove content, hide it, or restrict, suspend or close accounts that break these terms, with or without warning where the breach is serious. If you think we got it wrong, contact us and we will look again.
        </p>
      </LegalSection>

      <LegalSection title="6. Embers and Sparks">
        <ul>
          <li><strong>Sparks</strong> are a free in-app reward earned through activity. They have no cash value, can&apos;t be bought, sold or withdrawn, and are used only for items in the shop and similar features.</li>
          <li><strong>Embers</strong> are a virtual currency used to gift authors and buy shop items. Embers are not money, don&apos;t earn interest, and readers cannot withdraw or refund them for cash.</li>
          <li>Where we offer Embers for sale, purchases are final except where the law says otherwise.</li>
          <li>We may change what things cost, how rewards work, and how much Sparks and Embers are worth for new activity. We may correct balances that were wrong or obtained through errors, abuse or fraud.</li>
          <li>If your account is closed for breaking these terms, you may lose your balances.</li>
        </ul>
      </LegalSection>

      <LegalSection title="7. Author earnings">
        <p>
          Authors may be able to receive Embers as gifts and, when we offer it, turn them into real-money payouts. If and when that is available, it is subject to additional payout terms (including minimum amounts, verification, holding periods, fees and taxes), which we will publish before it starts. Earnings can be withheld or reversed where a payment is refunded, charged back, or obtained fraudulently.
        </p>
      </LegalSection>

      <LegalSection title="8. Copyright and takedown requests">
        <p>
          If you believe work on {name} copies your work or infringes your rights, tell us which work, where it appears, and why, using the plagiarism report on the story page or by email{s.support_email ? <> to <a href={`mailto:${s.support_email}`}>{s.support_email}</a></> : null}. We may remove the content while we look into it, and we may close accounts that repeatedly infringe.
        </p>
      </LegalSection>

      <LegalSection title="9. The service">
        <p>
          We work hard to keep {name} running but can&apos;t promise it will always be available, error-free, or that nothing will ever be lost. We may change, pause or end features. Keep your own copies of anything you can&apos;t afford to lose.
        </p>
      </LegalSection>

      <LegalSection title="10. Liability">
        <p>
          The site is provided “as is”. To the extent the law allows, we are not responsible for indirect or consequential losses, for what other users post, or for losses from things outside our control. Nothing in these terms limits liability that cannot legally be limited.
        </p>
      </LegalSection>

      <LegalSection title="11. Governing law">
        <p>
          These terms are governed by the laws of the Federal Republic of Nigeria, and disputes will be handled by the courts there, unless a consumer law in your own country gives you the right to use its courts.
        </p>
      </LegalSection>

      <LegalSection title="12. Changes">
        <p>
          We may update these terms. If the change is significant we will tell you on the site. Using {name} after a change means you accept it.
        </p>
      </LegalSection>

      <LegalSection title="13. Contact">
        <p>
          {s.support_email ? (
            <>
              Questions or complaints: <a href={`mailto:${s.support_email}`}>{s.support_email}</a>.
            </>
          ) : (
            <>Questions or complaints: use the bug report button on any page.</>
          )}{" "}
          See also our <Link href="/privacy">Privacy Policy</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
