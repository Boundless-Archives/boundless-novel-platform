"use client";

import Button from "@/components/ui/Button";
import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.resetPasswordForEmail(
      email.trim(),
      {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      }
    );

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSent(true);
  }

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
            Reset your password
          </h1>

          <p className="mt-3 text-sm opacity-65 sm:text-base">
            Enter your email and we'll send you a link to set
            a new password.
          </p>
        </div>

        <div
          className="rounded-2xl border p-6 shadow-sm sm:p-8"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          {sent ? (
            <div
              role="alert"
              className="rounded-xl border px-4 py-3 text-sm"
              style={{ borderColor: "var(--card-border)" }}
            >
              If an account exists for that email, a reset
              link is on its way. Check your inbox (and spam
              folder) for an email from us.
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium"
                >
                  Email address
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  disabled={loading}
                  autoComplete="email"
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: "var(--card-border)",
                  }}
                  required
                />
              </div>

              {message && (
                <div
                  role="alert"
                  className="rounded-xl border px-4 py-3 text-sm"
                  style={{
                    borderColor: "var(--card-border)",
                  }}
                >
                  {message}
                </div>
              )}

              <Button type="submit" disabled={loading} fullWidth>
                {loading ? "Sending..." : "Send reset link"}
              </Button>
            </form>
          )}

          <div
            className="my-7 h-px"
            style={{
              backgroundColor: "var(--card-border)",
            }}
          />

          <p className="text-center text-sm opacity-70">
            Remembered it after all?{" "}
            <Link
              href="/auth/login"
              className="font-semibold opacity-100 underline underline-offset-4"
            >
              Back to sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}