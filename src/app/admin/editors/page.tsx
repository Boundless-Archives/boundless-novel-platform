import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

type Profile = {
  id: string;
  username: string | null;
  display_name: string | null;
  role: string;
};

type Assignment = {
  id: string;
  editor_id: string;
  author_id: string;
  created_at: string;
};

export default async function AdminEditorsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: currentProfile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (
    !currentProfile ||
    !["admin", "superadmin"].includes(currentProfile.role)
  ) {
    redirect("/");
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, display_name, role")
    .in("role", ["editor", "author"])
    .order("username", { ascending: true });

  if (profilesError) {
    return <ErrorState message={profilesError.message} />;
  }

  const editors = (profiles ?? []).filter(
    (profile) => profile.role === "editor"
  ) as Profile[];

  const authors = (profiles ?? []).filter(
    (profile) => profile.role === "author"
  ) as Profile[];

  const { data: assignments, error: assignmentsError } =
    await supabase
      .from("editor_author_assignments")
      .select("id, editor_id, author_id, created_at")
      .order("created_at", { ascending: true });

  if (assignmentsError) {
    return <ErrorState message={assignmentsError.message} />;
  }

  const assignmentList = (assignments ?? []) as Assignment[];

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-card-border bg-card text-2xl shadow-sm">
              📝
            </div>

            <div>
              <p className="text-sm font-medium text-foreground/60">
                Administration
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Editor Assignments
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-foreground/65">
            Manage which editors oversee which authors.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Editors"
            value={editors.length}
          />

          <StatCard
            label="Authors"
            value={authors.length}
          />

          <StatCard
            label="Assigned Authors"
            value={assignmentList.length}
          />
        </div>

        {/* Assignment form */}
        <section className="mb-8 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="font-semibold text-foreground">
              Assign an Author
            </h2>

            <p className="mt-1 text-sm text-foreground/55">
              Each author can have only one editor at a time.
            </p>
          </div>

          {editors.length === 0 ? (
            <div className="rounded-xl border border-card-border bg-background p-4 text-sm text-foreground/60">
              There are currently no users with the Editor role.
            </div>
          ) : authors.length === 0 ? (
            <div className="rounded-xl border border-card-border bg-background p-4 text-sm text-foreground/60">
              There are currently no unassigned authors available.
            </div>
          ) : (
            <form
              action={assignAuthor}
              className="grid gap-4 md:grid-cols-[1fr_1fr_auto]"
            >
              <select
                name="editorId"
                required
                className="rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground/10"
                defaultValue=""
              >
                <option value="" disabled>
                  Select editor
                </option>

                {editors.map((editor) => (
                  <option
                    key={editor.id}
                    value={editor.id}
                  >
                    {editor.display_name?.trim() ||
                      editor.username?.trim() ||
                      "Unnamed editor"}
                    {editor.username?.trim()
                      ? ` (@${editor.username.trim()})`
                      : ""}
                  </option>
                ))}
              </select>

              <select
                name="authorId"
                required
                className="rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-foreground/10"
                defaultValue=""
              >
                <option value="" disabled>
                  Select author
                </option>

                {authors
                  .filter(
                    (author) =>
                      !assignmentList.some(
                        (assignment) =>
                          assignment.author_id === author.id
                      )
                  )
                  .map((author) => (
                    <option
                      key={author.id}
                      value={author.id}
                    >
                      {author.display_name?.trim() ||
                        author.username?.trim() ||
                        "Unnamed author"}
                      {author.username?.trim()
                        ? ` (@${author.username.trim()})`
                        : ""}
                    </option>
                  ))}
              </select>

              <button
                type="submit"
                className="rounded-xl bg-button px-5 py-3 text-sm font-semibold text-button-text transition hover:opacity-90 active:scale-[0.98]"
              >
                Assign Author
              </button>
            </form>
          )}
        </section>

        {/* Current assignments */}
        <section className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
          <div className="border-b border-card-border px-6 py-5">
            <h2 className="font-semibold text-foreground">
              Current Assignments
            </h2>

            <p className="mt-1 text-sm text-foreground/55">
              Active editor-author relationships
            </p>
          </div>

          {assignmentList.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mb-3 text-3xl">📭</div>

              <p className="text-sm font-medium text-foreground">
                No assignments yet
              </p>

              <p className="mt-1 text-sm text-foreground/50">
                Assign an author to an editor above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-card-border">
              {assignmentList.map((assignment) => {
                const editor = editors.find(
                  (profile) =>
                    profile.id === assignment.editor_id
                );

                const author = authors.find(
                  (profile) =>
                    profile.id === assignment.author_id
                );

                return (
                  <AssignmentRow
                    key={assignment.id}
                    assignment={assignment}
                    editor={editor}
                    author={author}
                  />
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function AssignmentRow({
  assignment,
  editor,
  author,
}: {
  assignment: Assignment;
  editor?: Profile;
  author?: Profile;
}) {
  return (
    <div className="flex flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid flex-1 gap-5 md:grid-cols-[1fr_auto_1fr] md:items-center">
        {/* Editor */}
        <PersonBlock
          label="Editor"
          icon="📝"
          profile={editor}
        />

        {/* Arrow */}
        <div className="hidden text-center text-xl text-foreground/30 md:block">
          →
        </div>

        {/* Author */}
        <PersonBlock
          label="Author"
          icon="✍️"
          profile={author}
        />
      </div>

      {/* Remove */}
      <form action={removeAssignment}>
        <input
          type="hidden"
          name="assignmentId"
          value={assignment.id}
        />

        <button
          type="submit"
          className="rounded-xl border border-card-border bg-background px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-foreground/30 hover:text-foreground active:scale-[0.98]"
        >
          Remove
        </button>
      </form>
    </div>
  );
}

function PersonBlock({
  label,
  icon,
  profile,
}: {
  label: string;
  icon: string;
  profile?: Profile;
}) {
  const name =
    profile?.display_name?.trim() ||
    profile?.username?.trim() ||
    "Unknown user";

  const username = profile?.username?.trim();

  return (
    <div className="flex items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-card-border bg-background">
        {icon}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-foreground/40">
          {label}
        </p>

        <p className="truncate font-semibold text-foreground">
          {name}
        </p>

        {username && (
          <p className="truncate text-sm text-foreground/50">
            @{username}
          </p>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-card-border bg-card p-5 shadow-sm">
      <p className="text-sm text-foreground/55">
        {label}
      </p>

      <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
        {value}
      </p>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <h1 className="text-xl font-semibold text-foreground">
            Unable to load editor assignments
          </h1>

          <p className="mt-2 text-sm text-foreground/60">
            {message}
          </p>
        </div>
      </div>
    </main>
  );
}

async function assignAuthor(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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

  const editorId = formData.get("editorId");
  const authorId = formData.get("authorId");

  if (
    typeof editorId !== "string" ||
    typeof authorId !== "string"
  ) {
    redirect("/admin/editors");
  }

  const { error } = await supabase
    .from("editor_author_assignments")
    .insert({
      editor_id: editorId,
      author_id: authorId,
    });

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/editors");
}

async function removeAssignment(formData: FormData) {
  "use server";

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
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

  const assignmentId = formData.get("assignmentId");

  if (typeof assignmentId !== "string") {
    redirect("/admin/editors");
  }

  const { error } = await supabase
    .from("editor_author_assignments")
    .delete()
    .eq("id", assignmentId);

  if (error) {
    throw new Error(error.message);
  }

  redirect("/admin/editors");
}