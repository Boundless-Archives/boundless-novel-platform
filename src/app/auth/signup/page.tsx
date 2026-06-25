"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";
import { createClient } from "@/utils/supabase/client";

export default function SignupPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSignup(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setMessage("");

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

    setMessage(
      "✅ Account created successfully! Check your email to verify your account before logging in."
    );

    setLoading(false);
  }

  return (
    <main className="max-w-md mx-auto px-6 py-16">

      <div
        className="rounded-2xl border p-8"
        style={{
          backgroundColor: "var(--card)",
          borderColor: "var(--card-border)",
        }}
      >

        <h1 className="text-4xl font-bold">
          Create Account
        </h1>

        <p className="mt-3 opacity-70">
          Join Boundless and start building your personal library,
          discovering amazing stories, and publishing your own worlds.
        </p>

        <form
          onSubmit={handleSignup}
          className="mt-8 flex flex-col gap-5"
        >

          <input
            type="email"
            placeholder="Email address"
            value={email}
            disabled={loading}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="border rounded-lg p-3"
            style={{
              borderColor: "var(--card-border)",
            }}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            disabled={loading}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="border rounded-lg p-3"
            style={{
              borderColor: "var(--card-border)",
            }}
            required
          />

          <Button
            type="submit"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </Button>

        </form>

        {message && (
          <div
            className="mt-6 rounded-lg border p-4 text-sm"
            style={{
              borderColor: "var(--card-border)",
            }}
          >
            {message}
          </div>
        )}

        <div className="mt-8 text-center text-sm opacity-70">
          Already have an account?{" "}
          <a
            href="/auth/login"
            className="underline font-medium"
          >
            Log in
          </a>
        </div>
      </div>
    </main>
  );
}