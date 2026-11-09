import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import ImagePicker from "@/components/guilds/ImagePicker";
import ConfirmButton from "@/components/guilds/ConfirmButton";
import {
  regenerateCodeAction,
  transferGuildAction,
  updateGuildProfileAction,
} from "../../actions";

export const metadata = { title: "Group settings" };

const MESSAGES: Record<string, { text: string; bad?: boolean }> = {
  saved: { text: "✓ Saved." },
  code: { text: "✓ New invite code created. The old one no longer works." },
  image: { text: "Saved, but an image was too large or not a supported type.", bad: true },
  denied: { text: "Only the founder can change these settings.", bad: true },
  limit: { text: "That member already leads the most groups they can.", bad: true },
  failed: { text: "Something went wrong. Please try again.", bad: true },
};

export default async function GuildSettingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ saved?: string; e?: string; welcome?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();

  const { data: guild } = await admin.from("guilds").select("*").eq("slug", slug).maybeSingle();
  if (!guild) notFound();

  const { data: viewer } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  if (guild.owner_id !== user.id && viewer?.role !== "superadmin") redirect(`/guilds/${slug}`);

  const { data: memberRows } = await admin
    .from("guild_members")
    .select("user_id")
    .eq("guild_id", guild.id)
    .neq("user_id", guild.owner_id ?? "");

  const ids = (memberRows ?? []).map((m) => m.user_id);
  const { data: people } = ids.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", ids)
    : { data: [] };

  const note = sp.saved ? MESSAGES[sp.saved === "1" ? "saved" : sp.saved] : sp.e ? MESSAGES[sp.e] ?? MESSAGES.failed : null;

  const field = "mt-1 w-full rounded-lg border bg-transparent px-3 py-2";
  const border = { borderColor: "var(--card-border)" };
  const btn = { backgroundColor: "var(--button)", color: "var(--button-text)" };

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <Link href={`/guilds/${guild.slug}`} className="text-sm opacity-60 hover:opacity-100">
        ← {guild.name}
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Group settings</h1>

      {sp.welcome && (
        <p className="mt-3 rounded-lg border p-3 text-sm" style={border}>
          🎉 {guild.name} is founded! Give it an emblem, a banner and a motto so members know where they are.
        </p>
      )}

      {note && (
        <p className={`mt-3 text-sm ${note.bad ? "text-red-500" : ""}`}>{note.text}</p>
      )}

      <form action={updateGuildProfileAction} className="mt-6 space-y-6">
        <input type="hidden" name="guildId" value={guild.id} />
        <input type="hidden" name="slug" value={guild.slug} />

        <ImagePicker name="emblem" kind="emblem" currentUrl={guild.emblem_url} />
        <ImagePicker name="banner" kind="banner" currentUrl={guild.banner_url} />

        <label className="block">
          <span className="font-medium">Motto</span>
          <input name="motto" defaultValue={guild.motto ?? ""} maxLength={80} placeholder="A line members rally around" className={field} style={border} />
        </label>

        <label className="block">
          <span className="font-medium">Description</span>
          <textarea name="description" defaultValue={guild.description} rows={3} maxLength={500} className={field} style={border} />
        </label>

        <label className="block">
          <span className="font-medium">Rules</span>
          <textarea name="rules" defaultValue={guild.rules ?? ""} rows={5} maxLength={1500} placeholder="One per line. Shown to members on the group page." className={field} style={border} />
        </label>

        <label className="flex items-start gap-3">
          <input type="checkbox" name="private" defaultChecked={guild.is_private} className="mt-1" />
          <span>
            <span className="font-medium">Private group</span>
            <span className="block text-sm opacity-70">
              Hidden from the directory. Only people with the invite code can join, and only members can read discussions and events.
            </span>
          </span>
        </label>

        <button type="submit" className="rounded-lg px-5 py-2 text-sm font-semibold" style={btn}>
          Save changes
        </button>
      </form>

      {guild.is_private && guild.invite_code && (
        <section className="mt-10 rounded-xl border p-5" style={border}>
          <h2 className="font-semibold">🔑 Invite code</h2>
          <p className="mt-2 font-mono text-lg tracking-widest">{guild.invite_code}</p>
          <p className="mt-1 text-sm opacity-70">
            Share the code, or the link <code className="font-mono text-xs">/guilds/join?code={guild.invite_code}</code>
          </p>
          <form action={regenerateCodeAction} className="mt-3">
            <input type="hidden" name="guildId" value={guild.id} />
            <input type="hidden" name="slug" value={guild.slug} />
            <ConfirmButton message="Make a new code? The current one will stop working.">
              Make a new code
            </ConfirmButton>
          </form>
        </section>
      )}

      {guild.owner_id === user.id && (people ?? []).length > 0 && (
        <section className="mt-10 rounded-xl border p-5" style={border}>
          <h2 className="font-semibold">👑 Hand over leadership</h2>
          <p className="mt-1 text-sm opacity-70">
            Pass the group to another member. You become an officer. This can&apos;t be undone by you.
          </p>
          <form action={transferGuildAction} className="mt-3 flex flex-wrap gap-2">
            <input type="hidden" name="guildId" value={guild.id} />
            <input type="hidden" name="slug" value={guild.slug} />
            <select name="newOwnerId" required className="min-w-0 flex-1 rounded-lg border bg-transparent px-3 py-2 text-sm" style={border} defaultValue="">
              <option value="" disabled>
                Choose a member…
              </option>
              {(people ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.display_name || p.username}
                </option>
              ))}
            </select>
            <ConfirmButton message="Give this group to that member? You will become an officer.">
              Transfer
            </ConfirmButton>
          </form>
        </section>
      )}
    </main>
  );
}
