import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import ConfirmButton from "@/components/guilds/ConfirmButton";
import ReportButton from "@/components/moderation/ReportButton";
import { timeAgo } from "@/lib/guilds";
import {
  createReplyAction,
  deletePostAction,
  deleteReplyAction,
} from "../../../actions";

const ERRORS: Record<string, string> = {
  member: "Join this group to reply.",
  invalid: "Write something first.",
  limit: "You've replied a lot today. Try again tomorrow.",
  failed: "Something went wrong. Please try again.",
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function GuildPostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string; id: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { slug, id } = await params;
  const sp = await searchParams;

  if (!UUID.test(id)) notFound();

  const admin = createAdminClient();

  const { data: guild } = await admin
    .from("guilds")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!guild) notFound();

  const { data: post } = await admin
    .from("guild_posts")
    .select("id, author_id, title, body, created_at")
    .eq("id", id)
    .eq("guild_id", guild.id)
    .maybeSingle();

  if (!post) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: replies }, { data: membership }, { data: viewer }] =
    await Promise.all([
      admin
        .from("guild_replies")
        .select("id, author_id, body, created_at")
        .eq("post_id", post.id)
        .order("created_at", { ascending: true })
        .limit(300),
      user
        ? admin
            .from("guild_members")
            .select("role")
            .eq("guild_id", guild.id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
      user
        ? admin.from("profiles").select("role").eq("id", user.id).maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const ids = [
    ...new Set(
      [post.author_id, ...(replies ?? []).map((r) => r.author_id)].filter(Boolean)
    ),
  ] as string[];

  const { data: people } = ids.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", ids)
    : { data: [] };

  const who = new Map((people ?? []).map((p) => [p.id, p]));
  const nameOf = (uid: string | null) => {
    const p = uid ? who.get(uid) : null;
    return p ? p.display_name || p.username : "A former member";
  };

  const isMember = !!membership;
  const isOwner = membership?.role === "owner";
  const isSuper = viewer?.role === "superadmin";
  const canModerate = isOwner || isSuper;

  const border = { borderColor: "var(--card-border)" };

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link
        href={`/guilds/${guild.slug}`}
        className="text-sm opacity-60 hover:opacity-100"
      >
        ← {guild.name}
      </Link>

      <article className="mt-4">
        <h1 className="text-2xl font-bold">{post.title}</h1>
        <p className="mt-1 text-sm opacity-60">
          {nameOf(post.author_id)} · {timeAgo(post.created_at)}
        </p>
        <p className="mt-4 whitespace-pre-wrap">{post.body}</p>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {user && user.id !== post.author_id && (
            <ReportButton type="guild_post" targetId={post.id} />
          )}
          {user && (user.id === post.author_id || canModerate) && (
            <form action={deletePostAction}>
              <input type="hidden" name="postId" value={post.id} />
              <input type="hidden" name="slug" value={guild.slug} />
              <ConfirmButton message="Delete this post and all its replies?">
                Delete
              </ConfirmButton>
            </form>
          )}
        </div>
      </article>

      <hr className="my-8" style={border} />

      <h2 className="mb-4 font-semibold">
        {(replies ?? []).length} {(replies ?? []).length === 1 ? "reply" : "replies"}
      </h2>

      {sp.e && (
        <p className="mb-4 text-sm text-red-500">{ERRORS[sp.e] ?? ERRORS.failed}</p>
      )}

      <div className="space-y-5">
        {(replies ?? []).map((r) => (
          <div key={r.id} id={`reply-${r.id}`}>
            <p className="text-sm opacity-60">
              {nameOf(r.author_id)} · {timeAgo(r.created_at)}
            </p>
            <p className="mt-1 whitespace-pre-wrap">{r.body}</p>
            <div className="mt-2 flex flex-wrap items-center gap-4">
              {user && user.id !== r.author_id && (
                <ReportButton type="guild_reply" targetId={r.id} />
              )}
              {user && (user.id === r.author_id || canModerate) && (
                <form action={deleteReplyAction}>
                  <input type="hidden" name="replyId" value={r.id} />
                  <input type="hidden" name="postId" value={post.id} />
                  <input type="hidden" name="slug" value={guild.slug} />
                  <ConfirmButton message="Delete this reply?">Delete</ConfirmButton>
                </form>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        {isMember ? (
          <form action={createReplyAction} className="space-y-3">
            <input type="hidden" name="postId" value={post.id} />
            <input type="hidden" name="slug" value={guild.slug} />
            <textarea
              name="body"
              required
              rows={3}
              maxLength={3000}
              placeholder="Write a reply"
              className="w-full rounded-lg border bg-transparent px-3 py-2"
              style={border}
            />
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-semibold"
              style={{
                backgroundColor: "var(--button)",
                color: "var(--button-text)",
              }}
            >
              Reply
            </button>
          </form>
        ) : (
          <p className="text-sm opacity-60">
            <Link href={`/guilds/${guild.slug}`} className="underline underline-offset-4">
              Join {guild.name}
            </Link>{" "}
            to reply.
          </p>
        )}
      </div>
    </main>
  );
}
