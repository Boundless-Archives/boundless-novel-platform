import type { PublicSettings } from "@/lib/platform";

export default function MaintenanceScreen({
  settings,
}: {
  settings: PublicSettings;
}) {
  const eta = settings.maintenance_eta
    ? new Date(settings.maintenance_eta)
    : null;

  const etaText =
    eta && !Number.isNaN(eta.getTime())
      ? eta.toLocaleString("en-US", {
          dateStyle: "medium",
          timeStyle: "short",
          timeZone: "UTC",
        }) + " UTC"
      : null;

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-16">
      <div
        className="w-full max-w-lg rounded-3xl border p-8 text-center"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="text-5xl" aria-hidden="true">
          🛠️
        </div>

        <h1 className="mt-4 text-3xl font-bold">
          We&apos;ll be right back
        </h1>

        <p className="mt-3 opacity-80">
          {settings.maintenance_message?.trim() ||
            `${settings.platform_name} is getting some care right now. Your library, streaks and progress are safe.`}
        </p>

        {etaText ? (
          <p className="mt-4 text-sm opacity-70">
            Expected back around <strong>{etaText}</strong>
          </p>
        ) : null}

        {settings.support_email ? (
          <p className="mt-6 text-sm opacity-70">
            Need us?{" "}
            <a
              href={`mailto:${settings.support_email}`}
              className="underline"
            >
              {settings.support_email}
            </a>
          </p>
        ) : null}

        <p className="mt-6 text-xs opacity-50">
          Admin?{" "}
          <a href="/auth/login" className="underline">
            Sign in
          </a>
        </p>
      </div>
    </main>
  );
}
