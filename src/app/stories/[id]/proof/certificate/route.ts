import { createClient } from "@/utils/supabase/server";

type Context = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, { params }: Context) {
  const { id } = await params;

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response("Please log in.", { status: 401 });
  }

  const { data: story } = await supabase
    .from("stories")
    .select("id, title, slug, author_id")
    .eq("id", id)
    .maybeSingle();

  if (!story || story.author_id !== user.id) {
    return new Response("Not found.", { status: 404 });
  }

  const { data: author } = await supabase
    .from("profiles")
    .select("username, display_name")
    .eq("id", user.id)
    .maybeSingle();

  const { data: chapters } = await supabase
    .from("chapters")
    .select("id, chapter_number, title")
    .eq("story_id", story.id)
    .order("chapter_number", { ascending: true });

  const { data: proofs } = await supabase
    .from("chapter_proofs")
    .select("chapter_id, content_sha256, recorded_at, kind")
    .eq("story_id", story.id)
    .order("recorded_at", { ascending: true });

  const origin = new URL(request.url).origin;

  const lines: string[] = [
    "BOUNDLESS - RECORD OF PUBLICATION",
    "=================================",
    "",
    `Story:     ${story.title}`,
    `Link:      ${origin}/story/${story.slug}`,
    `Author:    ${author?.display_name ?? author?.username ?? "Unknown"}${
      author?.username ? ` (@${author.username})` : ""
    }`,
    `Generated: ${new Date().toISOString()}`,
    "",
    "Each entry below records the moment a chapter was published on Boundless,",
    "or edited while published, with a SHA-256 fingerprint of the exact chapter",
    "text stored at that time. Times are UTC. Any change to the text, even a",
    "single character, produces a different fingerprint.",
    "",
    'Entries marked "recorded afterwards" were created for chapters that were',
    "already published before this system existed; their time is when the",
    "fingerprint was recorded, not when the chapter first went live.",
    "",
    "This is a record kept by Boundless. It supports a claim of authorship but",
    "is not a legal certificate on its own.",
    "",
    "-----------------------------------------------------------------------",
    "",
  ];

  for (const chapter of chapters ?? []) {
    const entries = (proofs ?? []).filter((p) => p.chapter_id === chapter.id);

    if (entries.length === 0) continue;

    lines.push(`Chapter ${chapter.chapter_number}: ${chapter.title}`);

    for (const entry of entries) {
      lines.push(
        `  ${new Date(entry.recorded_at).toISOString()}  ${entry.content_sha256}${
          entry.kind === "backfill" ? "  (recorded afterwards)" : ""
        }`
      );
    }

    lines.push("");
  }

  if ((proofs ?? []).length === 0) {
    lines.push("No records yet.");
  }

  return new Response(lines.join("\n"), {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": `attachment; filename="proof-of-authorship-${story.slug}.txt"`,
      "Cache-Control": "no-store",
    },
  });
}