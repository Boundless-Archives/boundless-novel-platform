import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import AnalyticsCharts, {
  type SeriesRow,
} from "@/components/admin/AnalyticsCharts";

type TypeRow = { type: string; n: number; total: number };
type StoryRow = {
  id: string;
  title: string;
  slug: string;
  author: string | null;
  views?: number;
  unique_readers?: number;
  likes?: number;
  library_adds?: number;
  average_rating?: number | null;
  days_quiet?: number;
};
type AuthorRow = {
  id: string;
  username: string;
  display_name: string | null;
  followers: number;
  stories: number;
  views: number;
};
type QuestRow = {
  slug: string;
  title: string;
  scope: string;
  completed: number;
  started: number;
};
type ModRow = { open: number; oldest: string | null };

type Analytics = {
  days: number;
  series: SeriesRow[];
  activity: {
    dau: number;
    wau: number;
    mau: number;
    tracking_since: string | null;
  };
  totals: Record<string, number>;
  top_stories_read: StoryRow[];
  top_stories_liked: StoryRow[];
  top_authors: AuthorRow[];
  quiet_stories: StoryRow[];
  economy: {
    sparks_in_circulation: number;
    embers_in_circulation: number;
    sparks_earned_period: number;
    sparks_spent_period: number;
    sparks_by_type: TypeRow[];
    embers_by_type: TypeRow[];
    gifts_period: number;
    gift_embers_period: number;
    cosmetics_sold_period: number;
    shop_sales_period: number;
    restores_period: number;
  };
  quests: { active_players_period: number; by_quest: QuestRow[] };
  moderation: {
    bug_reports: ModRow;
    tier_submissions: ModRow;
    plagiarism_reports: ModRow;
  };
};

const RANGES = [7, 30, 90];

const cardStyle = {
  backgroundColor: "var(--card)",
  borderColor: "var(--card-border)",
};

const fmt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-US");

function age(iso: string | null) {
  if (!iso) return "none waiting";
  const days = Math.floor(
    (new Date().getTime() - new Date(iso).getTime()) / 86400000
  );
  if (days < 1) return "oldest: today";
  return `oldest: ${days} day${days === 1 ? "" : "s"} ago`;
}

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ days?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "superadmin"].includes(profile.role)) {
    redirect("/");
  }

  const { days: daysParam } = await searchParams;
  const days = RANGES.includes(Number(daysParam)) ? Number(daysParam) : 30;

  const { data, error } = await createAdminClient().rpc("admin_analytics", {
    p_days: days,
  });

  if (error || !data) {
    throw new Error(error?.message ?? "Analytics could not be loaded.");
  }

  const a = data as Analytics;
  const e = a.economy;

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Link
          href="/admin"
          className="inline-flex items-center text-sm opacity-60 transition hover:opacity-100"
        >
          ← Back to Admin Control Center
        </Link>

        <div className="mt-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Platform Analytics
            </h1>
            <p className="mt-1 text-sm opacity-60">
              Growth, content, economy and what needs your attention. Days are
              in UTC.
            </p>
          </div>

          <div
            className="flex rounded-xl border p-1 text-sm"
            style={cardStyle}
          >
            {RANGES.map((r) => (
              <Link
                key={r}
                href={`/admin/analytics?days=${r}`}
                className="rounded-lg px-4 py-2 font-medium"
                style={
                  r === days
                    ? {
                        backgroundColor: "var(--button)",
                        color: "var(--button-text)",
                      }
                    : { opacity: 0.7 }
                }
              >
                {r} days
              </Link>
            ))}
          </div>
        </div>

        {/* NEEDS ATTENTION */}
        <Heading>Needs attention</Heading>
        <div className="grid gap-4 sm:grid-cols-3">
          <ModCard label="Open bug reports" href="/admin/bug-reports" row={a.moderation.bug_reports} />
          <ModCard label="Tier submissions to review" href="/admin/tier-submissions" row={a.moderation.tier_submissions} />
          <ModCard label="Plagiarism reports" href="/admin/plagiarism-reports" row={a.moderation.plagiarism_reports} />
        </div>

        {/* GROWTH */}
        <Heading>Growth and activity</Heading>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Tile label="Active today" value={fmt(a.activity.dau)} />
          <Tile label="Active, 7 days" value={fmt(a.activity.wau)} />
          <Tile label="Active, 30 days" value={fmt(a.activity.mau)} />
          <Tile label="Members" value={fmt(a.totals.users)} sub={`${fmt(a.totals.authors)} authors`} />
          <Tile label={`Signups (${days}d)`} value={fmt(a.totals.signups_period)} />
          <Tile label={`New stories (${days}d)`} value={fmt(a.totals.new_stories_period)} />
          <Tile label={`Chapters (${days}d)`} value={fmt(a.totals.new_chapters_period)} />
          <Tile
            label={`Comments + reviews (${days}d)`}
            value={fmt((a.totals.comments_period ?? 0) + (a.totals.reviews_period ?? 0))}
          />
        </div>
        {a.activity.tracking_since && (
          <p className="mt-2 text-xs opacity-60">
            Active-member counts are recorded from{" "}
            {a.activity.tracking_since}; earlier days show reading activity
            only.
          </p>
        )}

        <div className="mt-6">
          <AnalyticsCharts data={a.series} />
        </div>

        {/* TOP CONTENT */}
        <Heading>Top content</Heading>
        <div className="grid gap-6 lg:grid-cols-2">
          <ListCard title="Most read">
            {a.top_stories_read.map((s, i) => (
              <StoryLine key={s.id} i={i} s={s} meta={`${fmt(s.views)} views · ${fmt(s.unique_readers)} readers`} />
            ))}
          </ListCard>
          <ListCard title="Most liked">
            {a.top_stories_liked.map((s, i) => (
              <StoryLine key={s.id} i={i} s={s} meta={`${fmt(s.likes)} likes · ${fmt(s.library_adds)} library adds`} />
            ))}
          </ListCard>
          <ListCard title="Most followed authors">
            {a.top_authors.map((p, i) => (
              <li key={p.id} className="flex justify-between gap-3 py-2 text-sm">
                <Link href={`/author/${p.username}`} className="font-medium hover:underline">
                  {i + 1}. {p.display_name ?? p.username}
                </Link>
                <span className="opacity-60">
                  {fmt(p.followers)} followers · {fmt(p.stories)} stories
                </span>
              </li>
            ))}
          </ListCard>
          <ListCard title="Gone quiet (ongoing, no chapter in 30+ days)">
            {a.quiet_stories.map((s, i) => (
              <StoryLine key={s.id} i={i} s={s} meta={`${s.days_quiet} days quiet`} />
            ))}
          </ListCard>
        </div>

        {/* ECONOMY */}
        <Heading>Economy</Heading>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          <Tile label="Sparks in circulation" value={fmt(e.sparks_in_circulation)} />
          <Tile label="Embers in circulation" value={fmt(e.embers_in_circulation)} />
          <Tile label={`Sparks earned (${days}d)`} value={fmt(e.sparks_earned_period)} />
          <Tile label={`Sparks spent (${days}d)`} value={fmt(e.sparks_spent_period)} />
          <Tile label="Shop sales" value={fmt(e.shop_sales_period)} />
          <Tile label="Cosmetics sold" value={fmt(e.cosmetics_sold_period)} />
          <Tile label="Streak restores" value={fmt(e.restores_period)} />
          <Tile label="Gifts" value={fmt(e.gifts_period)} sub={`${fmt(e.gift_embers_period)} Embers`} />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <ListCard title="Sparks by source">
            <TypeBars rows={e.sparks_by_type} />
          </ListCard>
          <ListCard title="Embers by type">
            <TypeBars rows={e.embers_by_type} />
          </ListCard>
        </div>

        <div className="mt-6">
          <ListCard
            title={`Quests (${fmt(a.quests.active_players_period)} players with progress)`}
          >
            {a.quests.by_quest.map((q) => (
              <li key={q.slug} className="flex justify-between gap-3 py-2 text-sm">
                <span>
                  {q.title}{" "}
                  <span className="text-xs opacity-50">({q.scope})</span>
                </span>
                <span className="opacity-60">
                  {fmt(q.completed)} done / {fmt(q.started)} started
                  {q.started > 0 && ` · ${Math.round((q.completed / q.started) * 100)}%`}
                </span>
              </li>
            ))}
          </ListCard>
        </div>
      </div>
    </main>
  );
}

