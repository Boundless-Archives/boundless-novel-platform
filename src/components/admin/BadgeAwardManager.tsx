"use client";

import { useState, useTransition } from "react";
import {
  searchUsersForBadgeAward,
  manuallyAwardBadge,
} from "@/app/badges/actions";

type BadgeOption = {
  id: string;
  name: string;
};

type UserResult = {
  id: string;
  username: string;
  display_name: string | null;
};

type Props = {
  badges: BadgeOption[];
};

export default function BadgeAwardManager({ badges }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] =
    useState<UserResult | null>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  const [status, setStatus] = useState
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSearch() {
    startTransition(async () => {
      const users = await searchUsersForBadgeAward(query);
      setResults(users);
    });
  }

  function handleAward() {
    if (!selectedUser || !selectedBadgeId) return;

    setStatus("idle");
    setErrorMessage("");

    startTransition(async () => {
      try {
        await manuallyAwardBadge(
          selectedUser.id,
          selectedBadgeId
        );
        setStatus("success");
        setSelectedUser(null);
        setSelectedBadgeId("");
        setResults([]);
        setQuery("");
      } catch (error) {
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Something went wrong."
        );
        setStatus("error");
      }
    });
  }

  return (
    <div
      className="rounded-xl border p-5"
      style={{
        backgroundColor: "var(--card)",
        borderColor: "var(--card-border)",
      }}
    >
      <h2 className="font-semibold mb-4">
        Manually Award a Badge
      </h2>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username..."
          className="flex-1 border rounded-lg p-2 text-sm"
        />

        <button
          type="button"
          onClick={handleSearch}
          disabled={!query.trim() || isPending}
          className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          Search
        </button>
      </div>

      {results.length > 0 && !selectedUser && (
        <div className="mt-3 space-y-1">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => setSelectedUser(result)}
              className="w-full text-left rounded-lg border p-2 text-sm hover:bg-[var(--background)]"
              style={{ borderColor: "var(--card-border)" }}
            >
              {result.display_name ?? result.username} (@
              {result.username})
            </button>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="mt-4 space-y-3">
          <p className="text-sm">
            Awarding to:{" "}
            <strong>
              {selectedUser.display_name ??
                selectedUser.username}
            </strong>{" "}
            <button
              type="button"
              onClick={() => setSelectedUser(null)}
              className="text-xs opacity-60 underline"
            >
              change
            </button>
          </p>

          <select
            value={selectedBadgeId}
            onChange={(e) => setSelectedBadgeId(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm"
          >
            <option value="">Select a badge...</option>

            {badges.map((badge) => (
              <option key={badge.id} value={badge.id}>
                {badge.name}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAward}
            disabled={!selectedBadgeId || isPending}
            className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{
              backgroundColor: "var(--button)",
              color: "var(--button-text)",
            }}
          >
            Award Badge
          </button>
        </div>
      )}

      {status === "success" && (
        <p className="mt-3 text-sm" style={{ color: "var(--accent)" }}>
          ✓ Badge awarded
        </p>
      )}

      {status === "error" && (
        <p className="mt-3 text-sm text-red-500">
          {errorMessage}
        </p>
      )}
    </div>
  );
}