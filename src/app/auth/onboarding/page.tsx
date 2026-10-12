import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import OnboardingForm from "@/components/auth/OnboardingForm";

export default async function OnboardingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, display_name, onboarding_completed")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.onboarding_completed) {
    redirect("/profile");
  }

  const suggestedUsername = (profile.username ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "")
    .slice(0, 20);

  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 text-center">
          <div
            className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold shadow-sm"
            style={{
              backgroundColor: "var(--card)",
              border: "1px solid var(--card-border)",
            }}
          >
            B
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Welcome to Boundless
          </h1>

          <p className="mt-3 text-sm opacity-65 sm:text-base">
            Pick the name people will see on your profile,
            reviews, and comments.
          </p>
        </div>

        <div
          className="rounded-2xl border p-6 shadow-sm sm:p-8"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <OnboardingForm
            initialUsername={suggestedUsername}
            initialDisplayName={profile.display_name ?? ""}
          />
        </div>
      </div>
    </main>
  );
}