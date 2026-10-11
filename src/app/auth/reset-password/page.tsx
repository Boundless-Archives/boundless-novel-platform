"use client";

import Button from "@/components/ui/Button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function ResetPasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [checkingLink, setCheckingLink] = useState(true);
  const [linkValid, setLinkValid] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    async function establishSession() {
      const code = searchParams.get("code");

      if (code) {
        const { error } =
          await supabase.auth.exchangeCodeForSession(code);

        setLinkValid(!error);
        setCheckingLink(false);
        return;
      }

      // Fallback: some Supabase configurations deliver the
      // session via URL fragment and establish it automatically.
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setLinkValid(!!session);
      setCheckingLink(false);
    }

    establishSession();
  }, [searchParams, supabase]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Passwords don't match.");
      return;
    }

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setDone(true);

    setTimeout(() => {
      router.push("/auth/login");
    }, 2500);
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
            Set a new password
          </h1>
        </div>

        <div
          className="rounded-2xl border p-6 shadow-sm sm:p-8"
          style={{
            backgroundColor: "var(--card)",
            borderColor: "var(--card-border)",
          }}
        >
          {checkingLink ? (
            <p className="text-center text-sm opacity-70">
              Verifying your reset link...
            </p>
          ) : !linkValid ? (
            <div
              role="alert"
              className="rounded-xl border px-4 py-3 text-sm"
              style={{ borderColor: "var(--card-border)" }}
            >
              This reset link is invalid or has expired.
              Request a new one from the{" "}
              <Link
                href="/auth/forgot-password"
                className="font-semibold underline underline-offset-4"
              >
                forgot password page
              </Link>
              .
            </div>
          ) : done ? (
            <div
              role="alert"
              className="rounded-xl border px-4 py-3 text-sm"
              style={{ borderColor: "var(--card-border)" }}
            >
              Your password has been updated. Redirecting you
              to sign in...
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-5"
            >
              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-sm font-medium"
                >
                  New password
                </label>

                <input
                  id="password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  disabled={loading}
                  autoComplete="new-password"
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
                  style={{
                    borderColor: "var(--card-border)",
                  }}
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium"
                >
                  Confirm new password
                </label>

                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmPassword}
                  disabled={loading}
                  autoComplete="new-password"
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
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
                {loading ? "Updating..." : "Update password"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </main>
  );
}