function Heading({ children }: { children: React.ReactNode }) {
  return <h2 className="mb-4 mt-12 text-xl font-semibold">{children}</h2>;
}

function Tile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border p-4" style={cardStyle}>
      <p className="text-xs opacity-60">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      {sub && <p className="text-xs opacity-60">{sub}</p>}
    </div>
  );
}

function ModCard({ label, href, row }: { label: string; href: string; row: ModRow }) {
  return (
    <Link
      href={href}
      className="rounded-2xl border p-4 transition hover:opacity-90"
      style={{
        ...cardStyle,
        borderColor: row.open > 0 ? "#f59e0b" : "var(--card-border)",
      }}
    >
      <p className="text-xs opacity-60">{label}</p>
      <p className="mt-1 text-3xl font-bold">{fmt(row.open)}</p>
      <p className="text-xs opacity-60">{age(row.oldest)}</p>
    </Link>
  );
}

function ListCard({ title, children }: { title: string; children: React.ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <div className="rounded-2xl border p-5" style={cardStyle}>
      <h3 className="text-lg font-semibold">{title}</h3>
      <ul className="mt-2 divide-y" style={{ borderColor: "var(--card-border)" }}>
        {items.length === 0 ? (
          <li className="py-3 text-sm opacity-60">Nothing to show.</li>
        ) : (
          children
        )}
      </ul>
    </div>
  );
}

function StoryLine({ s, i, meta }: { s: StoryRow; i: number; meta: string }) {
  return (
    <li className="flex justify-between gap-3 py-2 text-sm">
      <Link href={`/story/${s.slug}`} className="min-w-0 truncate font-medium hover:underline">
        {i + 1}. {s.title}
        {s.author && <span className="font-normal opacity-60"> by {s.author}</span>}
      </Link>
      <span className="shrink-0 opacity-60">{meta}</span>
    </li>
  );
}

function TypeBars({ rows }: { rows: TypeRow[] }) {
  if (!rows || rows.length === 0) {
    return <li className="py-3 text-sm opacity-60">Nothing in this period.</li>;
  }
  const max = Math.max(...rows.map((r) => Math.abs(r.total)), 1);
  return (
    <>
      {rows.map((r) => (
        <li key={r.type} className="py-2 text-sm">
          <div className="flex justify-between gap-3">
            <span>{r.type.replace(/_/g, " ")}</span>
            <span className="opacity-60">
              {r.total > 0 ? "+" : ""}
              {fmt(r.total)} · {fmt(r.n)}×
            </span>
          </div>
          <div className="mt-1 h-1.5 rounded-full" style={{ backgroundColor: "var(--card-border)" }}>
            <div
              className="h-1.5 rounded-full"
              style={{
                width: `${Math.max(4, (Math.abs(r.total) / max) * 100)}%`,
                backgroundColor: r.total >= 0 ? "#1baf7a" : "#eb6834",
              }}
            />
          </div>
        </li>
      ))}
    </>
  );
}
