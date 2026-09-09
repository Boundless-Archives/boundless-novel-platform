import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CrossoverRequestActions from "@/components/story/CrossoverRequestActions";

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500",
    accepted: "bg-green-600",
    declined: "bg-red-500",
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

export default async function CrossoversPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const selectQuery = `
    id,
    status,
    message,
    created_at,
    requesting_story:requesting_story_id ( title, slug ),
    target_story:target_story_id ( title, slug ),
    requester:requested_by ( username, display_name ),
    target_author:target_author_id ( username, display_name )
  `;

  const { data: incoming } = await supabase
    .from("crossover_requests")
    .select(selectQuery)
    .eq("target_author_id", user.id)
    .order("created_at", { ascending: false });

  const { data: outgoing } = await supabase
    .from("crossover_requests")
    .select(selectQuery)
    .eq("requested_by", user.id)
    .order("created_at", { ascending: false });

  function first<T>(value: T | T[] | null): T | null {
    if (!value) return null;
    return Array.isArray(value) ? value[0] ?? null : value;
  }

  return (
    <main className="max-w-4xl mx-auto p-8">
      <h1 className="text-4xl font-bold">
        🌐 Crossover Requests
      </h1>

      <p className="mt-3 opacity-70">
        Requests to crossover your stories with other
        writers&apos; universes, and requests you&apos;ve sent out.
      </p>

      <section className="mt-10">
        <h2 className="text-2xl font-semibold mb-4">
          Incoming
        </h2>

        {!incoming?.length ? (
          <p className="opacity-60">No incoming requests.</p>
        ) : (
          <div className="space-y-3">
            {incoming.map((request: any) => {
              const requestingStory = first(
                request.requesting_story
              );
              const targetStory = first(request.target_story);
              const requester = first(request.requester);

              return (
                <div
                  key={request.id}
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--card-border)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        {requester?.display_name ??
                          requester?.username ??
                          "Someone"}{" "}
                        wants to crossover{" "}
                        <Link
                          href={`/story/${requestingStory?.slug}`}
                          className="underline"
                        >
                          {requestingStory?.title}
                        </Link>{" "}
                        with your story{" "}
                        <Link
                          href={`/story/${targetStory?.slug}`}
                          className="underline"
                        >
                          {targetStory?.title}
                        </Link>
                      </p>

                      {request.message && (
                        <p className="mt-2 text-sm opacity-80">
                          &ldquo;{request.message}&rdquo;
                        </p>
                      )}

                      <div className="mt-2">
                        {statusBadge(request.status)}
                      </div>
                    </div>

                    {request.status === "pending" && (
                      <CrossoverRequestActions
                        requestId={request.id}
                        mode="incoming"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-12">
        <h2 className="text-2xl font-semibold mb-4">
          Outgoing
        </h2>

        {!outgoing?.length ? (
          <p className="opacity-60">No outgoing requests.</p>
        ) : (
          <div className="space-y-3">
            {outgoing.map((request: any) => {
              const requestingStory = first(
                request.requesting_story
              );
              const targetStory = first(request.target_story);
              const targetAuthor = first(
                request.target_author
              );

              return (
                <div
                  key={request.id}
                  className="rounded-xl border p-4"
                  style={{
                    backgroundColor: "var(--card)",
                    borderColor: "var(--card-border)",
                  }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold">
                        You requested to crossover{" "}
                        <Link
                          href={`/story/${requestingStory?.slug}`}
                          className="underline"
                        >
                          {requestingStory?.title}
                        </Link>{" "}
                        with{" "}
                        <Link
                          href={`/story/${targetStory?.slug}`}
                          className="underline"
                        >
                          {targetStory?.title}
                        </Link>{" "}
                        by{" "}
                        {targetAuthor?.display_name ??
                          targetAuthor?.username ??
                          "Unknown Author"}
                      </p>

                      <div className="mt-2">
                        {statusBadge(request.status)}
                      </div>
                    </div>

                    {request.status === "pending" && (
                      <CrossoverRequestActions
                        requestId={request.id}
                        mode="outgoing"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}