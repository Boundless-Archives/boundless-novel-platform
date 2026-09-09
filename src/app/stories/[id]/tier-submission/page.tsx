import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { submitTierUpgrade } from "@/app/tier-submissions/actions";
import { getCanonTierInfo } from "@/lib/canonTier";

type Props = {
  params: Promise<{ id: string }>;
};

function nextTierLabel(currentTier: string) {
  if (currentTier === "B") return "A-Tier";
  if (currentTier === "A") return "S-Tier";
  return null;
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500",
    approved: "bg-green-600",
    rejected: "bg-red-500",
    cancelled: "bg-slate-400",
  };

  return (
    <span
      className={`
        rounded-full
        px-2
        py-0.5
        text-xs
        font-semibold
        text-white
        ${colors[status] ?? "bg-slate-400"}
      `}
    >
      {status}
    </span>
  );
}

export default async function TierSubmissionPage({
  params,
}: Props) {
  const { id: storyId } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: story } = await supabase
    .from("stories")
    .select("id, title, canon_tier, author_id")
    .eq("id", storyId)
    .maybeSingle();

  if (!story || story.author_id !== user.id) {
    notFound();
  }

  const { data: submissions } = await supabase
    .from("tier_submissions")
    .select("*")
    .eq("story_id", storyId)
    .order("created_at", { ascending: false });

  const pending = submissions?.find(
    (submission) => submission.status === "pending"
  );

  const target = nextTierLabel(story.canon_tier);
  const currentTierInfo = getCanonTierInfo(story.canon_tier);

  async function handleSubmit(formData: FormData) {
    "use server";

    const outline = String(formData.get("outline") ?? "");
    const synopsis = String(formData.get("synopsis") ?? "");
    const excerpt = String(formData.get("excerpt") ?? "");

    await submitTierUpgrade(storyId, outline, synopsis, excerpt);

    redirect(`/stories/${storyId}/tier-submission?saved=1`);
  }

  return (
    <main className="max-w-3xl mx-auto p-8">
      <div
        className="rounded-xl border p-6"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <h1 className="text-4xl font-bold">
          Tier Upgrade — {story.title}
        </h1>

        <p className="mt-3 opacity-80">
          Current tier:{" "}
          <span
            className={`
              rounded-full
              px-3
              py-1
              text-sm
              font-semibold
              ${currentTierInfo.bgClass}
              ${currentTierInfo.textClass}
            `}
          >
            {currentTierInfo.shortLabel}
          </span>
        </p>
      </div>

      {!target ? (
        <div
          className="mt-8 rounded-xl border p-6 text-center"
          style={{ borderColor: "var(--card-border)" }}
        >
          <p className="opacity-80">
            This story is already at the top tier — S-Tier
            Telos Canon.
          </p>
        </div>
      ) : pending ? (
        <div
          className="mt-8 rounded-xl border p-6"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <p className="font-semibold">
            Submission pending review
          </p>

          <p className="mt-2 opacity-70">
            You've submitted this story for {target}. An
            editorial review is in progress — check back
            for a decision.
          </p>
        </div>
      ) : (
        <form
          action={handleSubmit}
          className="mt-8 flex flex-col gap-6"
        >
          <div
            className="rounded-xl border p-6"
            style={{
              backgroundColor: "var(--card)",
              borderColor: "var(--card-border)",
            }}
          >
            <h2 className="text-xl font-semibold mb-4">
              Submit for {target}
            </h2>

            <div>
              <label className="block mb-2 font-medium">
                Story Outline
              </label>

              <textarea
                name="outline"
                required
                rows={6}
                placeholder="Where the story is headed — arcs, key beats, endgame."
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div className="mt-5">
              <label className="block mb-2 font-medium">
                Synopsis / Blurb
              </label>

              <textarea
                name="synopsis"
                required
                rows={4}
                placeholder="The reader-facing pitch for this story."
                className="w-full border rounded-lg p-3"
              />
            </div>

            <div className="mt-5">
              <label className="block mb-2 font-medium">
                Excerpt (optional — first ~10k words, or a
                link to published chapters)
              </label>

              <textarea
                name="excerpt"
                rows={6}
                placeholder="Paste an excerpt, or leave blank if your chapters are already published on the site."
                className="w-full border rounded-lg p-3"
              />
            </div>
          </div>

          <button
            type="submit"
            className="
              px-5
              py-3
              rounded-lg
              font-semibold
              self-start
            "
            style={{
              backgroundColor: "var(--button)",
              color: "var(--button-text)",
            }}
          >
            Submit for Review
          </button>
        </form>
      )}

      {submissions && submissions.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold mb-4">
            Submission History
          </h2>

          <div className="space-y-3">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="rounded-xl border p-4"
                style={{
                  backgroundColor: "var(--card)",
                  borderColor: "var(--card-border)",
                }}
              >
                <div className="flex items-center justify-between">
                  <p className="font-semibold">
                    Requested {submission.requested_tier}-Tier
                  </p>

                  {statusBadge(submission.status)}
                </div>

                {submission.reviewer_notes && (
                  <p className="mt-2 text-sm opacity-80">
                    Reviewer notes: {submission.reviewer_notes}
                  </p>
                )}

                <p className="mt-2 text-xs opacity-50">
                  {new Date(
                    submission.created_at
                  ).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}