import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import TierSubmissionActions from "@/components/admin/TierSubmissionActions";

export default async function AdminTierSubmissionsPage() {
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

  const { data: submissions } = await supabase
    .from("tier_submissions")
    .select(
      `
      id,
      story_id,
      requested_tier,
      outline,
      synopsis,
      excerpt,
      status,
      created_at,
      stories:story_id ( title, slug ),
      submitter:submitted_by ( username, display_name )
    `
    )
    .order("created_at", { ascending: false });

  const pending =
    submissions?.filter((s: any) => s.status === "pending") ?? [];

  const resolved =
    submissions?.filter((s: any) => s.status !== "pending") ?? [];

  function first<T>(value: T | T[] | null): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold">
        Tier Upgrade Submissions
      </h1>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">
          Pending ({pending.length})
        </h2>

        {pending.length === 0 ? (
          <p className="opacity-60">Nothing to review.</p>
        ) : (
          <div className="space-y-4">
            {pending.map((submission: any) => {
              const story = first(submission.stories);
              const submitter = first(submission.submitter);

              return (
                <div
                  key={submission.id}
                  className="rounded-xl border p-5"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--card-border)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        <Link
                          href={`/story/${story?.slug}`}
                          className="underline"
                        >
                          {story?.title}
                        </Link>{" "}
                        → requesting{" "}
                        {submission.requested_tier}-Tier
                      </p>

                      <p className="text-sm opacity-60 mt-1">
                        by{" "}
                        {submitter?.display_name ??
                          submitter?.username ??
                          "Unknown"}
                      </p>
                    </div>

                    <span className="text-xs opacity-50">
                      {new Date(
                        submission.created_at
                      ).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="mt-4 space-y-3 text-sm">
                    <div>
                      <p className="font-medium opacity-70">
                        Outline
                      </p>
                      <p className="mt-1 whitespace-pre-wrap opacity-90">
                        {submission.outline}
                      </p>
                    </div>

                    <div>
                      <p className="font-medium opacity-70">
                        Synopsis
                      </p>
                      <p className="mt-1 whitespace-pre-wrap opacity-90">
                        {submission.synopsis}
                      </p>
                    </div>

                    {submission.excerpt && (
                      <div>
                        <p className="font-medium opacity-70">
                          Excerpt
                        </p>
                        <p className="mt-1 whitespace-pre-wrap opacity-90 max-h-64 overflow-y-auto">
                          {submission.excerpt}
                        </p>
                      </div>
                    )}
                  </div>

                  <TierSubmissionActions
                    submissionId={submission.id}
                  />
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">
          Resolved
        </h2>

        {resolved.length === 0 ? (
          <p className="opacity-60">No resolved submissions yet.</p>
        ) : (
          <div className="space-y-2">
            {resolved.map((submission: any) => {
              const story = first(submission.stories);

              return (
                <div
                  key={submission.id}
                  className="rounded-lg border p-3 text-sm flex items-center justify-between"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  <span>
                    {story?.title} — {submission.requested_tier}-Tier
                  </span>

                  <span className="opacity-60">
                    {submission.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}