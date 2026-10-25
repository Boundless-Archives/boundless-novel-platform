import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import OfficialBadge from "@/components/guilds/OfficialBadge";
import EventCard, { type EventRow } from "@/components/events/EventCard";
import Card from "@/components/ui/Card";
import ConfirmButton from "@/components/guilds/ConfirmButton";
import { KIND_META, guildProgress, isoFromNow, timeAgo, type Guild } from "@/lib/guilds";
import {
  createPostAction,
  disbandGuildAction,
  joinGuildAction,
  leaveGuildAction,
} from "../actions";

const ERRORS: Record<string, string> = {
  member: "Join first to post here.",
  invalid: "Give your post a title (3+ characters) and some text.",
  limit: "You've posted a lot today. Try again tomorrow.",
  failed: "Something went wrong. Please try again.",
};

type Post = {
  id: string;
  author_id: string | null;
  title: string;
  body: string;
  reply_count: number;
  created_at: string;
  last_activity_at: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await createAdminClient()
    .from("guilds")
    .select("name")
    .eq("slug", slug)
    .maybeSingle();
  return { title: data?.name ?? "Not found" };
}

export default async function GuildPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ e?: string }>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const admin = createAdminClient();

  const { data: guildRow } = await admin
    .from("guilds")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!guildRow) notFound();
  const guild = guildRow as Guild;
  const meta = KIND_META[guild.kind];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: postRows }, { data: membership }, { data: viewer }, { data: owner }] =
    await Promise.all([
      admin
        .from("guild_posts")
        .select("id, author_id, title, body, reply_count, created_at, last_activity_at")
        .eq("guild_id", guild.id)
        .order("last_activity_at", { ascending: false })
        .limit(50),
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
      guild.owner_id
        ? admin
            .from("profiles")
            .select("username, display_name")
            .eq("id", guild.owner_id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);

  const posts = (postRows ?? []) as Post[];
  const progress = guildProgress(guild.cultivation_xp);

  const { data: eventRows } = await admin
    .from("events")
    .select("*")
    .eq("guild_id", guild.id)
    .eq("cancelled", false)
    .gte("starts_at", isoFromNow(-2))
    .order("starts_at", { ascending: true })
    .limit(5);
  const events = (eventRows ?? []) as EventRow[];

  const { data: myRsvps } =
    user && events.length
      ? await admin
          .from("event_rsvps")
          .select("event_id")
          .eq("user_id", user.id)
          .in("event_id", events.map((e) => e.id))
      : { data: [] };
  const goingSet = new Set((myRsvps ?? []).map((r) => r.event_id));

  const { data: topRows } = await admin
    .from("guild_members")
    .select("user_id, contributed_xp")
    .eq("guild_id", guild.id)
    .gt("contributed_xp", 0)
    .order("contributed_xp", { ascending: false })
    .limit(5);

  const topIds = (topRows ?? []).map((t) => t.user_id);
  const { data: topPeople } = topIds.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", topIds)
    : { data: [] };
  const topName = new Map(
    (topPeople ?? []).map((p) => [p.id, p.display_name || p.username])
  );

  const authorIds = [...new Set(posts.map((p) => p.author_id).filter(Boolean))] as string[];
  const { data: people } = authorIds.length
    ? await admin.from("profiles").select("id, username, display_name").in("id", authorIds)
    : { data: [] };
  const nameOf = new Map(
    (people ?? []).map((p) => [p.id, p.display_name || p.username])
  );

  const isMember = !!membership;
  const isOwner = membership?.role === "owner";
  const isSuper = viewer?.role === "superadmin";

  const field = "w-full rounded-lg border bg-transparent px-3 py-2";
  const border = { borderColor: "var(--card-border)" };
  const btn = {
    backgroundColor: "var(--button)",
    color: "var(--button-text)",
  };

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <Link href="/guilds" className="text-sm opacity-60 hover:opacity-100">
        ← Sects, Covens, Cults &amp; Guilds
      </Link>

      <header className="mt-4 mb-8">
        <p className="text-sm uppercase tracking-wide opacity-60">
          {meta?.icon} {meta?.label}
        </p>
        <h1 className="mt-1 text-3xl font-bold">{guild.name}</h1>
        {guild.is_official && (
          <div className="mt-2">
            <OfficialBadge />
          </div>
        )}
        {guild.description && (
          <p className="mt-3 whitespace-pre-wrap opacity-80">
            {guild.description}
          </p>
        )}
        <p className="mt-3 text-sm opacity-60">
          {guild.member_count} {guild.member_count === 1 ? "member" : "members"}
          {owner && (
            <>
              {" · "}Founded by{" "}
              <Link
                href={`/author/${owner.username}`}
                className="underline underline-offset-4"
              >
                {owner.display_name || owner.username}
              </Link>
            </>
          )}
        </p>

        <div className="mt-5 max-w-md">
          <div className="flex items-baseline justify-between text-sm">
            <span className="font-semibold">
              Level {progress.level} · {progress.name}
            </span>
            <span className="opacity-60">
              {progress.xp.toLocaleString()}
              {progress.next !== null && ` / ${progress.next.toLocaleString()}`} XP
            </span>
          </div>
          <div
            className="mt-1 h-2 overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--card-border)" }}
            role="progressbar"
            aria-valuenow={progress.percent}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div
              className="h-full rounded-full"
              style={{
                width: `${progress.percent}%`,
                backgroundColor: "var(--button)",
              }}
            />
          </div>
          <p className="mt-1 text-xs opacity-60">
            Grows as its members cultivate. Members keep all of their own XP.
          </p>
          {(topRows ?? []).length > 0 && (
            <p className="mt-2 text-xs opacity-70">
              Top cultivators:{" "}
              {(topRows ?? [])
                .map(
                  (t) =>
                    `${topName.get(t.user_id) ?? "Member"} (${Number(t.contributed_xp).toLocaleString()})`
                )
                .join(" · ")}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-4">
          {!user ? (
            <Link
              href="/auth/login"
              className="rounded-lg px-4 py-2 text-sm font-semibold"
              style={btn}
            >
              Sign in to join
            </Link>
          ) : !isMember ? (
            <form action={joinGuildAction}>
              <input type="hidden" name="guildId" value={guild.id} />
              <input type="hidden" name="slug" value={guild.slug} />
              <button
                type="submit"
                className="rounded-lg px-4 py-2 text-sm font-semibold"
                style={btn}
              >
                Join
              </button>
            </form>
          ) : !isOwner ? (
            <form action={leaveGuildAction}>
              <input type="hidden" name="guildId" value={guild.id} />
              <input type="hidden" name="slug" value={guild.slug} />
              <ConfirmButton message="Leave this group?">Leave</ConfirmButton>
            </form>
          ) : (
            <span className="text-sm opacity-60">You founded this</span>
          )}

          {(isOwner || isSuper) && (
            <form action={disbandGuildAction}>
              <input type="hidden" name="guildId" value={guild.id} />
              <ConfirmButton
                message="Disband this group? Every post and reply in it will be deleted for good."
                className="text-sm text-red-500 opacity-70 transition hover:opacity-100"
              >
                Disband
              </ConfirmButton>
            </form>
          )}
        </div>
      </header>

      {sp.e && (
        <p className="mb-4 text-sm text-red-500">{ERRORS[sp.e] ?? ERRORS.failed}</p>
      )}

      {(events.length > 0 || isOwner || isSuper) && (
        <section className="mb-8">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-semibold">Upcoming events</h2>
            {(isOwner || isSuper) && (
              <Link
                href={`/events/new?guild=${guild.slug}`}
                className="text-sm underline underline-offset-4"
              >
                + New event
              </Link>
            )}
          </div>
          {events.length === 0 ? (
            <p className="text-sm opacity-60">No events planned.</p>
          ) : (
            <div className="space-y-3">
              {events.map((e) => (
                <EventCard
                  key={e.id}
                  event={e}
                  going={goingSet.has(e.id)}
                  canCancel={isOwner || isSuper}
                  signedIn={!!user}
                  guildSlug={guild.slug}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {isMember && (
        <form action={createPostAction} className="mb-8 space-y-3">
          <input type="hidden" name="guildId" value={guild.id} />
          <input type="hidden" name="slug" value={guild.slug} />
          <input
            name="title"
            required
            minLength={3}
            maxLength={120}
            placeholder="Start a discussion"
            className={field}
            style={border}
          />
          <textarea
            name="body"
            required
            rows={4}
            maxLength={5000}
            placeholder="What's on your mind?"
            className={field}
            style={border}
          />
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-semibold"
            style={btn}
          >
            Post
          </button>
        </form>
      )}

      {posts.length === 0 ? (
        <p className="text-sm opacity-60">
          No discussions yet.{isMember ? " Start the first one above." : ""}
        </p>
      ) : (
        <div className="space-y-3">
          {posts.map((p) => (
            <Link key={p.id} href={`/guilds/${guild.slug}/post/${p.id}`} className="block">
              <Card hover>
                <h2 className="font-semibold">{p.title}</h2>
                <p className="mt-1 line-clamp-2 text-sm opacity-70">{p.body}</p>
                <p className="mt-2 text-xs opacity-60">
                  {(p.author_id && nameOf.get(p.author_id)) || "A former member"}
                  {" · "}
                  {p.reply_count} {p.reply_count === 1 ? "reply" : "replies"}
                  {" · "}
                  {timeAgo(p.last_activity_at)}
                </p>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
