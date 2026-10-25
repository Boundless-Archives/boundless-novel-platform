import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import ConfirmButton from "@/components/guilds/ConfirmButton";
import ReportButton from "@/components/moderation/ReportButton";
import LocalTime from "@/components/events/LocalTime";
import {
  blockUserAction,
  deleteThreadAction,
  sendMessageAction,
  unblockUserAction,
} from "../actions";

export const metadata = { title: "Messages" };

const ERRORS: Record<string, string> = {
  invalid: "Write something first (up to 2,000 characters).",
  blocked: "You can't message this person.",
  closed: "This person isn't taking messages from you.",
  limit: "You've sent a lot of messages today. Try again tomorrow.",
  self: "You can't message yourself.",
  missing: "That person couldn't be found.",
  failed: "Something went wrong. Please try again.",
};

type Msg = { id: string; sender_id: string; body: string; created_at: string };

export default async function ThreadPage({
  params,
  searchParams,
}: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { username: raw } = await params;
  const username = decodeURIComponent(raw);
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();

  const { data: other } = await admin
    .from("profiles")
    .select("id, username, display_name, avatar_url")
    .eq("username", username)
    .maybeSingle();

  if (!other) notFound();
  if (other.id === user.id) redirect("/messages");

  const [{ data: rows }, { data: blockRow }] = await Promise.all([
    admin.rpc("get_thread", { p_user: user.id, p_other: other.id }),
    admin
      .from("user_blocks")
      .select("blocked_id")
      .eq("blocker_id", user.id)
      .eq("blocked_id", other.id)
      .maybeSingle(),
  ]);

  // Opening the conversation reads it.
  await admin.rpc("mark_thread_read", { p_user: user.id, p_other: other.id });

  const messages = (rows ?? []) as Msg[];
  const name = other.display_name || other.username;
  const iBlocked = !!blockRow;

  return (
    <main className="max-w-2xl mx-auto px-6 py-8">
      <Link href="/messages" className="text-sm opacity-60 hover:opacity-100">
        ← Messages
      </Link>

      <header className="mt-3 mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">
          <Link href={`/author/${other.username}`} className="hover:underline">
            {name}
          </Link>
        </h1>

        <div className="flex items-center gap-4">
          {iBlocked ? (
            <form action={unblockUserAction}>
              <input type="hidden" name="otherId" value={other.id} />
              <input type="hidden" name="username" value={other.username} />
              <button type="submit" className="text-sm underline underline-offset-4 opacity-70 hover:opacity-100">
                Unblock
              </button>
            </form>
          ) : (
            <form action={blockUserAction}>
              <input type="hidden" name="otherId" value={other.id} />
              <input type="hidden" name="username" value={other.username} />
              <ConfirmButton message={`Block ${name}? Neither of you will be able to message the other.`}>
                Block
              </ConfirmButton>
            </form>
          )}

          {messages.length > 0 && (
            <form action={deleteThreadAction}>
              <input type="hidden" name="otherId" value={other.id} />
              <ConfirmButton message="Delete this conversation from your side? The other person keeps their copy.">
                Delete
              </ConfirmButton>
            </form>
          )}
        </div>
      </header>

      {messages.length === 0 ? (
        <p className="py-10 text-center text-sm opacity-60">
          No messages yet. Say hello to {name}.
        </p>
      ) : (
        <ol className="space-y-3">
          {messages.map((m) => {
            const mine = m.sender_id === user.id;
            return (
              <li key={m.id} className={`flex flex-col ${mine ? "items-end" : "items-start"}`}>
                <div
                  className="max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-sm"
                  style={
                    mine
                      ? { backgroundColor: "var(--button)", color: "var(--button-text)" }
                      : { backgroundColor: "var(--card)", border: "1px solid var(--card-border)" }
                  }
                >
                  {m.body}
                </div>
                <div className="mt-1 flex items-center gap-3 text-xs opacity-50">
                  <LocalTime iso={m.created_at} />
                  {!mine && <ReportButton type="message" targetId={m.id} />}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {sp.e && <p className="mt-4 text-sm text-red-500">{ERRORS[sp.e] ?? ERRORS.failed}</p>}

      {iBlocked ? (
        <p className="mt-6 text-sm opacity-70">You blocked this person. Unblock them to write again.</p>
      ) : (
        <form action={sendMessageAction} className="mt-6 space-y-3">
          <input type="hidden" name="recipientId" value={other.id} />
          <input type="hidden" name="username" value={other.username} />
          <textarea
            name="body"
            required
            rows={3}
            maxLength={2000}
            placeholder={`Message ${name}`}
            className="w-full rounded-lg border bg-transparent px-3 py-2"
            style={{ borderColor: "var(--card-border)" }}
          />
          <button
            type="submit"
            className="rounded-lg px-5 py-2 text-sm font-semibold"
            style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}
          >
            Send
          </button>
        </form>
      )}
    </main>
  );
}
