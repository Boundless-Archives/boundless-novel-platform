import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdminUser } from "@/lib/adminGuard";
import { REASON_LABEL } from "@/lib/reports";

type Report = {
  id: string;
  reporter_id: string | null;
  target_type: "comment" | "review" | "user" | "guild_post" | "guild_reply" | "message";
  target_id: string;
  target_owner: string | null;
  context_url: string | null;
  snapshot: string | null;
  reason: string;
  details: string | null;
  status: "open" | "actioned" | "dismissed";
  resolution: string | null;
  resolved_at: string | null;
  created_at: string;
};

const STATUSES = ["open", "actioned", "dismissed"] as const;
const LABELS = { open: "Open", actioned: "Actioned", dismissed: "Dismissed" };

async function resolveReport(formData: FormData) {
  "use server";

  const { user } = await requireAdminUser();

  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  const note = String(formData.get("note") ?? "").slice(0, 300);

  if (!id) return;

  const { error } = await createAdminClient().rpc("resolve_content_report", {
    p_admin: user.id,
    p_report: id,
    p_action: action,
    p_note: note,
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/reports");
}

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  await requireAdminUser();

  const sp = await searchParams;
  const filter = (STATUSES as readonly string[]).includes(sp.status ?? "")
    ? (sp.status as (typeof STATUSES)[number])
    : "open";

  const admin = createAdminClient();

  const [{ data: rows }, { data: all }] = await Promise.all([
    admin
      .from("content_reports")
      .select("*")
      .eq("status", filter)
      .order("created_at", { ascending: false })
      .limit(100),
    admin.from("content_reports").select("status"),
  ]);

  const counts: Record<string, number> = {};
  for (const r of all ?? []) counts[r.status] = (counts[r.status] ?? 0) + 1;

  const reports = (rows ?? []) as Report[];

  const ids = [
    ...new Set(
      reports.flatMap((r) => [r.reporter_id, r.target_owner]).filter(Boolean)
    ),
  ] as string[];

  const { data: people } = ids.length
    ? await admin.from("profiles").select("id, username").in("id", ids)
    : { data: [] };

  const nameOf = new Map((people ?? []).map((p) => [p.id, p.username]));

  // How many people reported the same thing (open reports only).
  const sameTarget = new Map<string, number>();
  for (const r of reports) {
    const k = `${r.target_type}:${r.target_id}`;
    sameTarget.set(k, (sameTarget.get(k) ?? 0) + 1);
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <Link
          href="/admin"
          className="text-sm text-foreground/60 hover:text-foreground"
        >
          ← Admin Control Center
        </Link>

        <h1 className="mt-3 text-3xl font-bold tracking-tight text-foreground">
          Content Reports
        </h1>

        <p className="mt-2 text-sm text-foreground/60">
          Reports on comments, reviews, profiles, group posts and private messages (a reported message is the only way the team ever sees one). Removing content
          deletes it (and any replies to a comment), tells its author, and
          closes every report on it.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin/reports?status=${s}`}
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                s === filter
                  ? "border-foreground bg-foreground text-background"
                  : "border-card-border bg-card text-foreground hover:opacity-80"
              }`}
            >
              {LABELS[s]} ({counts[s] ?? 0})
            </Link>
          ))}
        </div>

        {reports.length === 0 && (
          <p className="mt-8 text-sm text-foreground/60">
            No {LABELS[filter].toLowerCase()} reports.
          </p>
        )}

        <div className="mt-6 space-y-4">
          {reports.map((r) => {
            const same = sameTarget.get(`${r.target_type}:${r.target_id}`) ?? 1;
            const owner = r.target_owner ? nameOf.get(r.target_owner) : null;
            const reporter = r.reporter_id ? nameOf.get(r.reporter_id) : null;

            return (
              <article
                key={r.id}
                className="rounded-2xl border border-card-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <h2 className="font-semibold text-foreground">
                    {REASON_LABEL[r.reason] ?? r.reason}
                    <span className="ml-2 text-xs font-normal uppercase text-foreground/50">
                      {r.target_type.replace("_", " ")}
                    </span>
                    {same > 1 && filter === "open" && (
                      <span className="ml-2 rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-semibold text-red-500">
                        {same} reports
                      </span>
                    )}
                  </h2>

                  <time className="text-xs text-foreground/50">
                    {new Date(r.created_at).toLocaleString()}
                  </time>
                </div>

                <p className="mt-1 text-xs text-foreground/60">
                  Reported by {reporter ? `@${reporter}` : "a deleted user"}
                  {" · "}
                  Posted by {owner ? `@${owner}` : "a deleted user"}
                </p>

                {r.snapshot && (
                  <blockquote className="mt-3 whitespace-pre-wrap rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground/85">
                    {r.snapshot}
                  </blockquote>
                )}

                {r.details && (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-foreground/70">
                    <span className="font-medium">Reporter says:</span>{" "}
                    {r.details}
                  </p>
                )}

                {r.context_url && (
                  <p className="mt-3 text-xs">
                    <Link
                      href={r.context_url}
                      className="underline underline-offset-4"
                      target="_blank"
                    >
                      View in context ↗
                    </Link>
                  </p>
                )}

                {r.status === "open" ? (
                  <form
                    action={resolveReport}
                    className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"
                  >
                    <input type="hidden" name="id" value={r.id} />

                    <input
                      name="note"
                      maxLength={300}
                      placeholder="Note (shown to the author if removed)"
                      className="flex-1 rounded-xl border border-card-border bg-transparent px-3 py-2 text-sm outline-none"
                    />

                    {r.target_type !== "user" ? (
                      <button
                        name="action"
                        value="remove"
                        className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        Remove
                      </button>
                    ) : (
                      <button
                        name="action"
                        value="handled"
                        className="rounded-xl border border-card-border px-4 py-2 text-sm font-semibold text-foreground transition hover:opacity-80"
                      >
                        Mark handled
                      </button>
                    )}

                    <button
                      name="action"
                      value="dismiss"
                      className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
                    >
                      Dismiss
                    </button>
                  </form>
                ) : (
                  <p className="mt-4 text-xs text-foreground/60">
                    {r.resolution}
                    {r.resolved_at &&
                      ` · ${new Date(r.resolved_at).toLocaleString()}`}
                  </p>
                )}
              </article>
            );
          })}
        </div>
      </div>
    </main>
  );
}
