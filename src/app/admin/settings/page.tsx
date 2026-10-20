import Link from "next/link";
import { redirect } from "next/navigation";
import { updateTag } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { PLATFORM_SETTINGS_TAG } from "@/lib/platform";
import LocalDateTimeInput from "@/components/admin/LocalDateTimeInput";

async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !["admin", "superadmin"].includes(profile.role)) {
    redirect("/");
  }

  return { supabase, user };
}

function isoOrNull(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return null;

  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
}

async function saveSettings(formData: FormData) {
  "use server";

  const { supabase } = await requireAdmin();

  const text = (key: string) => String(formData.get(key) ?? "").trim();
  const on = (key: string) => formData.get(key) === "on";

  const platformName = text("platform_name");

  if (!platformName) {
    redirect("/admin/settings?error=name");
  }

  const supportEmail = text("support_email");

  if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) {
    redirect("/admin/settings?error=email");
  }

  const multiplier = Number(text("sparks_multiplier") || "1");

  if (!Number.isFinite(multiplier) || multiplier < 1 || multiplier > 10) {
    redirect("/admin/settings?error=multiplier");
  }

  const startsAt = isoOrNull(formData.get("sparks_multiplier_starts_at"));
  const endsAt = isoOrNull(formData.get("sparks_multiplier_ends_at"));

  if (startsAt && endsAt && new Date(endsAt) <= new Date(startsAt)) {
    redirect("/admin/settings?error=window");
  }

  const { error } = await supabase
    .from("platform_settings")
    .update({
      platform_name: platformName,
      platform_description: text("platform_description"),
      support_email: supportEmail || null,

      allow_new_registrations: on("allow_new_registrations"),
      allow_author_applications: on("allow_author_applications"),

      comments_enabled: on("comments_enabled"),
      reviews_enabled: on("reviews_enabled"),
      gifts_enabled: on("gifts_enabled"),
      shop_enabled: on("shop_enabled"),
      quests_enabled: on("quests_enabled"),

      maintenance_mode: on("maintenance_mode"),
      read_only_mode: on("read_only_mode"),
      maintenance_message: text("maintenance_message") || null,
      maintenance_eta: isoOrNull(formData.get("maintenance_eta")),

      sparks_multiplier: Math.round(multiplier * 100) / 100,
      sparks_multiplier_starts_at: startsAt,
      sparks_multiplier_ends_at: endsAt,
    })
    .not("id", "is", null);

  if (error) {
    throw new Error(error.message);
  }

  // Make the site pick the new settings up right away.
  updateTag(PLATFORM_SETTINGS_TAG);

  redirect("/admin/settings?saved=1");
}

const ERRORS: Record<string, string> = {
  name: "Platform name is required.",
  email: "That support email doesn't look right.",
  multiplier: "The Sparks multiplier must be between 1 and 10.",
  window: "The Sparks event must end after it starts.",
};

const FIELD_LABELS: Record<string, string> = {
  platform_name: "Platform name",
  platform_description: "Description",
  support_email: "Support email",
  allow_new_registrations: "New registrations",
  allow_author_applications: "Author applications",
  comments_enabled: "Comments",
  reviews_enabled: "Reviews",
  gifts_enabled: "Gifting",
  shop_enabled: "Shop",
  quests_enabled: "Quests",
  maintenance_mode: "Maintenance (full lockout)",
  read_only_mode: "Read-only mode",
  maintenance_message: "Maintenance message",
  maintenance_eta: "Maintenance ETA",
  sparks_multiplier: "Sparks multiplier",
  sparks_multiplier_starts_at: "Sparks event start",
  sparks_multiplier_ends_at: "Sparks event end",
};

function showValue(field: string, value: string | null) {
  if (value === null || value === "") return "empty";
  if (value === "true") return "On";
  if (value === "false") return "Off";

  if (field.endsWith("_at") || field === "maintenance_eta") {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) {
      return (
        d.toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        }) + " UTC"
      );
    }
  }

  return value.length > 60 ? `${value.slice(0, 60)}…` : value;
}

const cardStyle = {
  backgroundColor: "var(--card)",
  borderColor: "var(--card-border)",
};

