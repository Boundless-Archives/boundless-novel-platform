"use client";

import { useState, useTransition } from "react";
import {
  searchUsersForBadgeAward,
  manuallyAwardBadge,
} from "@/app/badges/actions";

type UserResult = {
  id: string;
  username: string;
  display_name: string | null;
};

type BadgeOption = {
  id: string;
  name: string;
};

type Props = {
  badges: BadgeOption[];
};

export default function BadgeAwardPanel({ badges }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] =
    useState<UserResult | null>(null);
  const [selectedBadgeId, setSelectedBadgeId] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleSearch() {
    startTransition(async () => {
      try {
        const users = await searchUsersForBadgeAward(query);
        setResults(users);
      } catch (error) {
        setResults([]);
      }
    });
  }

  function handleAward() {
    if (!selectedUser || !selectedBadgeId) return;

    setMessage("");

    startTransition(async () => {
      try {
        await manuallyAwardBadge(
          selectedUser.id,
          selectedBadgeId
        );
        setMessage(
          `Awarded to ${
            selectedUser.display_name ?? selectedUser.username
          }.`
        );
        setSelectedUser(null);
        setSelectedBadgeId("");
        setQuery("");
        setResults([]);
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
    <div
      className="rounded-xl border p-5"
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: "var(--card)",
      }}
    >
      <h2 className="font-semibold mb-4">
        Manually Award a Badge
      </h2>

      <div className="flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by username or display name"
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

      {results.length > 0 && (
        <div className="mt-3 space-y-1">
          {results.map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => {
                setSelectedUser(result);
                setResults([]);
                setQuery(
                  result.display_name ?? result.username
                );
              }}
              className="block w-full text-left rounded-lg border p-2 text-sm hover:bg-[var(--background)]"
              style={{ borderColor: "var(--card-border)" }}
            >
              {result.display_name ?? result.username}{" "}
              <span className="opacity-50">
                @{result.username}
              </span>
            </button>
          ))}
        </div>
      )}

      {selectedUser && (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row">
          <select
            value={selectedBadgeId}
            onChange={(e) => setSelectedBadgeId(e.target.value)}
            className="flex-1 border rounded-lg p-2 text-sm"
          >
            <option value="">Select badge...</option>
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
            Award to{" "}
            {selectedUser.display_name ?? selectedUser.username}
          </button>
        </div>
      )}

      {message && (
        <p className="mt-3 text-sm opacity-80">{message}</p>
      )}
    </div>
  );
}