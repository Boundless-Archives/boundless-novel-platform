"use client";

import Button from "@/components/ui/Button";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function LoginPage() {
  const supabase = createClient();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/profile");
    router.refresh();
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
            Welcome back
          </h1>

          <p className="mt-3 text-sm opacity-65 sm:text-base">
            Sign in to continue reading, writing, and building
            your Boundless library.
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
            onSubmit={handleLogin}
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

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-sm font-medium"
                >
                  Password
                </label>
              </div>

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                disabled={loading}
                autoComplete="current-password"
                onChange={(e) => setPassword(e.target.value)}
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

            <Button
              type="submit"
              disabled={loading}
              fullWidth
            >
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div
            className="my-7 h-px"
            style={{
              backgroundColor: "var(--card-border)",
            }}
          />

          <p className="text-center text-sm opacity-70">
            Don't have an account?{" "}
            <Link
              href="/auth/signup"
              className="font-semibold opacity-100 underline underline-offset-4"
            >
              Create one
            </Link>
          </p>
        </div>

        <p className="mt-6 text-center text-xs opacity-45">
          By continuing, you're joining the Boundless community.
        </p>
      </div>
    </main>
  );
}