import Link from "next/link";

export default function SiteFooter({
  name,
  supportEmail,
}: {
  name: string;
  supportEmail: string | null;
}) {
  return (
    <footer
      className="mt-16 border-t px-6 py-8 text-sm"
      style={{ borderColor: "var(--card-border)" }}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="opacity-60">
          © {new Date().getFullYear()} {name}
        </p>

        <nav className="flex flex-wrap gap-x-5 gap-y-2 opacity-80">
          <Link href="/terms" className="hover:underline">
            Terms
          </Link>
          <Link href="/privacy" className="hover:underline">
            Privacy
          </Link>
          <Link href="/leaderboard" className="hover:underline">
            Leaderboard
          </Link>
          {supportEmail && (
            <a href={`mailto:${supportEmail}`} className="hover:underline">
              Contact
            </a>
          )}
        </nav>
      </div>
    </footer>
  );
}
