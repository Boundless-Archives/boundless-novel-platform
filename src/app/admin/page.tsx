import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, role")
    .eq("id", user.id)
    .single();

  if (
    !profile ||
    !["admin", "superadmin"].includes(profile.role)
  ) {
    redirect("/");
  }

  const isSuperadmin = profile.role === "superadmin";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-card-border bg-card text-2xl shadow-sm">
              🛡️
            </div>

            <div>
              <p className="text-sm font-medium text-foreground/60">
                Boundless Administration
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Admin Control Center
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-foreground/65">
            Manage the Boundless platform, oversee content and users,
            and maintain the health of the community.
          </p>
        </div>

        {/* Role banner */}
        <section className="mb-8 rounded-2xl border border-card-border bg-card p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-foreground/50">
                Signed in as
              </p>

              <p className="mt-1 text-lg font-semibold text-foreground">
                {profile.display_name || profile.username}
              </p>
            </div>

            <div className="inline-flex w-fit items-center rounded-full border border-card-border bg-background px-3 py-1.5 text-sm font-medium text-foreground">
              {isSuperadmin ? "👑 Superadmin" : "🛡️ Admin"}
            </div>
          </div>
        </section>

        {/* Management grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <AdminCard
            icon="👥"
            title="User Management"
            description="View users, inspect account roles, and manage platform access."
            href="/admin/users"
          />

          <AdminCard
            icon="📝"
            title="Editor Assignments"
            description="Manage editor and author relationships across the platform."
            href="/admin/editors"
          />

          <AdminCard
            icon="📚"
            title="Content Management"
            description="Review stories, chapters, reports, and platform content."
            href="/admin/content"
          />

          <AdminCard
            icon="🏆"
            title="Tier Submissions"
            description="Review B→A and A→S canon tier upgrade requests from authors."
            href="/admin/tier-submissions"
          />

          <AdminCard
            icon="📢"
            title="Announcements"
            description="Create and manage announcements for the Boundless community."
            href="/admin/announcements"
          />

          <AdminCard
            icon="📊"
            title="Platform Analytics"
            description="Monitor activity, growth, readership, and platform health."
            href="/admin/analytics"
          />

          <AdminCard
            icon="⚙️"
            title="Platform Settings"
            description="Manage platform-wide configuration and administrative controls."
            href="/admin/settings"
          />
        </div>

        {/* Superadmin notice */}
        {isSuperadmin && (
          <section className="mt-8 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="text-2xl">👑</div>

              <div>
                <h2 className="font-semibold text-foreground">
                  Superadmin privileges
                </h2>

                <p className="mt-1 text-sm leading-6 text-foreground/65">
                  You have the highest administrative authority on
                  Boundless. Role-management controls will be available
                  here, including the ability to promote or demote
                  users and manage administrative personnel.
                </p>
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function AdminCard({
  icon,
  title,
  description,
  href,
}: {
  icon: string;
  title: string;
  description: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="
        group
        rounded-2xl
        border
        border-card-border
        bg-card
        p-6
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:shadow-md
      "
    >
      <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-card-border bg-background text-xl">
        {icon}
      </div>

      <h2 className="font-semibold text-foreground transition group-hover:opacity-80">
        {title}
      </h2>

      <p className="mt-2 text-sm leading-6 text-foreground/60">
        {description}
      </p>

      <div className="mt-5 text-sm font-medium text-foreground/70 transition group-hover:text-foreground">
        Open →
      </div>
    </a>
  );
}