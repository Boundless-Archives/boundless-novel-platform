import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import {
  getOrCreateMyUniverse,
  updateMyUniverse,
} from "@/app/wiki/actions";
import {
  getEntityTypeIcon,
  getEntityTypeLabel,
} from "@/lib/entityTypes";
import { htmlToText, suggestNames } from "@/lib/entitySuggestions";
import { createAdminClient } from "@/utils/supabase/admin";
import {
  inviteCoAuthorAction,
  removeCoAuthorAction,
  resolveSuggestionAction,
} from "@/app/wiki/communityActions";

const CO_MESSAGES: Record<string, string> = {
  ok: "✓ Co-author added.",
  removed: "✓ Co-author removed.",
  missing: "No writer with that username.",
  self: "That's you.",
  already: "They're already a co-author.",
  full: "You can have up to 10 co-authors.",
  forbidden: "Only the universe owner can do that.",
  failed: "Something went wrong. Please try again.",
};

const SG_MESSAGES: Record<string, string> = {
  ok: "✓ Done. The suggester has been notified.",
  done: "That suggestion was already handled.",
  story: "Pick one of your own stories as the origin story.",
  missing: "That suggestion or entry no longer exists.",
  forbidden: "Only the universe owner can do that.",
  failed: "Something went wrong. Please try again.",
};

