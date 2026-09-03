import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

async function saveSettings(formData: FormData) {
  "use server";

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

  if (
    !profile ||
    !["admin", "superadmin"].includes(profile.role)
  ) {
    redirect("/");
  }

  const platformName =
    String(formData.get("platform_name") ?? "").trim();

  const platformDescription =
    String(
      formData.get("platform_description") ?? ""
    ).trim();

  const allowNewRegistrations =
    formData.get("allow_new_registrations") === "on";

  const allowAuthorApplications =
    formData.get("allow_author_applications") === "on";

  const maintenanceMode =
    formData.get("maintenance_mode") === "on";

  if (!platformName) {
    throw new Error("Platform name is required.");
  }

  const { error } = await supabase
    .from("platform_settings")
    .update({
      platform_name: platformName,
      platform_description: platformDescription,
      allow_new_registrations:
        allowNewRegistrations,
      allow_author_applications:
        allowAuthorApplications,
      maintenance_mode: maintenanceMode,
    })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/settings?saved=1");
}

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{
    saved?: string;
  }>;
}) {
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

  if (
    !profile ||
    !["admin", "superadmin"].includes(profile.role)
  ) {
    redirect("/");
  }

  const { data: settings } = await supabase
    .from("platform_settings")
    .select(`
      id,
      platform_name,
      platform_description,
      allow_new_registrations,
      allow_author_applications,
      maintenance_mode,
      updated_at
    `)
    .limit(1)
    .single();

  if (!settings) {
    throw new Error(
      "Platform settings could not be loaded."
    );
  }

  const params = await searchParams;
  const saved = params.saved === "1";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-6 py-10">

        {/* HEADER */}

        <div className="mb-10">
          <Link
            href="/admin"
            className="
              inline-flex
              items-center
              text-sm
              opacity-60
              transition
              hover:opacity-100
            "
          >
            ← Back to Admin Control Center
          </Link>

          <div className="mt-6 flex items-center gap-4">
            <div
              className="
                flex
                h-14
                w-14
                items-center
                justify-center
                rounded-2xl
                border
                bg-[var(--card)]
                text-2xl
                shadow-sm
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >
              ⚙️
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight">
                Platform Settings
              </h1>

              <p className="mt-1 text-sm opacity-60">
                Configure platform-wide behaviour and
                identity.
              </p>
            </div>
          </div>
        </div>

        {/* SUCCESS */}

        {saved && (
          <div
            className="
              mb-6
              rounded-2xl
              border
              p-4
              text-sm
            "
            style={{
              borderColor:
                "var(--card-border)",
            }}
          >
            <span className="font-semibold">
              ✓ Settings saved
            </span>

            <span className="ml-2 opacity-60">
              Your platform settings have been updated.
            </span>
          </div>
        )}

        <form action={saveSettings}>

          {/* PLATFORM IDENTITY */}

          <section
            className="
              rounded-2xl
              border
              bg-[var(--card)]
              p-6
              shadow-sm
            "
            style={{
              borderColor:
                "var(--card-border)",
            }}
          >
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Platform Identity
              </h2>

              <p className="mt-1 text-sm opacity-60">
                Basic information used to identify Boundless.
              </p>
            </div>

            <div className="space-y-5">

              <div>
                <label
                  htmlFor="platform_name"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                  "
                >
                  Platform Name
                </label>

                <input
                  id="platform_name"
                  name="platform_name"
                  type="text"
                  defaultValue={
                    settings.platform_name
                  }
                  className="
                    w-full
                    rounded-xl
                    border
                    bg-transparent
                    px-4
                    py-3
                    outline-none
                    transition
                    focus:ring-2
                    focus:ring-black/10
                    dark:focus:ring-white/10
                  "
                  style={{
                    borderColor:
                      "var(--card-border)",
                  }}
                />
              </div>

              <div>
                <label
                  htmlFor="platform_description"
                  className="
                    mb-2
                    block
                    text-sm
                    font-medium
                  "
                >
                  Platform Description
                </label>

                <textarea
                  id="platform_description"
                  name="platform_description"
                  rows={4}
                  defaultValue={
                    settings.platform_description
                  }
                  className="
                    w-full
                    resize-none
                    rounded-xl
                    border
                    bg-transparent
                    px-4
                    py-3
                    outline-none
                    transition
                    focus:ring-2
                    focus:ring-black/10
                    dark:focus:ring-white/10
                  "
                  style={{
                    borderColor:
                      "var(--card-border)",
                  }}
                />
              </div>

            </div>
          </section>

          {/* ACCESS */}

          <section
            className="
              mt-6
              rounded-2xl
              border
              bg-[var(--card)]
              p-6
              shadow-sm
            "
            style={{
              borderColor:
                "var(--card-border)",
            }}
          >
            <div className="mb-6">
              <h2 className="text-lg font-semibold">
                Platform Access
              </h2>

              <p className="mt-1 text-sm opacity-60">
                Control who can access major platform
                functionality.
              </p>
            </div>

            <div className="space-y-5">

              <SettingToggle
                name="allow_new_registrations"
                title="Allow New Registrations"
                description="Allow new visitors to create accounts."
                defaultChecked={
                  settings.allow_new_registrations
                }
              />

              <SettingToggle
                name="allow_author_applications"
                title="Allow Author Applications"
                description="Allow readers to request author access."
                defaultChecked={
                  settings.allow_author_applications
                }
              />

            </div>
          </section>

          {/* MAINTENANCE */}

          <section
            className="
              mt-6
              rounded-2xl
              border
              p-6
              shadow-sm
            "
            style={{
              borderColor:
                "var(--card-border)",
              background:
                "linear-gradient(135deg, rgba(245,158,11,.10), rgba(245,158,11,.03))",
            }}
          >
            <div className="mb-6">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-semibold">
                  Maintenance
                </h2>

                <span
                  className="
                    rounded-full
                    border
                    px-2
                    py-0.5
                    text-[10px]
                    font-semibold
                    uppercase
                    tracking-wider
                  "
                  style={{
                    borderColor:
                      "var(--card-border)",
                  }}
                >
                  Powerful
                </span>
              </div>

              <p className="mt-1 text-sm opacity-60">
                Temporarily indicate that the platform is
                undergoing maintenance.
              </p>
            </div>

            <SettingToggle
              name="maintenance_mode"
              title="Maintenance Mode"
              description="Enable this when major platform maintenance is being performed."
              defaultChecked={
                settings.maintenance_mode
              }
            />

            <div
              className="
                mt-5
                rounded-xl
                border
                p-4
                text-sm
              "
              style={{
                borderColor:
                  "var(--card-border)",
              }}
            >
              <strong>
                Important:
              </strong>{" "}
              <span className="opacity-60">
                This setting is stored now, but the public
                maintenance screen will be connected to it
                when the platform-wide maintenance system is
                implemented.
              </span>
            </div>
          </section>

          {/* SAVE */}

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              className="
                rounded-xl
                border
                px-6
                py-3
                text-sm
                font-semibold
                shadow-sm
                transition
                hover:-translate-y-0.5
                hover:shadow-md
                active:translate-y-0
              "
              style={{
                borderColor:
                  "var(--card-border)",
                backgroundColor:
                  "var(--foreground)",
                color:
                  "var(--background)",
              }}
            >
              Save Settings
            </button>
          </div>

        </form>

        {/* LAST UPDATED */}

        <p className="mt-6 text-right text-xs opacity-40">
          Last updated{" "}
          {new Intl.DateTimeFormat("en", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(
            new Date(settings.updated_at)
          )}
        </p>

      </div>
    </main>
  );
}

function SettingToggle({
  name,
  title,
  description,
  defaultChecked,
}: {
  name: string;
  title: string;
  description: string;
  defaultChecked: boolean;
}) {
  return (
    <label
      className="
        flex
        cursor-pointer
        items-start
        justify-between
        gap-6
        rounded-xl
        border
        p-4
        transition
        hover:bg-black/[0.02]
        dark:hover:bg-white/[0.02]
      "
      style={{
        borderColor:
          "var(--card-border)",
      }}
    >
      <div>
        <p className="font-medium">
          {title}
        </p>

        <p className="mt-1 text-sm opacity-55">
          {description}
        </p>
      </div>

      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="
          mt-1
          h-5
          w-5
          shrink-0
          cursor-pointer
        "
      />
    </label>
  );
}