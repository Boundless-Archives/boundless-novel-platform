import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type One<T> = T | T[] | null;

type Report = {
  id: string;
  details: string;
  original_url: string | null;
  status: "open" | "in_review" | "resolved" | "dismissed";
  admin_note: string | null;
  created_at: string;
  story_id: string;
  chapter_id: string | null;
  stories: One<{ title: string; slug: string }>;
  chapters: One<{ title: string; chapter_number: number }>;
  profiles: One<{ username: string | null }>;
};

const STATUSES = ["open", "in_review", "resolved", "dismissed"] as const;

const STATUS_LABELS: Record<(typeof STATUSES)[number], string> = {
  open: "Open",
  in_review: "In review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

function first<T>(value: One<T>): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

type Props = {
  searchParams: Promise<{ status?: string }>;
};

export default async function AdminPlagiarismReportsPage({
  searchParams,
}: Props) {
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
      .from("plagiarism_reports")
      .update({ status, admin_note: note || null })
      .eq("id", id);

    revalidatePath("/admin/plagiarism-reports");
  }

  const { data: reports, error } = await supabase
    .from("plagiarism_reports")
    .select(
      "id, details, original_url, status, admin_note, created_at, story_id, chapter_id, stories ( title, slug ), chapters ( title, chapter_number ), profiles:reporter_id ( username )"
    )
    .eq("status", filter)
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: allStatuses } = await supabase
    .from("plagiarism_reports")
    .select("status");

  const counts: Record<string, number> = {};

  for (const row of allStatuses ?? []) {
    counts[row.status] = (counts[row.status] ?? 0) + 1;
  }

  const items = (reports ?? []) as unknown as Report[];

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
          Plagiarism Reports
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-foreground/65">
          Reports from readers about stories that may copy someone else&apos;s
          work. Authors can show their publish dates from their Proof of
          authorship page, and admins can see those records too.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <a
              key={s}
              href={`/admin/plagiarism-reports?status=${s}`}
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

        {error && <p className="mt-6 text-sm text-red-500">{error.message}</p>}

        {items.length === 0 && !error && (
          <p className="mt-8 text-foreground/60">
            No {STATUS_LABELS[filter].toLowerCase()} reports.
          </p>
        )}

        <div className="mt-8 space-y-5">
          {items.map((report) => {
            const story = first(report.stories);
            const chapter = first(report.chapters);
            const reporter = first(report.profiles);

            return (
              <section
                key={report.id}
                className="rounded-2xl border border-card-border bg-card p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-xs text-foreground/50">
                      Reported {new Date(report.created_at).toLocaleString()} by{" "}
                      {reporter?.username ? `@${reporter.username}` : "a reader"}
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-foreground">
                      {story ? (
                        <a
                          href={`/story/${story.slug}`}
                          className="hover:underline"
                        >
                          {story.title}
                        </a>
                      ) : (
                        "Story removed"
                      )}
                    </h2>

                    {chapter && report.chapter_id && (
                      <a
                        href={`/chapter/${report.chapter_id}`}
                        className="text-sm text-foreground/70 hover:underline"
                      >
                        Chapter {chapter.chapter_number}: {chapter.title}
                      </a>
                    )}
                  </div>

                  <span className="rounded-full border border-card-border px-3 py-1 text-xs">
                    {STATUS_LABELS[report.status]}
                  </span>
                </div>

                <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-foreground/85">
                  {report.details}
                </p>

                {report.original_url && (
                  <p className="mt-3 break-all text-sm">
                    Original:{" "}
                    <a
                      href={report.original_url}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="underline"
                    >
                      {report.original_url}
                    </a>
                  </p>
                )}

                <form action={updateReport} className="mt-5 space-y-3">
                  <input type="hidden" name="id" value={report.id} />

                  <textarea
                    name="admin_note"
                    defaultValue={report.admin_note ?? ""}
                    rows={2}
                    placeholder="Internal note (only admins see this)"
                    className="w-full rounded-lg border border-card-border bg-background p-3 text-sm"
                  />

                  <div className="flex flex-wrap items-center gap-3">
                    <select
                      name="status"
                      defaultValue={report.status}
                      className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {STATUS_LABELS[s]}
                        </option>
                      ))}
                    </select>

                    <button
                      type="submit"
                      className="rounded-lg px-4 py-2 text-sm font-medium"
                      style={{
                        backgroundColor: "var(--button)",
                        color: "var(--button-text)",
                      }}
                    >
                      Save
                    </button>
                  </div>
                </form>
              </section>
            );
          })}
        </div>
      </div>
    </main>
  );
}