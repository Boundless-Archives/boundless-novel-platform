import Link from "next/link";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireAdminUser } from "@/lib/adminGuard";

type AppError = {
  id: string;
  source: "server" | "client";
  message: string;
  stack: string | null;
  path: string | null;
  digest: string | null;
  occurrences: number;
  first_seen: string;
  last_seen: string;
  resolved: boolean;
};

async function updateError(formData: FormData) {
  "use server";

  await requireAdminUser();

  const id = String(formData.get("id") ?? "");
  const action = String(formData.get("action") ?? "");
  if (!id) return;

  const admin = createAdminClient();

  if (action === "delete") {
    await admin.from("app_errors").delete().eq("id", id);
  } else {
    await admin
      .from("app_errors")
      .update({ resolved: action === "resolve" })
      .eq("id", id);
  }

  revalidatePath("/admin/errors");
}

async function resolveAll() {
  "use server";

  await requireAdminUser();

  await createAdminClient()
    .from("app_errors")
    .update({ resolved: true })
    .eq("resolved", false);

  revalidatePath("/admin/errors");
}

function ago(iso: string) {
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60000));
  if (mins < 60) return `${mins}m ago`;
  if (mins < 1440) return `${Math.round(mins / 60)}h ago`;
  return `${Math.round(mins / 1440)}d ago`;
}

export default async function AdminErrorsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireAdminUser();

  const sp = await searchParams;
  const showResolved = sp.view === "resolved";

  const admin = createAdminClient();

  const [{ data: rows }, { count: openCount }, { count: doneCount }] =
    await Promise.all([
      admin
        .from("app_errors")
        .select("*")
        .eq("resolved", showResolved)
        .order("last_seen", { ascending: false })
        .limit(100),
      admin
        .from("app_errors")
        .select("id", { count: "exact", head: true })
        .eq("resolved", false),
      admin
        .from("app_errors")
        .select("id", { count: "exact", head: true })
        .eq("resolved", true),
    ]);

  const errors = (rows ?? []) as AppError[];

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
          Errors
        </h1>

        <p className="mt-2 text-sm text-foreground/60">
          Crashes from pages, server actions and browsers. The same error is
          grouped into one row with a counter. Resolved errors reopen
          themselves if they happen again, and old ones are cleared
          automatically.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <Link
            href="/admin/errors"
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              !showResolved
                ? "border-foreground bg-foreground text-background"
                : "border-card-border bg-card text-foreground hover:opacity-80"
            }`}
          >
            Open ({openCount ?? 0})
          </Link>

          <Link
            href="/admin/errors?view=resolved"
            className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
              showResolved
                ? "border-foreground bg-foreground text-background"
                : "border-card-border bg-card text-foreground hover:opacity-80"
            }`}
          >
            Resolved ({doneCount ?? 0})
          </Link>

          {!showResolved && (openCount ?? 0) > 0 && (
            <form action={resolveAll} className="ml-auto">
              <button className="rounded-full border border-card-border px-3 py-1.5 text-sm font-medium hover:opacity-80">
                Resolve all
              </button>
            </form>
          )}
        </div>

        {errors.length === 0 && (
          <p className="mt-8 text-sm text-foreground/60">
            {showResolved ? "Nothing resolved yet." : "No open errors. 🎉"}
          </p>
        )}

        <div className="mt-6 space-y-4">
          {errors.map((e) => (
            <article
              key={e.id}
              className="rounded-2xl border border-card-border bg-card p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h2 className="break-words font-semibold text-foreground">
                  {e.message}
                </h2>

                <span className="shrink-0 rounded-full bg-foreground/10 px-2.5 py-0.5 text-xs font-semibold">
                  ×{e.occurrences}
                </span>
              </div>

              <p className="mt-2 break-all text-xs text-foreground/60">
                {e.source === "server" ? "Server" : "Browser"}
                {e.path && ` · ${e.path}`}
                {" · "}last seen {ago(e.last_seen)}
                {" · "}first seen {new Date(e.first_seen).toLocaleDateString()}
                {e.digest && ` · digest ${e.digest}`}
              </p>

              {e.stack && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-xs text-foreground/60">
                    Stack trace
                  </summary>
                  <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-xl border border-card-border bg-background p-3 text-xs">
                    {e.stack}
                  </pre>
                </details>
              )}

              <form action={updateError} className="mt-4 flex gap-2">
                <input type="hidden" name="id" value={e.id} />

                <button
                  name="action"
                  value={e.resolved ? "reopen" : "resolve"}
                  className="rounded-xl bg-foreground px-4 py-2 text-sm font-semibold text-background transition hover:opacity-90"
                >
                  {e.resolved ? "Reopen" : "Resolve"}
                </button>

                <button
                  name="action"
                  value="delete"
                  className="rounded-xl border border-card-border px-4 py-2 text-sm font-semibold transition hover:opacity-80"
                >
                  Delete
                </button>
              </form>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}
