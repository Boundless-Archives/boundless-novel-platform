import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type BugReport = {
  id: string;
  title: string;
  description: string;
  page_url: string | null;
  user_agent: string | null;
  status: "open" | "in_progress" | "resolved" | "dismissed";
  admin_note: string | null;
  created_at: string;
  profiles: { username: string | null } | { username: string | null }[] | null;
};

const STATUSES = ["open", "in_progress", "resolved", "dismissed"] as const;

const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  open: "Open",
  in_progress: "In progress",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminBugReportsPage({ searchParams }: Props) {
  const { status: statusParam } = await searchParams;

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

  const filter = (STATUSES as readonly string[]).includes(statusParam ?? "")
    ? (statusParam as (typeof STATUSES)[number])
    : "open";

  async function updateReport(formData: FormData) {
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

    if (!profile || !["admin", "superadmin"].includes(profile.role)) {
      redirect("/");
    }

    const id = String(formData.get("id") ?? "");
    const status = String(formData.get("status") ?? "");
    const note = String(formData.get("admin_note") ?? "").trim();

    if (!id || !(STATUSES as readonly string[]).includes(status)) {
      return;
    }

    await supabase
      .from("bug_reports")
      .update({
        status,
        admin_note: note || null,
      })
      .eq("id", id);

    revalidatePath("/admin/bug-reports");
  }

  const { data: reports, error } = await supabase
    .from("bug_reports")
    .select(
      "id, title, description, page_url, user_agent, status, admin_note, created_at, profiles:user_id ( username )"
    )
    .eq("status", filter)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: allStatuses } = await supabase
    .from("bug_reports")
    .select("status");

  const counts: Record<string, number> = {};
  for (const row of allStatuses ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  const items = (reports ?? []) as unknown as BugReport[];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <a
          href="/admin"
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Admin Control Center
        </a>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Bug Reports
        </h1>

        <div className="mt-6 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <a
              key={s}
              href={`/admin/bug-reports?status=${s}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                s === filter
                  ? "border-foreground bg-foreground text-background"
                  : "border-card-border bg-card text-foreground hover:opacity-80"
              }`}
            >
              {STATUS_LABELS[s]} ({counts[s] ?? 0})
            </a>
          ))}
        </div>

        {error && (
          <p className="mt-6 text-sm text-red-500">{error.message}</p>
        )}

        {!error && items.length === 0 && (
          <p className="mt-8 text-sm text-foreground/60">
            No {STATUS_LABELS[filter].toLowerCase()} reports.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {items.map((report) => {
            const reporter = Array.isArray(report.profiles)
              ? report.profiles[0]
              : report.profiles;

            return (
              <article
                key={report.id}
                className="rounded-2xl border border-card-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-semibold text-foreground">
                    {report.title}
                  </h2>

                  <time className="text-xs text-foreground/50">
                    {new Date(report.created_at).toLocaleString()}
                  </time>
                </div>

                <p className="mt-1 text-xs text-foreground/60">
                  From{" "}
                  {reporter?.username ? `@${reporter.username}` : "a deleted user"}
                </p>

                <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/80">
                  {report.description}
                </p>

                {report.page_url && (
                  <p className="mt-3 break-all text-xs text-foreground/50">
                    Page: {report.page_url}
                  </p>
                )}

                {report.user_agent && (
                  <p className="mt-1 break-all text-xs text-foreground/40">
                    {report.user_agent}
                  </p>
                )}

                <form
                  action={updateReport}
                  className="mt-4 flex flex-col gap-2 sm:flex-row"
                >
                  <input type="hidden" name="id" value={report.id} />

                  <input
                    name="admin_note"
                    defaultValue={report.admin_note ?? ""}
                    placeholder="Internal note (optional)"
                    maxLength={2000}
                    className="flex-1 rounded-xl border border-card-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-2"
                  />

                  <select
                    name="status"
                    defaultValue={report.status}
                    className="rounded-xl border border-card-border bg-card px-3 py-2 text-sm text-foreground"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {STATUS_LABELS[s]}
                      </option>
                    ))}
                  </select>

                  <button
                    type="submit"
                    className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
                  >
                    Save
                  </button>
                </form>
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}