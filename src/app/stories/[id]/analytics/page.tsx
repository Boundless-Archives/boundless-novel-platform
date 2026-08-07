import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

import StoryAnalyticsChart from "@/components/story/StoryAnalyticsChart";

type Props = {
  params: Promise<{
    id: string;
  }>;
};

type DailyStat = {
  day: string;
  views: number;
  unique_readers: number;
  reading_sessions: number;
};

export default async function StoryAnalyticsPage({
  params,
}: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  /*
   * Load the story and verify ownership.
   */
  const { data: story } = await supabase
    .from("stories")
    .select("*")
    .eq("id", id)
    .single();

  if (!story) {
    notFound();
  }

  if (story.author_id !== user.id) {
    redirect("/stories");
  }

  /*
   * Lifetime statistics.
   */
  const { data: stats } = await supabase
    .from("story_stats")
    .select("*")
    .eq("story_id", story.id)
    .maybeSingle();

  /*
   * Last 30 days of daily statistics.
   */
  const today = new Date();

  const startDate = new Date(today);

  startDate.setDate(
    startDate.getDate() - 29
  );

  const startDateString =
    startDate.toISOString().split("T")[0];

  const { data: dailyStats } = await supabase
    .from("story_daily_stats")
    .select(`
      day,
      views,
      unique_readers,
      reading_sessions
    `)
    .eq("story_id", story.id)
    .gte("day", startDateString)
    .order("day", {
      ascending: true,
    });

  /*
   * Index existing rows by date.
   */
  const statsByDay = new Map(
    (dailyStats ?? []).map((row) => [
      row.day,
      {
        day: row.day,
        views: row.views ?? 0,
        unique_readers:
          row.unique_readers ?? 0,
        reading_sessions:
          row.reading_sessions ?? 0,
      },
    ])
  );

  /*
   * Generate every day in the 30-day range.
   * Missing days become zero.
   */
  const chartData: DailyStat[] = [];

  for (let i = 0; i < 30; i++) {
    const date = new Date(startDate);

    date.setDate(
      startDate.getDate() + i
    );

    const day =
      date.toISOString().split("T")[0];

    chartData.push(
      statsByDay.get(day) ?? {
        day,
        views: 0,
        unique_readers: 0,
        reading_sessions: 0,
      }
    );
  }

  /*
   * Calculate the 30-day totals.
   */
  const periodViews = chartData.reduce(
    (total, row) =>
      total + row.views,
    0
  );

  const periodSessions = chartData.reduce(
    (total, row) =>
      total + row.reading_sessions,
    0
  );

  const periodReaders = chartData.reduce(
    (total, row) =>
      total + row.unique_readers,
    0
  );

  return (

  <main className="max-w-6xl mx-auto px-6 py-10">

{/* Header */}

<div className="mb-10">

  <Link
    href={`/stories/${story.id}`}
    className="
      inline-flex
      items-center
      text-sm
      opacity-70
      hover:opacity-100
      transition
    "
  >
    ← Back to Manage Story
  </Link>

  <div className="mt-5">

    <h1 className="text-4xl font-bold">
      Story Analytics
    </h1>

    <p className="mt-2 text-lg opacity-70">
      {story.title}
    </p>

    <p className="mt-2 text-sm opacity-60">
      Track how readers are discovering and engaging
      with your story.
    </p>

  </div>

</div>


{/* Lifetime Overview */}

<section>

  <div className="mb-4">

    <h2 className="text-2xl font-bold">
      Lifetime Overview
    </h2>

    <p className="mt-1 text-sm opacity-60">
      Overall performance since your story was published.
    </p>

  </div>


  <div
    className="
      grid
      grid-cols-1
      sm:grid-cols-2
      lg:grid-cols-4
      gap-4
    "
  >

    <div
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <p className="text-sm opacity-60">
        👁 Total Views
      </p>

      <p className="mt-2 text-3xl font-bold">
        {stats?.views ?? 0}
      </p>
    </div>


    <div
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <p className="text-sm opacity-60">
        👤 Unique Readers
      </p>

      <p className="mt-2 text-3xl font-bold">
        {stats?.unique_readers ?? 0}
      </p>
    </div>


    <div
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <p className="text-sm opacity-60">
        ❤️ Likes
      </p>

      <p className="mt-2 text-3xl font-bold">
        {stats?.likes ?? 0}
      </p>
    </div>


    <div
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <p className="text-sm opacity-60">
        ⭐ Average Rating
      </p>

      <p className="mt-2 text-3xl font-bold">
        {stats?.average_rating
          ? Number(stats.average_rating).toFixed(1)
          : "—"}
      </p>

    </div>

  </div>

</section>


{/* Performance Chart */}

<section className="mt-12">

  <div className="mb-4">

    <h2 className="text-2xl font-bold">
      30-Day Performance
    </h2>

    <p className="mt-1 text-sm opacity-60">
      Reader activity across the last 30 days.
    </p>

  </div>


  <div
    className="
      rounded-2xl
      border
      p-6
    "
    style={{
      backgroundColor: "var(--card)",
      borderColor: "var(--card-border)",
    }}
  >

    <StoryAnalyticsChart
      data={chartData}
    />

  </div>

</section>


{/* Period Summary */}

<section className="mt-12">

  <div className="mb-4">

    <h2 className="text-2xl font-bold">
      30-Day Summary
    </h2>

    <p className="mt-1 text-sm opacity-60">
      A quick breakdown of activity during this period.
    </p>

  </div>


  <div
    className="
      grid
      grid-cols-1
      sm:grid-cols-3
      gap-4
    "
  >

    <div
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >

      <p className="text-sm opacity-60">
        👁 Views
      </p>

      <p className="mt-2 text-2xl font-bold">
        {periodViews}
      </p>

      <p className="mt-1 text-xs opacity-50">
        Total views during this period
      </p>

    </div>


    <div
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >

      <p className="text-sm opacity-60">
        👤 Reader Visits
      </p>

      <p className="mt-2 text-2xl font-bold">
        {periodReaders}
      </p>

      <p className="mt-1 text-xs opacity-50">
        Unique-reader counts across active days
      </p>

    </div>


    <div
      className="rounded-2xl border p-6"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >

      <p className="text-sm opacity-60">
        📖 Reading Sessions
      </p>

      <p className="mt-2 text-2xl font-bold">
        {periodSessions}
      </p>

      <p className="mt-1 text-xs opacity-50">
        Reading sessions recorded
      </p>

    </div>

  </div>

</section>


{/* Analytics Explanation */}

<section
  className="
    mt-12
    rounded-2xl
    border
    p-6
  "
  style={{
    backgroundColor: "var(--card)",
    borderColor: "var(--card-border)",
  }}
>

  <h2 className="text-xl font-bold">
    Understanding Your Analytics
  </h2>

  <div className="mt-4 space-y-3 text-sm opacity-70">

    <p>
      <strong className="opacity-100">
        Views
      </strong>{" "}
      represent counted reading activity on your story.
    </p>

    <p>
      <strong className="opacity-100">
        Unique Readers
      </strong>{" "}
      represent readers who have interacted with your story.
    </p>

    <p>
      <strong className="opacity-100">
        Reading Sessions
      </strong>{" "}
      represent recorded reading activity during the selected period.
    </p>

    <p>
      Your 30-day chart currently shows the last 30 calendar days,
      including days where no activity was recorded.
    </p>

  </div>

</section>

  </main>
  )
}
