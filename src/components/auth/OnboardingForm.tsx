"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { completeOnboarding } from "@/app/auth/onboarding/actions";
import {
  cleanUsernameInput,
  USERNAME_RULES_TEXT,
} from "@/lib/username";

export default function OnboardingForm({
  initialUsername,
  initialDisplayName,
}: {
  initialUsername: string;
  initialDisplayName: string;
}) {
  const router = useRouter();

  const [username, setUsername] = useState(initialUsername);
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (isPending) return;

    setMessage("");

    startTransition(async () => {
      try {
        await completeOnboarding(username, displayName);
        router.push("/profile");
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label
          htmlFor="username"
          className="mb-2 block text-sm font-medium"
        >
          Username
        </label>

        <input
          id="username"
          value={username}
          disabled={isPending}
          onChange={(e) =>
            setUsername(cleanUsernameInput(e.target.value))
          }
          placeholder="your_username"
          autoComplete="off"
          maxLength={20}
          className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderColor: "var(--card-border)" }}
          required
        />

        <p className="mt-2 text-xs opacity-50">
          {USERNAME_RULES_TEXT} Your profile will live at
          /author/{username || "your_username"}. You can only
          choose this once, so pick carefully.
        </p>
      </div>

      <div>
        <label
          htmlFor="display-name"
          className="mb-2 block text-sm font-medium"
        >
          Display name{" "}
          <span className="font-normal opacity-50">(optional)</span>
        </label>

        <input
          id="display-name"
          value={displayName}
          disabled={isPending}
          onChange={(e) => setDisplayName(e.target.value)}
          placeholder="How your name appears"
          maxLength={40}
          className="w-full rounded-xl border bg-transparent px-4 py-3 text-sm outline-none transition focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60"
          style={{ borderColor: "var(--card-border)" }}
        />
      </div>

      {message && (
        <div
          role="alert"
          className="rounded-xl border px-4 py-3 text-sm"
          style={{ borderColor: "var(--card-border)" }}
        >
          {message}
        </div>
      )}

      <Button type="submit" disabled={isPending} fullWidth>
        {isPending ? "Saving..." : "Continue"}
      </Button>
    </form>
  );
}