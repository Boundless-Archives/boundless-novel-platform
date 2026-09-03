import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

type Announcement = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  published_at: string | null;
};

export default async function AnnouncementsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: announcements, error } = await supabase
    .from("announcements")
    .select(
      "id, title, content, created_at, published_at"
    )
    .eq("is_published", true)
    .order("published_at", {
      ascending: false,
      nullsFirst: false,
    });

  if (error) {
    return (
      <main className="min-h-screen bg-background">
        <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="rounded-2xl border border-card-border bg-card p-6 shadow-sm">
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

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10">
          <Link
            href="/"
            className="mb-6 inline-flex items-center text-sm text-foreground/55 transition hover:text-foreground"
          >
            ← Back to Boundless
          </Link>

          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-card-border bg-card text-2xl shadow-sm">
              📢
            </div>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Announcements
              </h1>

              <p className="mt-2 text-sm leading-6 text-foreground/60">
                News, updates, and important messages from
                Boundless.
              </p>
            </div>
          </div>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="rounded-2xl border border-card-border bg-card px-6 py-14 text-center shadow-sm">
            <div className="mb-4 text-5xl">📭</div>

            <h2 className="text-xl font-semibold text-foreground">
              No announcements yet
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-foreground/55">
              There are currently no published announcements.
              Check back later for updates.
            </p>
          </div>
        )}

        {/* Announcement list */}
        <div className="space-y-5">
          {items.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-2xl border border-card-border bg-card p-6 shadow-sm transition hover:shadow-md"
            >
              <div className="flex flex-col gap-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold tracking-tight text-foreground">
                    {announcement.title}
                  </h2>

                  <time
                    dateTime={
                      announcement.published_at ??
                      announcement.created_at
                    }
                    className="text-xs text-foreground/40"
                  >
                    {formatDate(
                      announcement.published_at ??
                        announcement.created_at
                    )}
                  </time>
                </div>

                <div className="h-px w-full bg-card-border" />

                <p className="whitespace-pre-wrap text-sm leading-7 text-foreground/70">
                  {announcement.content}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </main>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
  }).format(new Date(value));
}