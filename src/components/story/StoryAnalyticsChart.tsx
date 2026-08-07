"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type AnalyticsRow = {
  day: string;
  views: number;
  unique_readers: number;
  reading_sessions: number;
};

type StoryAnalyticsChartProps = {
  data: AnalyticsRow[];
};

export default function StoryAnalyticsChart({
  data,
}: StoryAnalyticsChartProps) {
  return (
    <div
      className="
        w-full
        rounded-2xl
        border
        p-6
      "
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold">
          Reader Activity
        </h2>

        <p className="mt-1 text-sm opacity-70">
          Views, unique readers, and reading sessions over time.
        </p>
      </div>

      <div className="h-[350px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="day"
              tickFormatter={(value) =>
                new Date(value).toLocaleDateString(
                  "en-US",
                  {
                    month: "short",
                    day: "numeric",
                  }
                )
              }
            />

            <YAxis allowDecimals={false} />
            
            <Tooltip
              labelFormatter={(value) => {
                const date = new Date(String(value));

                return date.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                });
              }}
            />

            <Line
              type="monotone"
              dataKey="views"
              name="Views"
              stroke="currentColor"
              strokeWidth={2}
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="unique_readers"
              name="Unique Readers"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={false}
            />

            <Line
              type="monotone"
              dataKey="reading_sessions"
              name="Reading Sessions"
              stroke="currentColor"
              strokeWidth={2}
              strokeDasharray="2 2"
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