export default async function MyUniversePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string; co?: string; sg?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const universe = await getOrCreateMyUniverse();

  const { data: entities } = await supabase
    .from("entities")
    .select("id, name, slug, entity_type, updated_at")
    .eq("universe_id", universe.id)
    .order("updated_at", { ascending: false });

  const grouped = (entities ?? []).reduce(
    (acc: Record<string, typeof entities>, entity: any) => {
      const key = entity.entity_type;
      if (!acc[key]) acc[key] = [];
      acc[key].push(entity);
      return acc;
    },
    {}
  );

  const params = await searchParams;

  // names that keep appearing in the author's chapters but have no entry yet
  const { data: myStories } = await supabase
    .from("stories")
    .select("id, title")
    .eq("author_id", user.id);

  const storyTitles = new Map((myStories ?? []).map((s) => [s.id, s.title]));

  const { data: recentChapters } =
    storyTitles.size > 0
      ? await supabase
          .from("chapters")
          .select("story_id, content")
          .in("story_id", [...storyTitles.keys()])
          .eq("status", "Published")
          .order("published_at", { ascending: false })
          .limit(40)
      : { data: [] };

  const suggestions = suggestNames(
    (recentChapters ?? []).map((c) => ({
      storyId: c.story_id,
      text: htmlToText(c.content ?? ""),
    })),
    (entities ?? []).map((e: { name: string }) => e.name)
  );

  const entityIds = (entities ?? []).map((e: { id: string }) => e.id);

  const { count: relationshipCount } =
    entityIds.length > 0
      ? await supabase
          .from("entity_relationships")
          .select("id", { count: "exact", head: true })
          .in("from_entity_id", entityIds)
      : { count: 0 };

  const entityTotal = entities?.length ?? 0;

  // co-authors, shared universes and fan suggestions
  const admin = createAdminClient();

  const { data: memberRows } = await supabase
    .from("universe_members")
    .select("user_id")
    .eq("universe_id", universe.id);

  const { data: joinedRows } = await supabase
    .from("universe_members")
    .select("universe_id")
    .eq("user_id", user.id);

  const joinedIds = (joinedRows ?? []).map((r) => r.universe_id);

  const { data: joinedUniverses } =
    joinedIds.length > 0
      ? await supabase.from("universes").select("id, name, slug").in("id", joinedIds)
      : { data: [] };

  const { data: pendingRows } = await admin
    .from("entity_suggestions")
    .select("id, kind, entity_id, name, entity_type, summary, content, note, suggested_by, created_at")
    .eq("universe_id", universe.id)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(30);

  const peopleIds = [
    ...new Set([
      ...(memberRows ?? []).map((m) => m.user_id),
      ...(pendingRows ?? []).map((r) => r.suggested_by),
    ]),
  ];

  const { data: peopleRows } =
    peopleIds.length > 0
      ? await supabase.from("profiles").select("id, username, display_name").in("id", peopleIds)
      : { data: [] };

  const people = new Map((peopleRows ?? []).map((p) => [p.id, p]));
  const entityNames = new Map((entities ?? []).map((e: { id: string; name: string }) => [e.id, e.name]));

  const checklist = [
    { label: "Name your universe and write its pitch", done: Boolean(universe.description?.trim()) },
    { label: "Add your first character", done: (entities ?? []).some((e: { entity_type: string }) => e.entity_type === "character") },
    { label: "Add your first location", done: (entities ?? []).some((e: { entity_type: string }) => e.entity_type === "location") },
    { label: "Add 5 entries in total", done: entityTotal >= 5 },
    { label: "Connect two entries with a relationship", done: (relationshipCount ?? 0) > 0 },
    { label: "Add a banner image", done: Boolean(universe.banner_url) },
  ];
  const checklistDone = checklist.filter((c) => c.done).length;

  async function saveUniverse(formData: FormData) {
    "use server";

    const name = String(formData.get("name") ?? "");
    const description = String(
      formData.get("description") ?? ""
    );

    const bannerFile = formData.get("banner") as File | null;

    let bannerUrl: string | undefined = undefined;

    if (bannerFile && bannerFile.size > 0) {
      const supabaseServer = await createClient();
      const fileExt = bannerFile.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabaseServer.storage
        .from("universe-banners")
        .upload(fileName, bannerFile);

      if (!uploadError) {
        const { data } = supabaseServer.storage
          .from("universe-banners")
          .getPublicUrl(fileName);

        bannerUrl = data.publicUrl;
      }
    }

    await updateMyUniverse(
      universe.id,
      name,
      description,
      bannerUrl
    );

    redirect("/my-universe?saved=1");
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-4xl font-bold">
          My Universe
        </h1>

        <Link
          href={`/wiki/${universe.slug}`}
          className="text-sm underline opacity-70"
        >
          View public wiki page →
        </Link>
      </div>

      {params.saved === "1" && (
        <div
          className="mt-4 rounded-lg border p-3 text-sm"
          style={{ borderColor: "var(--card-border)" }}
        >
          ✓ Universe details saved
        </div>
      )}

      <form
        action={saveUniverse}
        encType="multipart/form-data"
        className="mt-6 rounded-xl border p-5 space-y-4"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >
        <div>
          <label className="block mb-2 font-medium">
            Banner Image (optional)
          </label>

          {universe.banner_url && (
            <img
              src={universe.banner_url}
              alt="Current banner"
              className="mb-3 h-32 w-full rounded-lg object-cover"
            />
          )}

          <input
            type="file"
            name="banner"
            accept="image/*"
            className="w-full border rounded-lg p-2 text-sm"
          />
        </div>
        <div>
          <label className="block mb-2 font-medium">
            Universe Name
          </label>

          <input
            name="name"
            defaultValue={universe.name}
            required
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-medium">
            Description
          </label>

          <textarea
            name="description"
            defaultValue={universe.description ?? ""}
            rows={3}
            placeholder="A short pitch for your universe — its tone, its central conflict, its hook."
            className="w-full border rounded-lg p-3"
          />
        </div>

        <button
          type="submit"
          className="px-4 py-2 rounded-lg font-medium"
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          Save
        </button>
      </form>


      {params.co && CO_MESSAGES[params.co] && (
        <div className="mt-6 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--card-border)" }}>
          {CO_MESSAGES[params.co]}
        </div>
      )}

      {params.sg && SG_MESSAGES[params.sg] && (
        <div className="mt-6 rounded-lg border p-3 text-sm" style={{ borderColor: "var(--card-border)" }}>
          {SG_MESSAGES[params.sg]}
        </div>
      )}

      {(pendingRows ?? []).length > 0 && (
        <section
          className="mt-6 rounded-xl border p-5"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}
        >
          <h2 className="font-bold">💡 Reader suggestions ({(pendingRows ?? []).length})</h2>

          <div className="mt-4 space-y-4">
            {(pendingRows ?? []).map((sg) => {
              const who = people.get(sg.suggested_by);
              return (
                <form
                  key={sg.id}
                  action={resolveSuggestionAction}
                  className="rounded-lg border p-4 text-sm space-y-2"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  <input type="hidden" name="id" value={sg.id} />

                  <p className="font-semibold">
                    {sg.kind === "new"
                      ? `New ${getEntityTypeLabel(sg.entity_type ?? "character").toLowerCase()}: ${sg.name}`
                      : `Edit to ${entityNames.get(sg.entity_id ?? "") ?? "an entry"}`}
                    <span className="ml-2 font-normal opacity-60">
                      from {who?.display_name ?? who?.username ?? "a reader"}
                    </span>
                  </p>

                  {sg.summary && <p className="opacity-85">{sg.summary}</p>}
                  {sg.content && <p className="line-clamp-4 whitespace-pre-wrap opacity-70">{sg.content}</p>}
                  {sg.note && <p className="italic opacity-60">&ldquo;{sg.note}&rdquo;</p>}

                  {sg.kind === "new" && (
                    <select
                      name="originStoryId"
                      className="w-full rounded-lg border p-2"
                      style={{ borderColor: "var(--card-border)" }}
                      defaultValue=""
                    >
                      <option value="">Origin story (needed to accept)…</option>
                      {(myStories ?? []).map((st) => (
                        <option key={st.id} value={st.id}>{st.title}</option>
                      ))}
                    </select>
                  )}

                  <input
                    name="reply"
                    maxLength={300}
                    placeholder="Reply (optional)"
                    className="w-full rounded-lg border p-2"
                    style={{ borderColor: "var(--card-border)" }}
                  />

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      name="decision"
                      value="accept"
                      className="rounded-lg px-4 py-1.5 font-medium"
                      style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}
                    >
                      Accept
                    </button>
                    <button
                      type="submit"
                      name="decision"
                      value="decline"
                      className="rounded-lg border px-4 py-1.5"
                      style={{ borderColor: "var(--card-border)" }}
                    >
                      Decline
                    </button>
                  </div>
                </form>
              );
            })}
          </div>
        </section>
      )}

      <section
        className="mt-6 rounded-xl border p-5"
        style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}
      >
        <h2 className="font-bold">🤝 Co-authors</h2>
        <p className="mt-1 text-sm opacity-70">
          Invite other writers to add their own entries to this universe. They can edit only what they created.
        </p>

        {(memberRows ?? []).length > 0 && (
          <ul className="mt-4 space-y-2 text-sm">
            {(memberRows ?? []).map((m) => {
              const person = people.get(m.user_id);
              return (
                <li key={m.user_id} className="flex items-center justify-between gap-3">
                  <span>{person?.display_name ?? person?.username ?? "Writer"}</span>
                  <form action={removeCoAuthorAction}>
                    <input type="hidden" name="universeId" value={universe.id} />
                    <input type="hidden" name="memberId" value={m.user_id} />
                    <button type="submit" className="text-xs underline opacity-60 hover:opacity-100">
                      Remove
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        )}

        <form action={inviteCoAuthorAction} className="mt-4 flex gap-2">
          <input type="hidden" name="universeId" value={universe.id} />
          <input
            name="username"
            required
            placeholder="Username"
            className="min-w-0 flex-1 rounded-lg border p-2 text-sm"
            style={{ borderColor: "var(--card-border)" }}
          />
          <button
            type="submit"
            className="rounded-lg px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: "var(--button)", color: "var(--button-text)" }}
          >
            Add
          </button>
        </form>
      </section>

      {(joinedUniverses ?? []).length > 0 && (
        <section
          className="mt-6 rounded-xl border p-5"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}
        >
          <h2 className="font-bold">🌐 Universes you contribute to</h2>
          <ul className="mt-3 space-y-2 text-sm">
            {(joinedUniverses ?? []).map((u) => (
              <li key={u.id} className="flex items-center justify-between gap-3">
                <Link href={`/wiki/${u.slug}`} className="underline">{u.name}</Link>
                <span className="flex items-center gap-3">
                  <Link href={`/my-universe/entities/new?universe=${u.id}`} className="font-medium text-cyan-500">
                    + Add entry
                  </Link>
                  <form action={removeCoAuthorAction}>
                    <input type="hidden" name="universeId" value={u.id} />
                    <input type="hidden" name="memberId" value={user.id} />
                    <button type="submit" className="text-xs underline opacity-60 hover:opacity-100">Leave</button>
                  </form>
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {checklistDone < checklist.length && (
        <section
          className="mt-8 rounded-xl border p-5"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}
        >
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold">Build your universe</h2>
            <span className="text-sm opacity-60">
              {checklistDone}/{checklist.length}
            </span>
          </div>

          <div
            className="mt-3 h-1.5 overflow-hidden rounded-full"
            style={{ backgroundColor: "var(--card-border)" }}
          >
            <div
              className="h-full rounded-full bg-cyan-500"
              style={{ width: `${(checklistDone / checklist.length) * 100}%` }}
            />
          </div>

          <ul className="mt-4 space-y-1.5 text-sm">
            {checklist.map((item) => (
              <li key={item.label} className={item.done ? "opacity-50" : ""}>
                {item.done ? "✅" : "⬜"} {item.label}
              </li>
            ))}
          </ul>
        </section>
      )}

      {suggestions.length > 0 && (
        <section
          className="mt-6 rounded-xl border p-5"
          style={{ backgroundColor: "var(--card)", borderColor: "var(--card-border)" }}
        >
          <h2 className="font-bold">✨ Found in your chapters</h2>
          <p className="mt-1 text-sm opacity-70">
            These names keep showing up in your writing but have no wiki entry yet. Tap one to add it.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Link
                key={s.name}
                href={`/my-universe/entities/new?name=${encodeURIComponent(s.name)}${
                  s.storyId ? `&story=${s.storyId}` : ""
                }`}
                title={s.storyId ? storyTitles.get(s.storyId) : undefined}
                className="rounded-full border px-3 py-1 text-sm transition hover:shadow-md"
                style={{ borderColor: "var(--card-border)" }}
              >
                + {s.name}{" "}
                <span className="opacity-50">×{s.count}</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          Wiki Entries
        </h2>

        <Link
          href="/my-universe/entities/new"
          className="px-4 py-2 rounded-lg font-medium"
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          + New Entity
        </Link>
      </div>

      {!entities || entities.length === 0 ? (
        <div
          className="mt-6 rounded-xl border p-8 text-center"
          style={{ borderColor: "var(--card-border)" }}
        >
          <p className="opacity-70">
            No wiki entries yet — start with a character
            or a location from one of your stories.
          </p>
        </div>
      ) : (
        Object.entries(grouped).map(([type, items]) => (
          <section key={type} className="mt-8">
            <h3 className="font-semibold mb-3 opacity-80">
              {getEntityTypeIcon(type)}{" "}
              {getEntityTypeLabel(type)}s
            </h3>

            <div className="space-y-2">
              {(items as any[]).map((entity) => (
                <Link
                  key={entity.id}
                  href={`/my-universe/entities/${entity.id}/edit`}
                  className="
                    flex
                    items-center
                    justify-between
                    rounded-lg
                    border
                    p-3
                    text-sm
                    hover:shadow-md
                    transition
                  "
                  style={{
                    borderColor: "var(--card-border)",
                  }}
                >
                  <span className="font-medium">
                    {entity.name}
                  </span>

                  <span className="opacity-50">
                    Edit →
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  );
}