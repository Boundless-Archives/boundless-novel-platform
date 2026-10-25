import Link from "next/link";
import Card from "@/components/ui/Card";
import ConfirmButton from "@/components/guilds/ConfirmButton";
import LocalTime from "./LocalTime";
import { cancelEventAction, rsvpAction } from "@/app/events/actions";

export type EventRow = {
  id: string;
  guild_id: string | null;
  created_by: string | null;
  title: string;
  summary: string;
  body: string;
  link: string | null;
  starts_at: string;
  ends_at: string | null;
  cancelled: boolean;
  rsvp_count: number;
};

export default function EventCard({
  event,
  going,
  canCancel,
  signedIn,
  guildName,
  guildSlug,
}: {
  event: EventRow;
  going: boolean;
  canCancel: boolean;
  signedIn: boolean;
  guildName?: string | null;
  guildSlug?: string | null;
}) {
  const over =
    new Date(event.ends_at ?? new Date(event.starts_at).getTime() + 2 * 3600_000) < new Date();

  return (
    <Card>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="font-semibold">
          {event.title}
          {event.cancelled && (
            <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
              Cancelled
            </span>
          )}
        </h3>
        <span className="text-sm opacity-70">
          <LocalTime iso={event.starts_at} />
          {event.ends_at && (
            <>
              {" → "}
              <LocalTime iso={event.ends_at} withDate={false} />
            </>
          )}
        </span>
      </div>

      {guildName && guildSlug && (
        <p className="mt-1 text-xs opacity-60">
          <Link href={`/guilds/${guildSlug}`} className="underline underline-offset-4">
            {guildName}
          </Link>
        </p>
      )}

      {event.summary && <p className="mt-2 text-sm opacity-80">{event.summary}</p>}
      {event.body && (
        <p className="mt-2 whitespace-pre-wrap text-sm opacity-70">{event.body}</p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
        {!event.cancelled && !over && (
          signedIn ? (
            <form action={rsvpAction}>
              <input type="hidden" name="eventId" value={event.id} />
              {guildSlug && <input type="hidden" name="guildSlug" value={guildSlug} />}
              <button
                type="submit"
                className="rounded-lg border px-3 py-1.5 font-semibold"
                style={
                  going
                    ? { backgroundColor: "var(--button)", color: "var(--button-text)" }
                    : { borderColor: "var(--card-border)" }
                }
              >
                {going ? "✓ Going" : "I'm going"}
              </button>
            </form>
          ) : (
            <Link href="/auth/login" className="underline underline-offset-4">
              Sign in to RSVP
            </Link>
          )
        )}

        <span className="opacity-60">
          {event.rsvp_count} going
        </span>

        {event.link && (
          <Link
            href={event.link}
            className="underline underline-offset-4"
            {...(event.link.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            More info ↗
          </Link>
        )}

        {canCancel && !event.cancelled && !over && (
          <form action={cancelEventAction}>
            <input type="hidden" name="eventId" value={event.id} />
            {guildSlug && <input type="hidden" name="guildSlug" value={guildSlug} />}
            <ConfirmButton message="Cancel this event? People who said they're going will be told.">
              Cancel event
            </ConfirmButton>
          </form>
        )}
      </div>
    </Card>
  );
}
