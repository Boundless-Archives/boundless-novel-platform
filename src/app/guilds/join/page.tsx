import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import SectionHeader from "@/components/layout/SectionHeader";
import { joinWithCodeAction } from "../actions";

export const metadata = { title: "Join with an invite code" };

const ERRORS: Record<string, string> = {
  invalid: "That code doesn't match any group. Check it and try again.",
  limit: "Too many wrong codes. Please try again in an hour.",
  failed: "Something went wrong. Please try again.",
};

export default async function JoinWithCodePage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string; e?: string }>;
}) {
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  return (
    <main className="max-w-md mx-auto px-6 py-10">
      <Link href="/guilds" className="text-sm opacity-60 hover:opacity-100">
        ← Sects, Covens, Cults &amp; Guilds
      </Link>

      <div className="mt-3">
        <SectionHeader
          icon="🔑"
          title="Join with an invite code"
          description="Private groups don't appear in the directory. Ask a member for their code."
        />
      </div>

      {sp.e && <p className="mb-4 text-sm text-red-500">{ERRORS[sp.e] ?? ERRORS.failed}</p>}

      <form action={joinWithCodeAction} className="space-y-3">
        <input
          name="code"
          required
          defaultValue={(sp.code ?? "").slice(0, 20)}
          maxLength={20}
          autoComplete="off"
          placeholder="Invite code"
          className="w-full rounded-lg border bg-transparent px-3 py-2 font-mono uppercase tracking-widest"
          style={{ borderColor: "var(--card-border)" }}
        />
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}
        >
          Join
        </button>
      </form>
    </main>
  );
}
