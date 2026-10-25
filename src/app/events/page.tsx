import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import SectionHeader from "@/components/layout/SectionHeader";
import EmptyState from "@/components/layout/EmptyState";
import StoryGrid from "@/components/story/StoryGrid";
import EventCard, { type EventRow } from "@/components/events/EventCard";
import { isoFromNow, nowMs, timeAgo } from "@/lib/guilds";

export const metadata = { title: "Events" };

const TABS = [
  { key: "events", label: "📅 Events" },
  { key: "books", label: "📚 Books" },
  { key: "chronicle", label: "📜 Chronicle" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

const CHRONICLE_ICON: Record<string, string> = {
  breakthrough: "🧘",
  guild_founded: "⛰️",
  guild_level: "✨",
  story_completed: "✅",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const sp = await searchParams;
  const tab: TabKey = TABS.find((t) => t.key === sp.tab)?.key ?? "events";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const admin = createAdminClient();

  const { data: me } = user
    ? await admin.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const isStaff = me?.role === "admin" || me?.role === "superadmin";

  const pill = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition ${
      active ? "" : "opacity-60 hover:opacity-100"
    }`;
  const pillStyle = (active: boolean) =>
    active
      ? { backgroundColor: "var(--button)", color: "var(--button-text)" }
      : { borderColor: "var(--card-border)" };

  let body: React.ReactNode = null;

  if (tab === "events") {
    const since = isoFromNow(-7 * 24);

    const { data: rows } = await admin
      .from("events")
      .select("*")
      .gte("starts_at", since)
      .order("starts_at", { ascending: true })
      .limit(100);

    const events = (rows ?? []) as EventRow[];

    const guildIds = [...new Set(events.map((e) => e.guild_id).filter(Boolean))] as string[];
    const { data: guilds } = guildIds.length
      ? await admin.from("guilds").select("id, name, slug").in("id", guildIds)
      : { data: [] };
    const guildOf = new Map((guilds ?? []).map((g) => [g.id, g]));

    const { data: mine } =
      user && events.length
        ? await admin
            .from("event_rsvps")
            .select("event_id")
            .eq("user_id", user.id)
            .in("event_id", events.map((e) => e.id))
        : { data: [] };
    const goingSet = new Set((mine ?? []).map((r) => r.event_id));

    const now = nowMs();
    const isOver = (e: EventRow) =>
      new Date(e.ends_at ?? new Date(e.starts_at).getTime() + 2 * 3600_000).getTime() < now;

    const upcoming = events.filter((e) => !isOver(e));
    const past = events.filter(isOver).reverse().slice(0, 10);

    const card = (e: EventRow) => {
      const g = e.guild_id ? guildOf.get(e.guild_id) : null;
      return (
        <EventCard
          key={e.id}
          event={e}
          going={goingSet.has(e.id)}
          canCancel={!!user && (e.created_by === user.id || isStaff)}
          signedIn={!!user}
          guildName={g?.name}
          guildSlug={g?.slug}
        />
      );
    };

    body = (
      <>
        {isStaff && (
          <p className="mb-4">
            <Link
              href="/events/new"
              className="rounded-full px-4 py-2 text-sm font-semibold"
              style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}
            >
              + New event
            </Link>
          </p>
        )}

        {upcoming.length === 0 ? (
          <EmptyState
            icon="📅"
            title="Nothing on the calendar"
            description="Events from Boundless and from sects, covens, cults and guilds will show up here."
          />
        ) : (
          <div className="space-y-3">{upcoming.map(card)}</div>
        )}

        {past.length > 0 && (
          <>
            <h2 className="mb-3 mt-10 text-sm font-semibold uppercase tracking-wide opacity-60">
              Recently ended
            </h2>
            <div className="space-y-3 opacity-70">{past.map(card)}</div>
          </>
        )}
      </>
    );
  } else if (tab === "books") {
    const { data: stories } = await admin
      .from("stories")
      .select(
        `*, profiles ( username, display_name ),
         story_stats ( views, likes, library_adds, reviews, average_rating )`
      )
      .neq("status", "Draft")
      .order("updated_at", { ascending: false })
      .limit(24);

    body = (
      <>
        <p className="mb-4 text-sm opacity-70">
          Freshly published and recently updated books.
        </p>
        <StoryGrid stories={stories ?? []} />
      </>
    );
  } else {
    const { data: entries } = await admin
      .from("chronicle_entries")
      .select("id, kind, title, body, link, created_at")
      .order("created_at", { ascending: false })
      .limit(60);

    body =
      (entries ?? []).length === 0 ? (
        <EmptyState
          icon="📜"
          title="The Chronicle is empty"
          description="Breakthroughs, new gatherings and finished books will be written here as they happen."
        />
      ) : (
        <ol className="space-y-4">
          {(entries ?? []).map((e) => {
            const inner = (
              <div className="flex gap-4">
                <span className="text-2xl" aria-hidden>
                  {CHRONICLE_ICON[e.kind] ?? "📜"}
                </span>
                <div className="min-w-0">
                  <p className="font-medium">{e.title}</p>
                  <p className="text-xs opacity-60">
                    {e.body ? `${e.body} · ` : ""}
                    {timeAgo(e.created_at)}
                  </p>
                </div>
              </div>
            );
            return (
              <li key={e.id}>
                {e.link ? (
                  <Link href={e.link} className="block rounded-xl transition hover:opacity-80">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ol>
      );
  }

  return (
    <main className="max-w-3xl mx-auto px-6 py-10">
      <SectionHeader
        icon="📅"
        title="Events"
        description="What's happening across the Archive: gatherings, new books, and the moments worth remembering."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <Link
            key={t.key}
            href={t.key === "events" ? "/events" : `/events?tab=${t.key}`}
            className={pill(tab === t.key)}
            style={pillStyle(tab === t.key)}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {body}
    </main>
  );
}
