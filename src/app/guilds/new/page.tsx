import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import SectionHeader from "@/components/layout/SectionHeader";
import Card from "@/components/ui/Card";
import { GUILD_KINDS, KIND_PATH, PATH_LABEL } from "@/lib/guilds";
import { createGuildAction } from "../actions";

export const metadata = { title: "Found a Sect, Coven or Cult" };

const ERRORS: Record<string, string> = {
  realm: "You are not yet strong enough to found one.",
  path: "Your path doesn't allow founding that type. Pick another.",
  invalid: "Pick a type and a name of 3 to 40 characters.",
  name_taken: "That name is already taken.",
  limit: "You've already founded the most you can (2).",
  failed: "Something went wrong. Please try again.",
};

export default async function NewGuildPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: kinds } = await createAdminClient().rpc("guild_kinds_for", {
    p_user: user.id,
  });

  const allowedKinds = (kinds ?? []) as string[];
  const allowed = allowedKinds.length > 0;
  const firstAllowed = GUILD_KINDS.find((k) => allowedKinds.includes(k.value))?.value;

  const field = "mt-1 w-full rounded-lg border bg-transparent px-3 py-2";
  const border = { borderColor: "var(--card-border)" };

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <Link href="/guilds" className="text-sm opacity-60 hover:opacity-100">
        ← Sects, Covens, Cults &amp; Guilds
      </Link>

      <div className="mt-3">
        <SectionHeader
          icon="🕯️"
          title="Found a gathering"
          description="Only the most accomplished may found one."
        />
      </div>

      {sp.e && (
        <p className="mb-4 text-sm text-red-500">
          {ERRORS[sp.e] ?? ERRORS.failed}
        </p>
      )}

      {!allowed ? (
        <Card>
          <p className="font-semibold">Not yet.</p>
          <p className="mt-1 text-sm opacity-70">
            Keep cultivating. When you have grown strong enough, a door will
            open.
          </p>
          <Link
            href="/cultivation"
            className="mt-3 inline-block text-sm underline underline-offset-4"
          >
            Go to cultivation →
          </Link>
        </Card>
      ) : (
        <form action={createGuildAction} className="space-y-5">
          <fieldset>
            <legend className="text-sm font-semibold">Type</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {GUILD_KINDS.map((k) => {
                const ok = allowedKinds.includes(k.value);
                const need = KIND_PATH[k.value];
                return (
                  <label
                    key={k.value}
                    className={`rounded-xl border p-3 text-sm has-[:checked]:ring-2 ${
                      ok ? "cursor-pointer" : "cursor-not-allowed opacity-40"
                    }`}
                    style={border}
                  >
                    <input
                      type="radio"
                      name="kind"
                      value={k.value}
                      defaultChecked={k.value === firstAllowed}
                      disabled={!ok}
                      className="sr-only"
                    />
                    <span className="text-xl">{k.icon}</span>{" "}
                    <span className="font-semibold">{k.label}</span>
                    <span className="mt-1 block text-xs opacity-70">
                      {k.blurb}
                    </span>
                    {need && (
                      <span className="mt-1 block text-xs opacity-60">
                        Founded by {PATH_LABEL[need]} only
                      </span>
                    )}
                  </label>
                );
              })}
            </div>
          </fieldset>

          <label className="block text-sm font-semibold">
            Name
            <input
              name="name"
              required
              minLength={3}
              maxLength={40}
              className={field}
              style={border}
            />
          </label>

          <label className="block text-sm font-semibold">
            Description
            <textarea
              name="description"
              rows={4}
              maxLength={500}
              placeholder="What is it about, and who is it for?"
              className={field}
              style={border}
            />
          </label>

          <button
            type="submit"
            className="rounded-lg px-5 py-2.5 font-semibold"
            style={{
              backgroundColor: "var(--button)",
              color: "var(--button-text)",
            }}
          >
            Found it
          </button>
        </form>
      )}
    </main>
  );
}
