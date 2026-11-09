import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import ConfirmButton from "@/components/guilds/ConfirmButton";
import { GUILD_ROLE_LABEL, canModerate } from "@/lib/guilds";
import { removeMemberAction, setRoleAction } from "../../actions";

export const metadata = { title: "Members" };

export default async function GuildMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const admin = createAdminClient();

  const { data: guild } = await admin
    .from("guilds")
    .select("id, name, slug, owner_id, is_private")
    .eq("slug", slug)
    .maybeSingle();

  if (!guild) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: me }, { data: viewer }, { data: rows }] = await Promise.all([
    user
      ? admin.from("guild_members").select("role").eq("guild_id", guild.id).eq("user_id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    user
      ? admin.from("profiles").select("role").eq("id", user.id).maybeSingle()
      : Promise.resolve({ data: null }),
    admin
      .from("guild_members")
      .select("user_id, role, joined_at, contributed_xp")
      .eq("guild_id", guild.id)
      .limit(300),
  ]);

  const isSuper = viewer?.role === "superadmin";
  if (guild.is_private && !me && !isSuper) notFound();

  const myRole = me?.role ?? null;
  const rank = { owner: 0, officer: 1, member: 2 } as Record<string, number>;
  const members = [...(rows ?? [])].sort(
    (a, b) =>
      (rank[a.role] ?? 3) - (rank[b.role] ?? 3) ||
      Number(b.contributed_xp ?? 0) - Number(a.contributed_xp ?? 0)
  );

  const ids = members.map((m) => m.user_id);
  const { data: people } = ids.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", ids)
    : { data: [] };
  const who = new Map((people ?? []).map((p) => [p.id, p]));

  const isFounder = myRole === "owner" || isSuper;
  const border = { borderColor: "var(--card-border)" };

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link href={`/guilds/${guild.slug}`} className="text-sm opacity-60 hover:opacity-100">
        ← {guild.name}
      </Link>

      <h1 className="mt-4 text-2xl font-bold">
        Members <span className="text-base font-normal opacity-60">({members.length})</span>
      </h1>

      {sp.e === "limit" && (
        <p className="mt-3 text-sm text-red-500">A group can have up to 5 officers.</p>
      )}

      <ul className="mt-6 divide-y" style={{ borderColor: "var(--card-border)" }}>
        {members.map((m) => {
          const p = who.get(m.user_id);
          const name = p?.display_name || p?.username || "Member";
          const canKick =
            m.role !== "owner" &&
            m.user_id !== user?.id &&
            (isFounder || (canModerate(myRole, false) && m.role === "member"));

          return (
            <li key={m.user_id} className="flex flex-wrap items-center gap-3 py-3" style={border}>
              <div className="min-w-0 flex-1">
                {p ? (
                  <Link href={`/author/${p.username}`} className="font-medium hover:underline">
                    {name}
                  </Link>
                ) : (
                  <span className="font-medium">{name}</span>
                )}
                <span
                  className="ml-2 rounded-full border px-2 py-0.5 text-xs opacity-70"
                  style={border}
                >
                  {m.role === "owner" ? "👑 " : m.role === "officer" ? "🛡️ " : ""}
                  {GUILD_ROLE_LABEL[m.role] ?? m.role}
                </span>
                {Number(m.contributed_xp ?? 0) > 0 && (
                  <p className="text-xs opacity-60">
                    {Number(m.contributed_xp).toLocaleString()} XP contributed
                  </p>
                )}
              </div>

              {isFounder && m.role !== "owner" && (
                <form action={setRoleAction}>
                  <input type="hidden" name="guildId" value={guild.id} />
                  <input type="hidden" name="slug" value={guild.slug} />
                  <input type="hidden" name="memberId" value={m.user_id} />
                  <input type="hidden" name="role" value={m.role === "officer" ? "member" : "officer"} />
                  <button type="submit" className="text-sm underline underline-offset-4 opacity-70 hover:opacity-100">
                    {m.role === "officer" ? "Make member" : "Make officer"}
                  </button>
                </form>
              )}

              {canKick && (
                <form action={removeMemberAction}>
                  <input type="hidden" name="guildId" value={guild.id} />
                  <input type="hidden" name="slug" value={guild.slug} />
                  <input type="hidden" name="memberId" value={m.user_id} />
                  <ConfirmButton message={`Remove ${name} from this group?`}>Remove</ConfirmButton>
                </form>
              )}
            </li>
          );
        })}
      </ul>
    </main>
  );
}
