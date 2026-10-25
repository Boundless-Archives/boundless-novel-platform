import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import SectionHeader from "@/components/layout/SectionHeader";
import EmptyState from "@/components/layout/EmptyState";
import OfficialBadge from "@/components/guilds/OfficialBadge";
import Card from "@/components/ui/Card";
import { GUILD_KINDS, KIND_META, guildProgress, type Guild } from "@/lib/guilds";

export const metadata = { title: "Sects, Covens, Cults & Guilds" };

export default async function GuildsPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string }>;
}) {
  const sp = await searchParams;
  const kind = GUILD_KINDS.find((k) => k.value === sp.kind)?.value ?? null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  let query = admin
    .from("guilds")
    .select("*")
    .order("cultivation_xp", { ascending: false })
    .order("member_count", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(60);

  if (kind) query = query.eq("kind", kind);

  const { data } = await query;
  const guilds = (data ?? []) as Guild[];

  const { data: mine } = user
    ? await admin
        .from("guild_members")
        .select("guild_id")
        .eq("user_id", user.id)
    : { data: [] };

  const joined = new Set((mine ?? []).map((m) => m.guild_id));

  const tab = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition ${
      active ? "" : "opacity-60 hover:opacity-100"
    }`;
  const tabStyle = (active: boolean) =>
    active
      ? { backgroundColor: "var(--button)", color: "var(--button-text)" }
      : { borderColor: "var(--card-border)" };

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <SectionHeader
        icon="⛰️"
        title="Sects, Covens, Cults & Guilds"
        description="Gatherings founded by the most accomplished cultivators and mages. Join one to take part in its discussions."
      />

      <div className="mb-6 flex flex-wrap items-center gap-2">
        <Link href="/guilds" className={tab(!kind)} style={tabStyle(!kind)}>
          All
        </Link>
        {GUILD_KINDS.map((k) => (
          <Link
            key={k.value}
            href={`/guilds?kind=${k.value}`}
            className={tab(kind === k.value)}
            style={tabStyle(kind === k.value)}
          >
            {k.icon} {k.plural}
          </Link>
        ))}

        <Link
          href="/guilds/new"
          className="ml-auto rounded-full px-4 py-2 text-sm font-semibold"
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          + Found one
        </Link>
      </div>

      {guilds.length === 0 ? (
        <EmptyState
          icon="⛰️"
          title="Nothing founded yet"
          description="Keep cultivating. One day you may found the first."
        />
      ) : (
        <div className="space-y-3">
          {guilds.map((g) => {
            const meta = KIND_META[g.kind];
            return (
              <Link key={g.id} href={`/guilds/${g.slug}`} className="block">
                <Card hover>
                  <div className="flex items-start gap-4">
                    <span className="text-3xl" aria-hidden>
                      {meta?.icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h2 className="font-semibold">
                        {g.name}
                        <span className="ml-2 text-xs font-normal uppercase opacity-50">
                          {meta?.label}
                        </span>
                        <span className="ml-2 text-xs font-normal opacity-70">
                          Lv {g.level} {guildProgress(g.cultivation_xp).name}
                        </span>
                        {g.is_official && (
                          <span className="ml-2">
                            <OfficialBadge />
                          </span>
                        )}
                        {joined.has(g.id) && (
                          <span className="ml-2 rounded-full border px-2 py-0.5 text-xs font-normal opacity-70" style={{ borderColor: "var(--card-border)" }}>
                            Joined
                          </span>
                        )}
                      </h2>
                      {g.description && (
                        <p className="mt-1 line-clamp-2 text-sm opacity-70">
                          {g.description}
                        </p>
                      )}
                      <p className="mt-2 text-xs opacity-60">
                        {g.member_count} {g.member_count === 1 ? "member" : "members"} · {g.post_count} {g.post_count === 1 ? "post" : "posts"}
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </main>
  );
}
