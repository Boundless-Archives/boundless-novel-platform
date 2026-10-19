import Link from "next/link";
import { redirect } from "next/navigation";
import { Lock, Zap } from "lucide-react";
import { createClient } from "@/utils/supabase/server";
import { getMyCultivationProfile } from "@/app/cultivation/actions";
import CultivationWidget from "@/components/cultivation/CultivationWidget";
import {
  EMBERS_ACCELERATION_MIN_REALM,
  XP_PER_EMBER,
} from "@/lib/cultivation";
import { CURRENCY_NAME, SPARK_NAME } from "@/lib/currency";

export const metadata = {
  title: "The Path",
};

export const dynamic = "force-dynamic";

const PATH_COLORS = {
  qi: "#2DD4BF",
  mana: "#818CF8",
};

const cardStyle = {
  borderColor: "var(--card-border)",
  backgroundColor: "var(--card)",
};

type RealmRow = {
  major_number: number;
  major_name: string;
  minor_number: number;
  xp_required_cumulative: number;
};

type Realm = {
  number: number;
  name: string;
  entryXp: number;
  stages: number;
};

function groupRealms(rows: RealmRow[]): Realm[] {
  const byMajor = new Map<number, Realm>();

  for (const row of rows) {
    const existing = byMajor.get(row.major_number);

    if (!existing) {
      byMajor.set(row.major_number, {
        number: row.major_number,
        name: row.major_name,
        entryXp: row.xp_required_cumulative,
        stages: 1,
      });
    } else {
      existing.entryXp = Math.min(
        existing.entryXp,
        row.xp_required_cumulative
      );
      existing.stages += 1;
    }
  }

  return [...byMajor.values()].sort((a, b) => a.number - b.number);
}

export default async function PathPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const profile = await getMyCultivationProfile();

  if (!profile) {
    return (
      <main className="mx-auto max-w-3xl p-6 md:p-8">
        <h1 className="text-4xl font-bold">The Path</h1>
        <p className="mt-2 mb-6 text-sm opacity-70">
          Every reader and writer here can cultivate. Choose a path
          to begin; the road ahead will reveal itself as you walk it.
        </p>

        <CultivationWidget profile={null} />
      </main>
    );
  }

  const { data: rows } = await supabase
    .from("cultivation_realms")
    .select(
      "major_number, major_name, minor_number, xp_required_cumulative"
    )
    .eq("path", profile.path);

  const realms = groupRealms((rows ?? []) as RealmRow[]);
  const color = PATH_COLORS[profile.path];
  const current = profile.majorNumber;

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-8">
      <h1 className="text-4xl font-bold">The Path</h1>

      <p className="mt-2 text-sm opacity-70">
        Realm {current} of {realms.length}. Only the road you have
        walked, and the next two steps, are shown.
      </p>

      <div className="mt-6">
        <CultivationWidget profile={profile} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-xl font-semibold">The realms</h2>

        <ol className="grid gap-3">
          {realms.map((realm) => {
            const reached = realm.number <= current;
            const isCurrent = realm.number === current;
            const visible =
              reached ||
              realm.number === current + 1 ||
              realm.number === current + 2;
            const xpToGo = Math.max(
              0,
              realm.entryXp - profile.totalXp
            );

            return (
              <li
                key={realm.number}
                className="rounded-xl border p-4"
                style={{
                  ...cardStyle,
                  borderColor: isCurrent ? color : "var(--card-border)",
                  opacity: reached || visible ? 1 : 0.55,
                }}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p
                      className="text-xs uppercase tracking-wide"
                      style={{ color: reached ? color : undefined }}
                    >
                      Realm {realm.number}
                      {isCurrent && " · you are here"}
                    </p>

                    <p className="font-serif text-xl font-bold">
                      {visible ? realm.name : "???"}
                    </p>
                  </div>

                  {!visible && (
                    <Lock size={18} className="opacity-50" />
                  )}

                  {visible && !reached && (
                    <p className="text-right text-xs opacity-70">
                      {xpToGo.toLocaleString()} XP to go
                    </p>
                  )}
                </div>

                {visible && realm.stages > 1 && (
                  <p className="mt-1 text-xs opacity-60">
                    {realm.stages} stages
                  </p>
                )}
              </li>
            );
          })}
        </ol>

        {current < EMBERS_ACCELERATION_MIN_REALM && (
          <p className="mt-4 text-sm italic opacity-70">
            Something stirs at Realm {EMBERS_ACCELERATION_MIN_REALM}…
          </p>
        )}

        {current >= EMBERS_ACCELERATION_MIN_REALM && (
          <p className="mt-4 text-sm opacity-70">
            At this height, {CURRENCY_NAME} can speed your
            cultivation: {XP_PER_EMBER} XP for every Ember you
            spend.
          </p>
        )}
      </section>

      <section className="mt-8 rounded-xl border p-5" style={cardStyle}>
        <h2 className="text-xl font-semibold">How you earn XP</h2>

        <ul className="mt-3 grid gap-2 text-sm opacity-90">
          <li>
            <strong>Reading:</strong> about 1 XP for every minute you
            spend actively reading a chapter (up to 20 per chapter,
            each day).
          </li>
          <li>
            <strong>Writing:</strong> 1 XP for every 40 words of a
            chapter you publish, once per chapter (up to 150 for a
            chapter, and 500 a day).
          </li>
          <li>
            <strong>Boosters:</strong> Essence Stones, Spirit Potions
            and Dao Elixirs from the{" "}
            <Link
              href="/shop"
              className="underline underline-offset-4"
            >
              Spark Shop
            </Link>{" "}
            raise how much you earn for a while.
          </li>
        </ul>
      </section>

      <section className="mt-6 rounded-xl border p-5" style={cardStyle}>
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <Zap size={18} style={{ color }} />
          Breakthrough {SPARK_NAME}
        </h2>

        <p className="mt-2 text-sm opacity-90">
          Every breakthrough pays you in {SPARK_NAME}, once:
        </p>

        <ul className="mt-2 grid gap-1 text-sm opacity-90">
          <li>A new stage within a realm: 10 {SPARK_NAME}.</li>
          <li>
            Entering a new realm: 50 × the realm number (Realm 2
            pays 100, Realm 5 pays 250, and so on).
          </li>
        </ul>
      </section>
    </main>
  );
}
