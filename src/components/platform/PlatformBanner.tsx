import type { PublicSettings } from "@/lib/platform";

/*
 * A thin strip under the navbar: tells everyone when the site is
 * read-only or a feature is paused, tells admins when maintenance is
 * on (they can still see the site), and announces a Sparks event.
 */
export default function PlatformBanner({
  settings,
  isAdmin,
}: {
  settings: PublicSettings;
  isAdmin: boolean;
}) {
  const notes: { text: string; tone: "warn" | "info" | "good" }[] = [];

  if (settings.maintenance_mode && isAdmin) {
    notes.push({
      tone: "warn",
      text: "Maintenance mode is ON. Visitors see the maintenance screen; you can still use the site as an admin.",
    });
  }

  if (settings.read_only_mode) {
    notes.push({
      tone: "warn",
      text: "The site is read-only right now: reading works, but posting and changes are paused.",
    });
  }

  const paused: string[] = [];
  if (!settings.comments_enabled) paused.push("comments");
  if (!settings.reviews_enabled) paused.push("reviews");
  if (!settings.gifts_enabled) paused.push("gifting");
  if (!settings.shop_enabled) paused.push("the shop");
  if (!settings.quests_enabled) paused.push("quests");

  if (paused.length > 0 && !settings.read_only_mode) {
    notes.push({
      tone: "warn",
      text: `Paused for now: ${paused.join(", ")}.`,
    });
  }

  if (settings.sparks_multiplier > 1 && settings.quests_enabled) {
    const ends = settings.sparks_multiplier_ends_at
      ? new Date(settings.sparks_multiplier_ends_at)
      : null;

    notes.push({
      tone: "good",
      text: `Sparks event: quest rewards are x${settings.sparks_multiplier}${
        ends
          ? ` until ${ends.toLocaleString("en-US", {
              dateStyle: "medium",
              timeStyle: "short",
              timeZone: "UTC",
            })} UTC`
          : ""
      }!`,
    });
  }

  if (notes.length === 0) return null;

  return (
    <div className="flex flex-col" role="status">
      {notes.map((n) => (
        <div
          key={n.text}
          className="px-4 py-2 text-center text-sm font-medium"
          style={{
            backgroundColor:
              n.tone === "warn"
                ? "rgba(245, 158, 11, 0.18)"
                : "rgba(16, 185, 129, 0.16)",
            borderBottom: "1px solid var(--card-border)",
          }}
        >
          {n.text}
        </div>
      ))}
    </div>
  );
}
