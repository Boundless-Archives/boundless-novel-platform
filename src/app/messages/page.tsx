import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import SectionHeader from "@/components/layout/SectionHeader";
import EmptyState from "@/components/layout/EmptyState";
import { timeAgo } from "@/lib/guilds";
import { unblockUserAction } from "./actions";

export const metadata = { title: "Messages" };

type Conversation = {
  other_id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  last_body: string;
  last_at: string;
  last_from_me: boolean;
  unread: number;
};

export default async function MessagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();

  const [{ data }, { data: blockRows }] = await Promise.all([
    admin.rpc("list_conversations", { p_user: user.id }),
    admin.from("user_blocks").select("blocked_id").eq("blocker_id", user.id),
  ]);

  const conversations = (data ?? []) as Conversation[];

  const blockedIds = (blockRows ?? []).map((b) => b.blocked_id);
  const { data: blocked } = blockedIds.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", blockedIds)
    : { data: [] };

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <SectionHeader
        icon="✉️"
        title="Messages"
        description="Private conversations. Only you and the other person can read them."
        actionHref="/notifications"
        actionLabel="← Inbox"
      />

      {conversations.length === 0 ? (
        <EmptyState
          icon="✉️"
          title="No messages yet"
          description="Open someone's profile and press Message to start a conversation."
        />
      ) : (
        <ul className="space-y-2">
          {conversations.map((c) => {
            const name = c.display_name || c.username;
            return (
              <li key={c.other_id}>
                <Link
                  href={`/messages/${encodeURIComponent(c.username)}`}
                  className="flex items-center gap-4 rounded-2xl border p-4 transition hover:-translate-y-0.5"
                  style={{
                    borderColor: "var(--card-border)",
                    backgroundColor: c.unread > 0 ? "var(--card)" : "transparent",
                  }}
                >
                  {c.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.avatar_url} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
                  ) : (
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border text-lg"
                      style={{ borderColor: "var(--card-border)" }}
                    >
                      {name.slice(0, 1).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className={c.unread > 0 ? "font-bold" : "font-semibold"}>{name}</span>
                      <span className="shrink-0 text-xs opacity-50">{timeAgo(c.last_at)}</span>
                    </div>
                    <p className={`truncate text-sm ${c.unread > 0 ? "" : "opacity-60"}`}>
                      {c.last_from_me && <span className="opacity-60">You: </span>}
                      {c.last_body}
                    </p>
                  </div>

                  {c.unread > 0 && (
                    <span
                      className="shrink-0 rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}
                    >
                      {c.unread}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}

      {(blocked ?? []).length > 0 && (
        <section className="mt-10">
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide opacity-60">
            Blocked people
          </h2>
          <ul className="space-y-1 text-sm">
            {(blocked ?? []).map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-lg border px-3 py-2" style={{ borderColor: "var(--card-border)" }}>
                <span>{b.display_name || b.username}</span>
                <form action={unblockUserAction}>
                  <input type="hidden" name="otherId" value={b.id} />
                  <button type="submit" className="underline underline-offset-4 opacity-70 hover:opacity-100">
                    Unblock
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
