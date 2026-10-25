import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import SectionHeader from "@/components/layout/SectionHeader";
import Card from "@/components/ui/Card";
import EventForm from "@/components/events/EventForm";
import { createEventAction } from "../actions";

export const metadata = { title: "New event" };

const ERRORS: Record<string, string> = {
  invalid: "Check the title and dates. The start must be in the future and the end after the start.",
  denied: "You can't create that event.",
  limit: "This group already has the most upcoming events it can (5).",
  failed: "Something went wrong. Please try again.",
};

export default async function NewEventPage({
  searchParams,
}: {
  searchParams: Promise<{ guild?: string; e?: string }>;
}) {
  const sp = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const admin = createAdminClient();

  const [{ data: me }, guildRes] = await Promise.all([
    admin.from("profiles").select("role").eq("id", user.id).maybeSingle(),
    sp.guild
      ? admin.from("guilds").select("id, name, slug, owner_id").eq("slug", sp.guild).maybeSingle()
      : Promise.resolve({ data: null }),
  ]);

  const isStaff = me?.role === "admin" || me?.role === "superadmin";
  const guild = guildRes.data;

  if (sp.guild && !guild) notFound();

  const allowed = guild
    ? guild.owner_id === user.id || me?.role === "superadmin"
    : isStaff;

  return (
    <main className="max-w-xl mx-auto px-6 py-10">
      <Link
        href={guild ? `/guilds/${guild.slug}` : "/events"}
        className="text-sm opacity-60 hover:opacity-100"
      >
        ← {guild ? guild.name : "Events"}
      </Link>

      <div className="mt-3">
        <SectionHeader
          icon="📅"
          title={guild ? `New event for ${guild.name}` : "New event"}
          description={guild ? "Members will be notified." : "Visible to everyone on the Events page."}
        />
      </div>

      {sp.e && <p className="mb-4 text-sm text-red-500">{ERRORS[sp.e] ?? ERRORS.failed}</p>}

      {!allowed ? (
        <Card>
          <p className="text-sm opacity-70">
            {guild ? "Only the founder of this group can create events for it." : "Only the team can create platform events."}
          </p>
        </Card>
      ) : (
        <EventForm
          action={createEventAction}
          guildId={guild?.id}
          guildSlug={guild?.slug}
        />
      )}
    </main>
  );
}
