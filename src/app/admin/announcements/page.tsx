import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

type Announcement = {
  id: string;
  title: string;
  content: string;
  is_published: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
  published_at: string | null;
};

export default async function AdminAnnouncementsPage() {
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

  const { data: announcements, error } = await supabase
    .from("announcements")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-card-border bg-card p-6">
            <h1 className="text-xl font-semibold text-foreground">
              Unable to load announcements
            </h1>

            <p className="mt-2 text-sm text-foreground/60">
              {error.message}
            </p>
          </div>
        </div>
      </main>
    );
  }

  const items = (announcements ?? []) as Announcement[];

  const publishedCount = items.filter(
    (item) => item.is_published
  ).length;

  const draftCount = items.filter(
    (item) => !item.is_published
  ).length;

  async function createAnnouncement(formData: FormData) {
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

    if (
      !profile ||
      !["admin", "superadmin"].includes(profile.role)
    ) {
      redirect("/");
    }

    const title = String(formData.get("title") ?? "").trim();
    const content = String(
      formData.get("content") ?? ""
    ).trim();

    if (!title || !content) {
      redirect("/admin/announcements?error=missing");
    }

    const { error } = await supabase
      .from("announcements")
      .insert({
        title,
        content,
        created_by: user.id,
        is_published: false,
      });

    if (error) {
      redirect(
        `/admin/announcements?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    revalidatePath("/admin/announcements");
    redirect("/admin/announcements");
  }

  async function toggleAnnouncement(formData: FormData) {
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

    if (
      !profile ||
      !["admin", "superadmin"].includes(profile.role)
    ) {
      redirect("/");
    }

    const announcementId = String(
      formData.get("announcement_id") ?? ""
    );

    const currentPublished =
      String(formData.get("is_published")) === "true";

    const newPublished = !currentPublished;

    const { error } = await supabase
      .from("announcements")
      .update({
        is_published: newPublished,
        published_at: newPublished
          ? new Date().toISOString()
          : null,
      })
      .eq("id", announcementId);

    if (error) {
      redirect(
        `/admin/announcements?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    revalidatePath("/admin/announcements");
    redirect("/admin/announcements");
  }

  async function deleteAnnouncement(formData: FormData) {
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

    if (
      !profile ||
      !["admin", "superadmin"].includes(profile.role)
    ) {
      redirect("/");
    }

    const announcementId = String(
      formData.get("announcement_id") ?? ""
    );

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId);

    if (error) {
      redirect(
        `/admin/announcements?error=${encodeURIComponent(
          error.message
        )}`
      );
    }

    revalidatePath("/admin/announcements");
    redirect("/admin/announcements");
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-card-border bg-card text-2xl shadow-sm">
              📢
            </div>

            <div>
              <p className="text-sm font-medium text-foreground/60">
                Administration
              </p>

              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Announcements
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-sm leading-6 text-foreground/65">
            Create and publish important messages for the
            Boundless community.
          </p>
        </div>

        {/* Stats */}
        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Total"
            value={items.length}
          />

          <StatCard
            label="Published"
            value={publishedCount}
          />

          <StatCard
            label="Drafts"
            value={draftCount}
          />
        </div>

        {/* Create */}
        <section className="mb-8 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <div className="mb-5">
            <h2 className="text-lg font-semibold text-foreground">
              Create Announcement
            </h2>

            <p className="mt-1 text-sm text-foreground/55">
              New announcements start as drafts so you can review
              them before publishing.
            </p>
          </div>

          <form action={createAnnouncement} className="space-y-5">
            <div>
              <label
                htmlFor="title"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Title
              </label>

              <input
                id="title"
                name="title"
                type="text"
                required
                maxLength={200}
                placeholder="Announcement title"
                className="w-full rounded-xl border border-card-border bg-background px-4 py-3 text-sm text-foreground outline-none transition placeholder:text-foreground/35 focus:border-foreground/40"
              />
            </div>

            <div>
              <label
                htmlFor="content"
                className="mb-2 block text-sm font-medium text-foreground"
              >
                Message
              </label>

              <textarea
                id="content"
                name="content"
                required
                rows={6}
                placeholder="Write your announcement..."
                className="w-full resize-y rounded-xl border border-card-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-foreground/35 focus:border-foreground/40"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                className="rounded-xl bg-button px-5 py-3 text-sm font-semibold text-button-text transition hover:opacity-90 active:scale-[0.98]"
              >
                Create Draft
              </button>
            </div>
          </form>
        </section>

        {/* Existing announcements */}
        <section className="overflow-hidden rounded-2xl border border-card-border bg-card shadow-sm">
          <div className="border-b border-card-border px-6 py-5">
            <h2 className="font-semibold text-foreground">
              Existing Announcements
            </h2>

            <p className="mt-1 text-sm text-foreground/55">
              Manage publication status or permanently remove
              announcements.
            </p>
          </div>

          {items.length === 0 ? (
            <div className="px-6 py-14 text-center">
              <div className="mb-3 text-4xl">📭</div>

              <p className="font-medium text-foreground">
                No announcements yet.
              </p>

              <p className="mt-1 text-sm text-foreground/50">
                Create your first announcement above.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-card-border">
              {items.map((announcement) => (
                <div
                  key={announcement.id}
                  className="flex flex-col gap-5 px-6 py-6 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-semibold text-foreground">
                        {announcement.title}
                      </h3>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          announcement.is_published
                            ? "bg-green-500/10 text-green-600 dark:text-green-400"
                            : "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"
                        }`}
                      >
                        {announcement.is_published
                          ? "Published"
                          : "Draft"}
                      </span>
                    </div>

                    <p className="mt-2 max-w-3xl whitespace-pre-wrap text-sm leading-6 text-foreground/65">
                      {announcement.content}
                    </p>

                    <p className="mt-3 text-xs text-foreground/40">
                      Created{" "}
                      {formatDate(announcement.created_at)}
                    </p>
                  </div>

                  <div className="flex shrink-0 flex-wrap gap-2">
                    <form action={toggleAnnouncement}>
                      <input
                        type="hidden"
                        name="announcement_id"
                        value={announcement.id}
                      />

                      <input
                        type="hidden"
                        name="is_published"
                        value={String(
                          announcement.is_published
                        )}
                      />

                      <button
                        type="submit"
                        className="rounded-xl border border-card-border bg-background px-4 py-2 text-sm font-medium text-foreground/70 transition hover:border-foreground/30 hover:text-foreground"
                      >
                        {announcement.is_published
                          ? "Unpublish"
                          : "Publish"}
                      </button>
                    </form>

                    <form action={deleteAnnouncement}>
                      <input
                        type="hidden"
                        name="announcement_id"
                        value={announcement.id}
                      />

                      <button
                        type="submit"
                        className="rounded-xl border border-red-500/30 bg-red-500/5 px-4 py-2 text-sm font-semibold text-red-600 transition hover:border-red-500/50 hover:bg-red-500/10 dark:text-red-400"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}