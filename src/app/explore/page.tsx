import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import StoryGrid from "@/components/story/StoryGrid";

export const metadata = {
  title: "Explore",
  description:
    "Browse every story on Boundless by genre, status and rating. Find your next obsession.",
};

const SORTS = [
  { key: "new", label: "Newest" },
  { key: "updated", label: "Recently updated" },
  { key: "rating", label: "Top rated" },
  { key: "popular", label: "Most popular" },
] as const;

const STATUSES = ["Ongoing", "Completed"] as const;
const RATINGS = [4, 3] as const;

type SortKey = (typeof SORTS)[number]["key"];

type Search = {
  genre?: string;
  status?: string;
  rating?: string;
  sort?: string;
};

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: allStories } = await supabase
    .from("stories")
    .select(`
      *,
      profiles (
        username,
        display_name
      ),
      story_stats (
        views,
        likes,
        library_adds,
        reviews,
        average_rating
      )
    `)
    .neq("status", "Draft")
    .order("created_at", { ascending: false })
    .limit(300);

  const stories = allStories ?? [];

  const { data: links } = stories.length
    ? await supabase
        .from("story_genres")
        .select("story_id, genres ( id, name, slug )")
        .in("story_id", stories.map((s) => s.id))
    : { data: [] };

  type GenreRef = { id: string; name: string; slug: string };

  const genresByStory = new Map<string, GenreRef[]>();
  const genreCount = new Map<string, { genre: GenreRef; n: number }>();

  for (const row of links ?? []) {
    const g = (Array.isArray(row.genres) ? row.genres[0] : row.genres) as GenreRef | null;
    if (!g) continue;
    genresByStory.set(row.story_id, [...(genresByStory.get(row.story_id) ?? []), g]);
    const entry = genreCount.get(g.slug) ?? { genre: g, n: 0 };
    entry.n += 1;
    genreCount.set(g.slug, entry);
  }

  const genreList = [...genreCount.values()].sort(
    (a, b) => b.n - a.n || a.genre.name.localeCompare(b.genre.name)
  );

  const genre = genreList.find((g) => g.genre.slug === sp.genre)?.genre.slug ?? null;
  const status = (STATUSES as readonly string[]).includes(sp.status ?? "") ? sp.status! : null;
  const minRating = RATINGS.find((r) => String(r) === sp.rating) ?? null;
  const sort: SortKey = SORTS.find((s) => s.key === sp.sort)?.key ?? "new";

  const rating = (s: (typeof stories)[number]) =>
    Number(s.story_stats?.average_rating ?? 0);
  const popularity = (s: (typeof stories)[number]) =>
    (s.story_stats?.views ?? 0) +
    (s.story_stats?.likes ?? 0) * 3 +
    (s.story_stats?.library_adds ?? 0) * 5;
  const stamp = (v: string | null | undefined) => (v ? new Date(v).getTime() : 0);

  const shown = stories
    .filter((s) => !genre || (genresByStory.get(s.id) ?? []).some((g) => g.slug === genre))
    .filter((s) => !status || s.status === status)
    .filter((s) => !minRating || rating(s) >= minRating)
    .sort((a, b) => {
      switch (sort) {
        case "updated":
          return stamp(b.updated_at) - stamp(a.updated_at);
        case "rating":
          return rating(b) - rating(a) || popularity(b) - popularity(a);
        case "popular":
          return popularity(b) - popularity(a);
        default:
          return stamp(b.published_at ?? b.created_at) - stamp(a.published_at ?? a.created_at);
      }
    })
    .map((s) => ({
      ...s,
      genreNames: (genresByStory.get(s.id) ?? []).map((g) => g.name),
    }));

  const href = (patch: Partial<Record<keyof Search, string | null>>) => {
    const next: Record<string, string> = {};
    const merged = { genre, status, rating: minRating ? String(minRating) : null, sort: sort === "new" ? null : sort, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) next[k] = v;
    const qs = new URLSearchParams(next).toString();
    return qs ? `/explore?${qs}` : "/explore";
  };

  const pill = (active: boolean) =>
    `rounded-full border px-3.5 py-1.5 text-sm font-medium transition whitespace-nowrap ${
      active ? "" : "opacity-65 hover:opacity-100"
    }`;
  const pillStyle = (active: boolean) =>
    active
      ? { backgroundColor: "var(--button)", color: "var(--button-text)", borderColor: "var(--button)" }
      : { borderColor: "var(--card-border)" };

  const filtering = !!(genre || status || minRating);

  return (
    <main className="max-w-7xl mx-auto px-6 py-10">
      <section className="mb-8">
        <h1 className="text-5xl font-bold">Explore</h1>
        <p className="mt-4 max-w-3xl text-lg opacity-80">
          Discover fresh adventures, hidden gems, and stories waiting to
          become your next obsession.
        </p>
      </section>

      <section className="mb-8 space-y-4" aria-label="Filters">
        {genreList.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <Link href={href({ genre: null })} className={pill(!genre)} style={pillStyle(!genre)}>
              All genres
            </Link>
            {genreList.map(({ genre: g, n }) => (
              <Link
                key={g.slug}
                href={href({ genre: g.slug })}
                className={pill(genre === g.slug)}
                style={pillStyle(genre === g.slug)}
              >
                {g.name} · {n}
              </Link>
            ))}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="opacity-60">Status</span>
            <Link href={href({ status: null })} className={pill(!status)} style={pillStyle(!status)}>
              Any
            </Link>
            {STATUSES.map((s) => (
              <Link key={s} href={href({ status: s })} className={pill(status === s)} style={pillStyle(status === s)}>
                {s}
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="opacity-60">Rating</span>
            <Link href={href({ rating: null })} className={pill(!minRating)} style={pillStyle(!minRating)}>
              Any
            </Link>
            {RATINGS.map((r) => (
              <Link key={r} href={href({ rating: String(r) })} className={pill(minRating === r)} style={pillStyle(minRating === r)}>
                {r}★ &amp; up
              </Link>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="opacity-60">Sort</span>
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={href({ sort: s.key === "new" ? null : s.key })}
                className={pill(sort === s.key)}
                style={pillStyle(sort === s.key)}
              >
                {s.label}
              </Link>
            ))}
          </div>
        </div>

        <p className="text-sm opacity-60">
          {shown.length} {shown.length === 1 ? "story" : "stories"}
          {filtering && (
            <>
              {" · "}
              <Link href="/explore" className="underline underline-offset-4">
                Clear filters
              </Link>
            </>
          )}
        </p>
      </section>

      {!shown.length ? (
        <div
          className="rounded-2xl border p-12 text-center"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}
        >
          <div className="text-6xl mb-5">📚</div>
          <h2 className="text-3xl font-bold">
            {filtering ? "No stories match those filters" : "Nothing here yet"}
          </h2>
          <p className="mt-4 opacity-70">
            {filtering ? "Try loosening a filter." : "New stories will appear here soon."}
          </p>
          {filtering && (
            <Link href="/explore" className="mt-6 inline-block underline underline-offset-4">
              Clear filters
            </Link>
          )}
        </div>
      ) : (
        <StoryGrid stories={shown} />
      )}
    </main>
  );
}
