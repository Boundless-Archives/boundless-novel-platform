"use client";

/* Shows a moment in the reader's own timezone. */
export default function LocalTime({
  iso,
  withDate = true,
}: {
  iso: string;
  withDate?: boolean;
}) {
  const d = new Date(iso);
  const text = d.toLocaleString(undefined, {
    weekday: withDate ? "short" : undefined,
    month: withDate ? "short" : undefined,
    day: withDate ? "numeric" : undefined,
    hour: "numeric",
    minute: "2-digit",
  });
  return <time dateTime={iso} suppressHydrationWarning>{text}</time>;
}
