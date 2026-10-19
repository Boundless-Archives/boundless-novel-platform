import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { createHash } from "node:crypto";
import { createClient } from "@/utils/supabase/server";

type Props = {
  params: Promise<{ id: string }>;
};

function fingerprint(content: string) {
  return createHash("sha256").update(content ?? "", "utf8").digest("hex");
}

function formatUtc(value: string) {
  return new Date(value).toLocaleString("en-GB", {
    timeZone: "UTC",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default async function ProofOfAuthorshipPage({ params }: Props) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: story } = await supabase
    .from("stories")
    .select("id, title, slug, author_id")
    .eq("id", id)
    .maybeSingle();

  if (!story || story.author_id !== user.id) {
    notFound();
  }

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, chapter_number, title, content, status, published_at")
    .eq("story_id", story.id)
    .order("chapter_number", { ascending: true });

  const { data: proofs } = await supabase
    .from("chapter_proofs")
    .select("id, chapter_id, content_sha256, recorded_at, kind")
    .eq("story_id", story.id)
    .order("recorded_at", { ascending: false });

  const proofsByChapter = new Map<string, NonNullable<typeof proofs>>();

  for (const proof of proofs ?? []) {
    const list = proofsByChapter.get(proof.chapter_id) ?? [];
    list.push(proof);
    proofsByChapter.set(proof.chapter_id, list);
  }

  const published = (chapters ?? []).filter((c) => c.status === "Published");

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <Link
        href={`/stories/${story.id}`}
        className="text-sm opacity-60 hover:opacity-100"
      >
        ← Back to {story.title}
      </Link>

      <h1 className="mt-3 text-3xl font-bold">🛡️ Proof of authorship</h1>

      <p className="mt-3 max-w-2xl leading-7 opacity-80">
        Every time you publish a chapter, or edit a published one, Boundless
        saves the exact time and a unique fingerprint (SHA-256) of the text.
        If someone copies your work, this record shows when it was published
        here. It&apos;s a supporting record kept by Boundless, not a legal
        certificate on its own, and it works best alongside other evidence
        such as your drafts.
      </p>

      <a
        href={`/stories/${story.id}/proof/certificate`}
        download
        className="mt-5 inline-block rounded-lg border px-4 py-2 text-sm font-medium"
        style={{ borderColor: "var(--card-border)" }}
      >
        ⬇ Download record (.txt)
      </a>

      <div className="mt-8 space-y-4">
        {published.length === 0 && (
          <p className="opacity-70">
            No published chapters yet. Records start when you publish one.
          </p>
        )}

        {published.map((chapter) => {
          const list = proofsByChapter.get(chapter.id) ?? [];
          const latest = list[0];

          const status = !latest
            ? "none"
            : fingerprint(chapter.content) === latest.content_sha256
              ? "match"
              : "edited";

          return (
            <section
              key={chapter.id}
              className="rounded-xl border p-5"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--card-border)",
              }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide opacity-60">
                    Chapter {chapter.chapter_number}
                  </p>

                  <h2 className="mt-1 text-lg font-semibold">
                    {chapter.title}
                  </h2>
                </div>

                <span className="rounded-full border px-3 py-1 text-xs"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  {status === "match" && "✓ Matches current text"}
                  {status === "edited" && "Edited since last record"}
                  {status === "none" && "No record yet"}
                </span>
              </div>

              {latest ? (
                <div className="mt-4 text-sm">
                  <p>
                    Latest record: <strong>{formatUtc(latest.recorded_at)} UTC</strong>
                    {latest.kind === "backfill" && (
                      <span className="opacity-70">
                        {" "}
                        (recorded afterwards for a chapter first published
                        {chapter.published_at
                          ? ` on ${formatUtc(chapter.published_at)} UTC`
                          : " earlier"}
                        )
                      </span>
                    )}
                  </p>

                  <p className="mt-2 break-all font-mono text-xs opacity-80">
                    {latest.content_sha256}
                  </p>

                  {list.length > 1 && (
                    <details className="mt-3 text-xs opacity-80">
                      <summary className="cursor-pointer">
                        {list.length - 1} earlier{" "}
                        {list.length - 1 === 1 ? "record" : "records"}
                      </summary>

                      <ul className="mt-2 space-y-2">
                        {list.slice(1).map((proof) => (
                          <li key={proof.id}>
                            {formatUtc(proof.recorded_at)} UTC
                            <span className="block break-all font-mono">
                              {proof.content_sha256}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </details>
                  )}
                </div>
              ) : (
                <p className="mt-4 text-sm opacity-70">
                  This chapter was published before records started. Make a
                  small edit and save it, or ask an admin to add it, and a
                  record will be created.
                </p>
              )}
            </section>
          );
        })}
      </div>
    </main>
  );
}