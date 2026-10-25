import Link from "next/link";
import LegalPage, { LegalSection } from "@/components/legal/LegalPage";
import { getPublicSettings } from "@/lib/platform";

export const metadata = { title: "Privacy Policy" };

export default async function PrivacyPage() {
  const s = await getPublicSettings();
  const name = s.platform_name;

  return (
    <LegalPage
      title="Privacy Policy"
      updated="October 26, 2026"
      intro={`This explains what ${name} collects about you, why, and what you can do about it. We collect what we need to run the site and nothing we plan to sell.`}
    >
      <LegalSection title="What we collect">
        <ul>
          <li><strong>Account details:</strong> your email address, username, display name, bio, profile picture, time zone and sign-in method (email and password, or Google).</li>
          <li><strong>What you post:</strong> stories, chapters, comments, reviews, reactions, poll votes, and your followers and library.</li>
          <li><strong>How you use the site:</strong> which chapters you open and finish, reading progress, streaks, quests, badges, cultivation progress, wallet and Sparks activity, notifications, and the days you were active. This powers features like Continue Reading, streaks, leaderboards and author statistics.</li>
          <li><strong>Technical data:</strong> device and browser information, and a push notification token if you turn notifications on.</li>
          <li><strong>Support messages:</strong> bug reports and content reports you send us.</li>
        </ul>
      </LegalSection>

      <LegalSection title="How we use it">
        <ul>
          <li>To run your account and the features you use.</li>
          <li>To show authors how their stories are doing (counts such as views and chapters finished, not who you are).</li>
          <li>To send notifications and, if you haven&apos;t turned it off, a short weekly digest (you can switch the digest off in your profile settings).</li>
          <li>To keep the site safe: spotting abuse, cheating and fraud, and handling reports.</li>
          <li>To fix errors and improve the site.</li>
        </ul>
      </LegalSection>

      <LegalSection title="What other people can see">
        <p>
          Your username, display name, profile picture, bio, public activity such as comments and reviews, and your stories are visible to others. Your email address is never shown. Your profile can be hidden from search in your settings. Leaderboards show your display name, and hidden profiles are not ranked.
        </p>
      </LegalSection>

      <LegalSection title="Private messages">
        <p>
          Messages are private between you and the person you write to. We don&apos;t read them as a matter of course. If someone reports a message they received, our team can see that message and a few lines around it to decide what to do. Deleting a conversation removes it from your side; it is erased completely once both people have deleted it. You can choose who may message you, and block anyone, in your settings and conversations.
        </p>
      </LegalSection>

      <LegalSection title="Who we share data with">
        <p>
          We don&apos;t sell your personal data. We use trusted service providers to run the site, such as hosting, our database and sign-in system, email delivery, and payment processing if you buy Embers. They handle your data only on our behalf and under their own confidentiality and security obligations. Some of them may be located outside your country.
        </p>
        <p>A few features involve a third party you choose to use:</p>
        <ul>
          <li>Signing in with Google, if you pick that option.</li>
          <li>Offers from our partners, if you choose to complete them for Embers. They receive an identifier for your account, not your email.</li>
        </ul>
        <p>We may also share information when the law requires it or to protect people and the site.</p>
      </LegalSection>

      <LegalSection title="Cookies and local storage">
        <p>
          We use cookies to keep you signed in and local storage to remember things like your theme and reading preferences. We don&apos;t use them for advertising.
        </p>
      </LegalSection>

      <LegalSection title="How long we keep it">
        <p>
          We keep your account data while your account exists. Error logs are deleted after a limited time. Some records, such as financial transactions and moderation reports, may be kept longer where we need them for legal, safety or accounting reasons. Backups expire in the ordinary course.
        </p>
      </LegalSection>

      <LegalSection title="Your choices and rights">
        <p>
          You can edit your profile, hide it from search, and turn the weekly digest and notifications off in the app. You can ask us to give you a copy of your data, correct it, or delete your account{s.support_email ? <> by writing to <a href={`mailto:${s.support_email}`}>{s.support_email}</a></> : null}. Under the Nigeria Data Protection Act and similar laws elsewhere you may also have the right to object to or restrict some processing. If you are unhappy with how we handle your data you can complain to your local data protection authority.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          {name} is not for children under 13, and we don&apos;t knowingly collect their data. If you think a child under 13 has signed up, contact us and we will remove the account.
        </p>
      </LegalSection>

      <LegalSection title="Security and where data is stored">
        <p>
          We use access controls and encryption in transit, but no system is perfectly secure. Our providers may store data in other countries, and we rely on them to protect it appropriately.
        </p>
      </LegalSection>

      <LegalSection title="Changes">
        <p>
          If we change this policy in a significant way we will tell you on the site. The date at the top shows the latest version.
        </p>
      </LegalSection>

      <LegalSection title="Contact">
        <p>
          {s.support_email ? (
            <>
              Privacy questions: <a href={`mailto:${s.support_email}`}>{s.support_email}</a>.
            </>
          ) : (
            <>Privacy questions: use the bug report button on any page.</>
          )}{" "}
          See also our <Link href="/terms">Terms of Service</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
