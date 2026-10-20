import Link from "next/link";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import CopyLinkButton from "@/components/referrals/CopyLinkButton";
import {
  REFERRAL_PUBLISH_MIN_WORDS,
  REFERRAL_PUBLISH_REWARD,
  REFERRAL_SIGNUP_REWARD,
} from "@/lib/referrals";
import { formatCoins, SPARK_NAME } from "@/lib/currency";

type One<T> = T | T[] | null;

type ReferralRow = {
  id: string;
  created_at: string;
  signup_rewarded_at: string | null;
  signup_reward: number | null;
  publish_rewarded_at: string | null;
  publish_reward: number | null;
  revoked_at: string | null;
  profiles: One<{ username: string | null; display_name: string | null }>;
};

function first<T>(value: One<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export default async function ReferPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: me } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .maybeSingle();

  if (!me?.username) {
    redirect("/auth/onboarding");
  }

  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";

  const link = `${proto}://${host}/auth/signup?ref=${me.username}`;

  const { data } = await supabase
    .from("referrals")
    .select(
      "id, created_at, signup_rewarded_at, signup_reward, publish_rewarded_at, publish_reward, revoked_at, profiles:referred_id ( username, display_name )"
    )
    .eq("referrer_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as unknown as ReferralRow[];

  const active = rows.filter((r) => !r.revoked_at);

  const earned = active.reduce(
    (sum, r) =>
      sum +
      (r.signup_rewarded_at ? (r.signup_reward ?? 0) : 0) +
      (r.publish_rewarded_at ? (r.publish_reward ?? 0) : 0),
    0
  );

  const published = active.filter((r) => r.publish_rewarded_at).length;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-3xl font-bold">Refer a friend</h1>

      <p className="mt-3 leading-7 opacity-80">
        Share your link. When a friend joins Boundless through it, you earn{" "}
        <strong>
          {REFERRAL_SIGNUP_REWARD} {SPARK_NAME}
        </strong>
        . If they go on to publish their first chapter of{" "}
        {REFERRAL_PUBLISH_MIN_WORDS}+ words, you earn another{" "}
        <strong>
          {REFERRAL_PUBLISH_REWARD} {SPARK_NAME}
        </strong>
        .
      </p>

      <section
        className="mt-6 rounded-xl border p-5"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <p className="text-sm uppercase tracking-wide opacity-60">
          Your link
        </p>

        <p className="mt-2 break-all rounded-lg border border-card-border px-3 py-2 font-mono text-sm">
          {link}
        </p>

        <CopyLinkButton link={link} />
      </section>

      <div className="mt-6 grid grid-cols-3 gap-3">
        {[
          { label: "Friends joined", value: active.length.toLocaleString() },
          { label: "Started publishing", value: published.toLocaleString() },
          {
            label: `${SPARK_NAME} earned`,
            value: formatCoins(earned),
            spark: true,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border p-4 text-center"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <p
              className="flex items-center justify-center gap-1 text-2xl font-bold"
              style={stat.spark ? { color: "var(--accent)" } : undefined}
            >
              {stat.spark && <Zap size={20} />}
              {stat.value}
            </p>

            <p className="mt-1 text-xs opacity-60">{stat.label}</p>
          </div>
        ))}
      </div>

      <h2 className="mt-10 text-xl font-semibold">Your referrals</h2>

      {rows.length === 0 ? (
        <p className="mt-3 opacity-70">
          No one has joined through your link yet. Share it and they&apos;ll
          show up here.
        </p>
      ) : (
        <ul className="mt-4 space-y-3">
          {rows.map((row) => {
            const person = first(row.profiles);
            const name = person?.display_name ?? person?.username ?? "A reader";

            return (
              <li
                key={row.id}
                className="rounded-xl border p-4"
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                }}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  {person?.username ? (
                    <Link
                      href={`/author/${person.username}`}
                      className="font-semibold hover:underline"
                    >
                      {name}
                    </Link>
                  ) : (
                    <span className="font-semibold">{name}</span>
                  )}

                  <span className="text-xs opacity-60">
                    Joined {new Date(row.created_at).toLocaleDateString()}
                  </span>
                </div>

                {row.revoked_at ? (
                  <p className="mt-2 text-sm opacity-70">
                    Rewards for this referral were reversed.
                  </p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full border border-card-border px-3 py-1">
                      {row.signup_rewarded_at
                        ? `Joined ✓ +${row.signup_reward ?? 0}`
                        : "Joined (daily limit reached, no reward)"}
                    </span>

                    <span className="rounded-full border border-card-border px-3 py-1">
                      {row.publish_rewarded_at
                        ? `Published ✓ +${row.publish_reward ?? 0}`
                        : `Waiting for their first ${REFERRAL_PUBLISH_MIN_WORDS}+ word chapter`}
                    </span>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-8 text-xs opacity-60">
        Rewards are checked for fairness and can be reversed if an account turns
        out to be fake or created to farm {SPARK_NAME}.
      </p>
    </main>
  );
}