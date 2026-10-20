import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  // Behind Vercel's proxy the public host arrives in this header.
  const forwardedHost = request.headers.get("x-forwarded-host");
  const isLocal = process.env.NODE_ENV === "development";

  const base =
    !isLocal && forwardedHost
      ? `https://${forwardedHost}`
      : origin;

  if (code) {
    const supabase = await createClient();

    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("onboarding_completed")
          .eq("id", user.id)
          .maybeSingle();

        if (profile && !profile.onboarding_completed) {
          return NextResponse.redirect(`${base}/auth/onboarding`);
        }
      }

      return NextResponse.redirect(`${base}/profile`);
    }
  }

  // Supabase reports a refused new account (registrations closed) as a
  // generic database error on the redirect.
  const reason = `${searchParams.get("error_description") ?? ""}`;

  if (/database error saving new user/i.test(reason)) {
    return NextResponse.redirect(`${base}/auth/login?error=closed`);
  }

  return NextResponse.redirect(`${base}/auth/login?error=oauth`);
}