const inputClass =
  "w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  const { supabase } = await requireAdmin();

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("*")
    .limit(1)
    .single();

  if (!settings) {
    throw new Error("Platform settings could not be loaded.");
  }

  const { data: log } = await supabase
    .from("platform_settings_log")
    .select("id, changed_at, changed_by, field, old_value, new_value")
    .order("changed_at", { ascending: false })
    .order("id", { ascending: false })
    .limit(20);

  const editorIds = Array.from(
    new Set((log ?? []).map((l) => l.changed_by).filter(Boolean))
  ) as string[];

  const { data: editors } = editorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", editorIds)
    : { data: [] };

  const editorName = new Map(
    (editors ?? []).map((e) => [e.id, e.display_name ?? e.username])
  );

  const params = await searchParams;
  const saved = params.saved === "1";
  const errorText = params.error ? ERRORS[params.error] : null;

  const multiplierLive =
    Number(settings.sparks_multiplier) > 1 &&
    (!settings.sparks_multiplier_starts_at ||
      new Date(settings.sparks_multiplier_starts_at) <= new Date()) &&
    (!settings.sparks_multiplier_ends_at ||
      new Date(settings.sparks_multiplier_ends_at) > new Date());

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-10">
          <Link
            href="/admin"
            className="inline-flex items-center text-sm opacity-60 transition hover:opacity-100"
          >
            ← Back to Admin Control Center
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl shadow-sm"
              style={cardStyle}
            >
              ⚙️
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Platform Settings
              </h1>
              <p className="mt-1 text-sm opacity-60">
                Identity, access, feature switches, maintenance and Sparks
                events. Changes apply within seconds.
              </p>
            </div>
          </div>
        </div>

        {saved && (
          <div
            className="mb-6 rounded-2xl border p-4 text-sm"
            style={cardStyle}
          >
            <span className="font-semibold">✓ Settings saved</span>
            <span className="ml-2 opacity-70">
              The site is using them now.
            </span>
          </div>
        )}

        {errorText && (
          <div
            className="mb-6 rounded-2xl border p-4 text-sm font-semibold"
            style={{ ...cardStyle, borderColor: "#ef4444" }}
          >
            {errorText} Nothing was saved.
          </div>
        )}

        <form action={saveSettings} className="space-y-6">
          {/* IDENTITY */}
          <Section
            title="Platform Identity"
            hint="Shown in browser titles, link previews and the maintenance screen."
          >
            <Field label="Platform name">
              <input
                name="platform_name"
                defaultValue={settings.platform_name ?? ""}
                required
                maxLength={60}
                className={inputClass}
                style={{ borderColor: "var(--card-border)" }}
              />
            </Field>

            <Field label="Description">
              <textarea
                name="platform_description"
                defaultValue={settings.platform_description ?? ""}
                rows={3}
                maxLength={300}
                className={inputClass}
                style={{ borderColor: "var(--card-border)" }}
              />
            </Field>

            <Field label="Support email (optional)">
              <input
                name="support_email"
                type="email"
                defaultValue={settings.support_email ?? ""}
                placeholder="support@example.com"
                className={inputClass}
                style={{ borderColor: "var(--card-border)" }}
              />
            </Field>
          </Section>

          {/* ACCESS */}
          <Section
            title="Access"
            hint="Closing registrations blocks both email and Google sign-ups. Existing members can still sign in."
          >
            <Toggle
              name="allow_new_registrations"
              label="Allow new registrations"
              description="When off, nobody new can create an account."
              checked={settings.allow_new_registrations}
            />
            <Toggle
              name="allow_author_applications"
              label="Allow author applications"
              description="When off, readers can't become authors."
              checked={settings.allow_author_applications}
            />
          </Section>

          {/* FEATURES */}
          <Section
            title="Feature Switches"
            hint="Pause a feature without taking the whole site down. Admins are never blocked."
          >
            <Toggle
              name="comments_enabled"
              label="Comments"
              description="Chapter and paragraph comments."
              checked={settings.comments_enabled}
            />
            <Toggle
              name="reviews_enabled"
              label="Reviews"
              description="Story ratings and reviews."
              checked={settings.reviews_enabled}
            />
            <Toggle
              name="gifts_enabled"
              label="Gifting"
              description="Sending Ember gifts to stories."
              checked={settings.gifts_enabled}
            />
            <Toggle
              name="shop_enabled"
              label="Shop"
              description="Boosters, freezes, cosmetics, streak restores and Ember exchange."
              checked={settings.shop_enabled}
            />
            <Toggle
              name="quests_enabled"
              label="Quests"
              description="Quest progress and rewards. Streaks and reading are not affected."
              checked={settings.quests_enabled}
            />
          </Section>

          {/* MAINTENANCE */}
          <Section
            title="Maintenance"
            hint="Two separate switches. Admins can always use the site."
          >
            <Toggle
              name="read_only_mode"
              label="Read-only mode"
              description="Everyone can read, but posting, writing, gifting and buying are paused. A banner explains it."
              checked={settings.read_only_mode}
              danger
            />
            <Toggle
              name="maintenance_mode"
              label="Full lockout"
              description="Visitors see a maintenance screen instead of the site. Sign-in pages stay reachable."
              checked={settings.maintenance_mode}
              danger
            />

            <Field label="Message shown to visitors (optional)">
              <textarea
                name="maintenance_message"
                defaultValue={settings.maintenance_message ?? ""}
                rows={3}
                maxLength={400}
                className={inputClass}
                style={{ borderColor: "var(--card-border)" }}
              />
            </Field>

            <Field label="Expected back (optional, your local time)">
              <LocalDateTimeInput
                name="maintenance_eta"
                defaultValue={settings.maintenance_eta}
              />
            </Field>
          </Section>

          {/* SPARKS EVENT */}
          <Section
            title="Sparks Event"
            hint="Multiplies every quest reward (including the daily and weekly bonuses). Streak and breakthrough Sparks are not changed."
          >
            {multiplierLive && (
              <p className="text-sm font-semibold">
                ⚡ Live now: x{Number(settings.sparks_multiplier)}
              </p>
            )}

            <Field label="Multiplier (1 = no event, up to 10)">
              <input
                name="sparks_multiplier"
                type="number"
                min={1}
                max={10}
                step={0.25}
                defaultValue={Number(settings.sparks_multiplier)}
                className={inputClass}
                style={{ borderColor: "var(--card-border)" }}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Starts (empty = right away)">
                <LocalDateTimeInput
                  name="sparks_multiplier_starts_at"
                  defaultValue={settings.sparks_multiplier_starts_at}
                />
              </Field>
              <Field label="Ends (empty = until you set it back to 1)">
                <LocalDateTimeInput
                  name="sparks_multiplier_ends_at"
                  defaultValue={settings.sparks_multiplier_ends_at}
                />
              </Field>
            </div>
          </Section>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              className="rounded-xl px-6 py-3 text-sm font-semibold"
              style={{
                backgroundColor: "var(--button)",
                color: "var(--button-text)",
              }}
            >
              Save settings
            </button>

            {settings.updated_at && (
              <p className="text-xs opacity-60">
                Last updated{" "}
                {new Date(settings.updated_at).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                  timeZone: "UTC",
                })}{" "}
                UTC
              </p>
            )}
          </div>
        </form>

        {/* HISTORY */}
        <section
          className="mt-10 rounded-2xl border p-6"
          style={cardStyle}
        >
          <h2 className="text-xl font-semibold">Change history</h2>
          <p className="mt-1 text-sm opacity-60">
            The last {log?.length ?? 0} changes, newest first.
          </p>

          {!log || log.length === 0 ? (
            <p className="mt-4 text-sm opacity-60">
              Nothing has been changed yet.
            </p>
          ) : (
            <ul className="mt-4 divide-y" style={{ borderColor: "var(--card-border)" }}>
              {log.map((l) => (
                <li key={l.id} className="py-3 text-sm">
                  <span className="font-semibold">
                    {FIELD_LABELS[l.field] ?? l.field}
                  </span>
                  : {showValue(l.field, l.old_value)} →{" "}
                  <span className="font-semibold">
                    {showValue(l.field, l.new_value)}
                  </span>
                  <span className="block text-xs opacity-60">
                    {editorName.get(l.changed_by ?? "") ?? "System"} ·{" "}
                    {new Date(l.changed_at).toLocaleString("en-US", {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: "UTC",
                    })}{" "}
                    UTC
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border p-6" style={cardStyle}>
      <h2 className="text-xl font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm opacity-60">{hint}</p>}
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}

function Toggle({
  name,
  label,
  description,
  checked,
  danger,
}: {
  name: string;
  label: string;
  description: string;
  checked: boolean;
  danger?: boolean;
}) {
  return (
    <label
      className="flex cursor-pointer items-start justify-between gap-4 rounded-xl border p-4"
      style={{
        borderColor: danger && checked ? "#f59e0b" : "var(--card-border)",
      }}
    >
      <span>
        <span className="block text-sm font-semibold">{label}</span>
        <span className="mt-1 block text-sm opacity-60">{description}</span>
      </span>
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        className="mt-1 h-5 w-5 shrink-0"
      />
    </label>
  );
}
