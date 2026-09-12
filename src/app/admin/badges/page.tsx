import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getAllBadgesWithCounts,
  getRecentBadgeAwards,
} from "@/app/badges/actions";
import BadgeAwardPanel from "@/components/admin/BadgeAwardPanel";
import RevokeBadgeButton from "@/components/admin/RevokeBadgeButton";

export default async function AdminBadgesPage() {
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

  if (
    !profile ||
    !["admin", "superadmin"].includes(profile.role)
  ) {
    redirect("/");
  }

  const badges = await getAllBadgesWithCounts();
  const recentAwards = await getRecentBadgeAwards();

  function first<T>(value: T | T[] | null): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold">
        Badge Management
      </h1>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">
          All Badges
        </h2>

        <div className="grid gap-3 sm:grid-cols-2">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className="rounded-xl border p-4"
              style={{
                borderColor: "var(--card-border)",
                backgroundColor: "var(--card)",
              }}
            >
              <div className="flex items-center justify-between">
                <p className="font-semibold">{badge.name}</p>

                <span
                  className="rounded-full px-2 py-0.5 text-xs font-medium"
                  style={{
                    backgroundColor: "var(--accent-soft)",
                    color: "var(--accent)",
                  }}
                >
                  {badge.badge_type}
                </span>
              </div>

              <p className="mt-1 text-sm opacity-60">
                {badge.description}
              </p>

              <p className="mt-2 text-sm opacity-80">
                {badge.awardCount} awarded
                {badge.max_awards
                  ? ` / ${badge.max_awards} max`
                  : ""}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <BadgeAwardPanel
          badges={badges.map((b) => ({
            id: b.id,
            name: b.name,
          }))}
        />
      </section>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">
          Recent Awards
        </h2>

        <div className="space-y-2">
          {recentAwards.map((award: any) => {
            const badge = first(award.badges);
            const holder = first(award.profiles);

            return (
              <div
                key={award.id}
                className="flex items-center justify-between rounded-lg border p-3 text-sm"
                style={{ borderColor: "var(--card-border)" }}
              >
                <span>
                  <strong>
                    {holder?.display_name ?? holder?.username}
                  </strong>{" "}
                  earned <strong>{badge?.name}</strong>
                  <span className="opacity-50">
                    {" "}
                    ·{" "}
                    {new Date(
                      award.awarded_at
                    ).toLocaleDateString()}
                  </span>
                </span>

                <RevokeBadgeButton userBadgeId={award.id} />
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
}