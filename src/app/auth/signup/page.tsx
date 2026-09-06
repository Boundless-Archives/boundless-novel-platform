"use client";

import { useState } from "react";
import Link from "next/link";
import Button from "@/components/ui/Button";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSignup(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");
    setSuccess(false);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });

    if (error) {
      switch (error.message) {
        case "Email rate limit exceeded":
          setMessage(
            "Too many sign-up attempts were made recently. Please wait a few minutes before trying again."
          );
          break;

        case "User already registered":
          setMessage(
            "An account with this email already exists."
          );
          break;

        case "Password should be at least 6 characters":
          setMessage(
            "Your password must be at least 6 characters long."
          );
          break;

        default:
          setMessage(error.message);
      }

      setLoading(false);
      return;
    }

    setEmail("");
    setPassword("");

    setSuccess(true);
    setMessage(
      "Account created successfully! Check your email to verify your account before logging in."
    );

    setLoading(false);
  }

  return (
    <main className="min-h-[calc(100vh-4rem)] px-6 py-12 sm:py-20">
      <div className="mx-auto w-full max-w-md">
        {/* Header */}
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
            Join Boundless
          </h1>

          <p className="mt-3 text-sm opacity-65 sm:text-base">
            Create your account and start discovering stories,
            building your library, and eventually publishing your
            own worlds.
          </p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border p-6 shadow-sm sm:p-8"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          <form
            onSubmit={handleSignup}
            className="flex flex-col gap-5"
          >
            <div>
              <label
                htmlFor="signup-email"
                className="mb-2 block text-sm font-medium"
              >
                Email address
              </label>

              <input
                id="signup-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                disabled={loading || success}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--card-border)",
                }}
                required
              />
            </div>

            <div>
              <label
                htmlFor="signup-password"
                className="mb-2 block text-sm font-medium"
              >
                Password
              </label>

              <input
                id="signup-password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                disabled={loading || success}
                autoComplete="new-password"
                minLength={6}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                style={{
                  borderColor: "var(--card-border)",
                }}
                required
              />

              <p className="mt-2 text-xs opacity-50">
                Use at least 6 characters.
              </p>
            </div>

            {message && (
              <div
                role="status"
                className="rounded-xl border px-4 py-3 text-sm"
                style={{
                  borderColor: "var(--card-border)",
                }}
              >
                {success ? "✓ " : ""}
                {message}
              </div>
            )}

            {!success && (
              <Button
                type="submit"
                disabled={loading}
                fullWidth
              >
                {loading
                  ? "Creating account..."
                  : "Create account"}
              </Button>
            )}
          </form>

          <div
            className="my-7 h-px"
            style={{
              backgroundColor: "var(--card-border)",
            }}
          />

          <p className="text-center text-sm opacity-70">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold opacity-100 underline underline-offset-4"
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs opacity-45">
          Welcome to Boundless — Infinite stories - Infinte Worlds.
        </p>
      </div>
    </main>
  );
}