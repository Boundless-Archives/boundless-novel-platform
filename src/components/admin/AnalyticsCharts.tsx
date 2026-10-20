"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type SeriesRow = {
  day: string;
  signups: number;
  stories: number;
  chapters: number;
  comments: number;
  reviews: number;
  active: number;
  reads: number;
  sparks_earned: number;
  sparks_spent: number;
};

// Validated categorical order: blue, orange, aqua, yellow.
const BLUE = "#2a78d6";
const ORANGE = "#eb6834";
const AQUA = "#1baf7a";
const YELLOW = "#eda100";

const axisProps = {
  tick: { fontSize: 12, fill: "currentColor", opacity: 0.65 },
  tickLine: false,
  axisLine: false,
} as const;

function shortDay(day: string) {
  const d = new Date(`${day}T00:00:00Z`);
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

const tooltipStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--card-border)",
  borderRadius: 12,
  fontSize: 13,
};

function Frame({
  title,
  hint,
  children,
}: {
  title: string;
  hint: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border p-5"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mb-4 mt-1 text-sm opacity-60">{hint}</p>
      <div className="h-[280px] w-full">{children}</div>
    </div>
  );
}

export default function AnalyticsCharts({ data }: { data: SeriesRow[] }) {
  const common = {
    data,
    margin: { top: 4, right: 8, left: -12, bottom: 0 },
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Frame
        title="Readers"
        hint="Active members per day and chapters finished (verified reads)."
      >
        <ResponsiveContainer>
          <LineChart {...common}>
            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.1} />
            <XAxis dataKey="day" tickFormatter={shortDay} minTickGap={24} {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip labelFormatter={(l) => shortDay(String(l))} contentStyle={tooltipStyle} />
            <Legend />
            <Line type="monotone" dataKey="active" name="Active members" stroke={BLUE} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="reads" name="Verified reads" stroke={ORANGE} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Frame>

      <Frame
        title="Growth"
        hint="New signups, new stories and published chapters per day."
      >
        <ResponsiveContainer>
          <BarChart {...common}>
            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.1} />
            <XAxis dataKey="day" tickFormatter={shortDay} minTickGap={24} {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip labelFormatter={(l) => shortDay(String(l))} contentStyle={tooltipStyle} cursor={{ fill: "currentColor", fillOpacity: 0.06 }} />
            <Legend />
            <Bar dataKey="signups" name="Signups" fill={BLUE} radius={[4, 4, 0, 0]} />
            <Bar dataKey="stories" name="New stories" fill={ORANGE} radius={[4, 4, 0, 0]} />
            <Bar dataKey="chapters" name="Chapters" fill={AQUA} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Frame>

      <Frame
        title="Engagement"
        hint="Comments and reviews written per day."
      >
        <ResponsiveContainer>
          <BarChart {...common}>
            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.1} />
            <XAxis dataKey="day" tickFormatter={shortDay} minTickGap={24} {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip labelFormatter={(l) => shortDay(String(l))} contentStyle={tooltipStyle} cursor={{ fill: "currentColor", fillOpacity: 0.06 }} />
            <Legend />
            <Bar dataKey="comments" name="Comments" fill={BLUE} radius={[4, 4, 0, 0]} />
            <Bar dataKey="reviews" name="Reviews" fill={YELLOW} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </Frame>

      <Frame
        title="Sparks"
        hint="Sparks earned (quests, streaks, breakthroughs) against Sparks spent in the shop."
      >
        <ResponsiveContainer>
          <LineChart {...common}>
            <CartesianGrid vertical={false} stroke="currentColor" strokeOpacity={0.1} />
            <XAxis dataKey="day" tickFormatter={shortDay} minTickGap={24} {...axisProps} />
            <YAxis allowDecimals={false} {...axisProps} />
            <Tooltip labelFormatter={(l) => shortDay(String(l))} contentStyle={tooltipStyle} />
            <Legend />
            <Line type="monotone" dataKey="sparks_earned" name="Earned" stroke={AQUA} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="sparks_spent" name="Spent" stroke={ORANGE} strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Frame>
    </div>
  );
}
