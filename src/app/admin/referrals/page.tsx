import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { awardSparks } from "@/lib/sparks";

type One<T> = T | T[] | null;

type Person = { username: string | null };

type Row = {
  id: string;
  created_at: string;
  signup_rewarded_at: string | null;
  signup_reward: number | null;
  publish_rewarded_at: string | null;
  publish_reward: number | null;
  revoked_at: string | null;
  referrer: One<Person>;
  referred: One<Person>;
};

function first<T>(value: One<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "superadmin"].includes(profile.role)) {
    redirect("/");
  }

  return supabase;
}

type Props = {
  searchParams: Promise<{ error?: string }>;
};

export default async function AdminReferralsPage({ searchParams }: Props) {
  const { error: errorParam } = await searchParams;

  const supabase = await requireAdmin();

  async function revokeReferral(formData: FormData) {
    "use server";

    await requireAdmin();

    const id = String(formData.get("id") ?? "");

    if (!id) return;

    const admin = createAdminClient();

    const { data: row } = await admin
      .from("referrals")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", id)
      .is("revoked_at", null)
      .select(
        "referrer_id, signup_reward, signup_rewarded_at, publish_reward, publish_rewarded_at"
      )
      .maybeSingle();

    if (!row) return;

    const total =
      (row.signup_rewarded_at ? (row.signup_reward ?? 0) : 0) +
      (row.publish_rewarded_at ? (row.publish_reward ?? 0) : 0);

    let failed = false;

    if (total > 0) {
      try {
        await awardSparks(
          row.referrer_id,
          -total,
          "referral_revoked",
          "Referral rewards reversed by an admin"
        );
      } catch {
        // The referrer already spent them, so undo the reversal.
        failed = true;

        await admin
          .from("referrals")
          .update({ revoked_at: null })
          .eq("id", id);
      }
    }

    revalidatePath("/admin/referrals");

    if (failed) {
      redirect("/admin/referrals?error=spent");
    }
  }

  const { data, error } = await supabase
    .from("referrals")
    .select(
      "id, created_at, signup_rewarded_at, signup_reward, publish_rewarded_at, publish_reward, revoked_at, referrer:referrer_id ( username ), referred:referred_id ( username )"
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const rows = (data ?? []) as unknown as Row[];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <a
          href="/admin"
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Admin Control Center
        </a>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Referrals
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-foreground/65">
          The latest 100 referrals. Reversing one takes the Sparks it paid back
          from the referrer and stops any further reward from it.
        </p>

        {errorParam === "spent" && (
          <p className="mt-5 rounded-lg border border-card-border p-3 text-sm text-red-500">
            Couldn&apos;t reverse that referral: the referrer has already spent
            some of those Sparks.
          </p>
        )}

        {error && <p className="mt-6 text-sm text-red-500">{error.message}</p>}

        {rows.length === 0 && !error && (
          <p className="mt-8 text-foreground/60">No referrals yet.</p>
        )}

        <div className="mt-8 space-y-3">
          {rows.map((row) => {
            const referrer = first(row.referrer);
            const referred = first(row.referred);

            const paid =
              (row.signup_rewarded_at ? (row.signup_reward ?? 0) : 0) +
              (row.publish_rewarded_at ? (row.publish_reward ?? 0) : 0);

            return (
              <section
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-card-border bg-card p-4"
              >
                <div className="text-sm">
                  <p className="font-medium text-foreground">
                    @{referrer?.username ?? "unknown"} →{" "}
                    @{referred?.username ?? "unknown"}
                  </p>

                  <p className="mt-1 text-xs text-foreground/60">
                    {new Date(row.created_at).toLocaleString()} · paid {paid}{" "}
                    Sparks
                    {row.publish_rewarded_at ? " (incl. publish bonus)" : ""}
                    {row.revoked_at ? " · reversed" : ""}
                  </p>
                </div>

                {!row.revoked_at && (
                  <form action={revokeReferral}>
                    <input type="hidden" name="id" value={row.id} />

                    <button
                      type="submit"
                      className="rounded-lg border border-card-border px-3 py-1.5 text-sm hover:opacity-80"
                    >
                      Reverse
                    </button>
                  </form>
                )}
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}