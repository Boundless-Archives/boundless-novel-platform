import Link from "next/link";
import { createAdminClient } from "@/utils/supabase/admin";
import LocalTime from "@/components/events/LocalTime";

function greetingFor(hour: number) {
  if (hour < 5) return "Burning the midnight oil";
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/*
 * A personal welcome and a "what's happening" strip for signed-in readers.
 * Everything here is one small query each; a failure of any one just hides
 * its chip.
 */
export default async function HomeGreeting({
  userId,
  hour,
}: {
  userId: string;
  hour: number;
}) {
  const admin = createAdminClient();

  const [profile, streak, unread, cult, rsvp] = await Promise.all([
    admin.from("profiles").select("display_name, username").eq("id", userId).maybeSingle(),
    admin
      .from("streaks")
      .select("current_streak")
      .eq("user_id", userId)
      .eq("streak_type", "reader")
      .maybeSingle(),
    admin
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("is_read", false),
    admin
      .from("cultivation_profiles")
      .select("path, current_major")
      .eq("user_id", userId)
      .maybeSingle(),
    admin.from("event_rsvps").select("event_id").eq("user_id", userId).limit(50),
  ]);

  const name = profile.data?.display_name || profile.data?.username || "traveller";
  const days = streak.data?.current_streak ?? 0;
  const unreadCount = unread.count ?? 0;

  let realm: string | null = null;
  if (cult.data) {
    const { data } = await admin
      .from("cultivation_realms")
      .select("major_name")
      .eq("path", cult.data.path)
      .eq("major_number", cult.data.current_major)
      .limit(1)
      .maybeSingle();
    realm = data?.major_name ?? null;
  }

  // The next event they said they're going to.
  let next: { id: string; title: string; starts_at: string } | null = null;
  const ids = (rsvp.data ?? []).map((r) => r.event_id);
  if (ids.length) {
    const { data } = await admin
      .from("events")
      .select("id, title, starts_at")
      .in("id", ids)
      .eq("cancelled", false)
      .gte("starts_at", new Date().toISOString())
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle();
    next = data ?? null;
  }

  const chip = "flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition hover:-translate-y-0.5";
  const border = { borderColor: "var(--card-border)", backgroundColor: "var(--card)" };

  return (
    <section className="mb-12">
      <h2 className="text-2xl font-bold">
        {greetingFor(hour)}, {name}.
      </h2>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link href="/profile" className={chip} style={border}>
          🔥 {days > 0 ? `${days}-day reading streak` : "Start a reading streak"}
        </Link>

        <Link href="/notifications" className={chip} style={border}>
          🔔 {unreadCount > 0 ? `${unreadCount} unread in your inbox` : "Inbox is clear"}
        </Link>

        {realm && (
          <Link href="/cultivation" className={chip} style={border}>
            🧘 {realm}
          </Link>
        )}

        {next ? (
          <Link href="/events" className={chip} style={border}>
            📅 {next.title} · <LocalTime iso={next.starts_at} />
          </Link>
        ) : (
          <Link href="/events" className={chip} style={border}>
            📅 See what&apos;s on
          </Link>
        )}

        <Link href="/quests" className={chip} style={border}>
          ✨ Today&apos;s quests
        </Link>
      </div>
    </section>
  );
}
