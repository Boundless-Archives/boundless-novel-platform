"use client";

import { useEffect, useState, useTransition } from "react";
import { Play, Flame } from "lucide-react";
import { claimAdReward } from "@/app/wallet/actions";
import { formatCoins } from "@/lib/currency";

type Status = {
  watchedCount: number;
  maxPerWindow: number;
  eligible: boolean;
  nextEligibleAt: string | null;
  rewardAmount: number;
};

type Props = {
  initialStatus: Status;
  onEarned?: (newBalance: number) => void;
};

function formatCountdown(ms: number): string {
  if (ms <= 0) return "0:00:00";

  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${hours}:${String(minutes).padStart(2, "0")}:${String(
    seconds
  ).padStart(2, "0")}`;
}

export default function AdEarnButton({
  initialStatus,
  onEarned,
}: Props) {
  const [status, setStatus] = useState(initialStatus);
  const [countdown, setCountdown] = useState("");
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (status.eligible || !status.nextEligibleAt) return;

    const interval = setInterval(() => {
      const remaining =
        new Date(status.nextEligibleAt!).getTime() - Date.now();

      if (remaining <= 0) {
        setStatus((current) => ({
          ...current,
          eligible: true,
          watchedCount: 0,
        }));
        clearInterval(interval);
        return;
      }

      setCountdown(formatCountdown(remaining));
    }, 1000);

    return () => clearInterval(interval);
  }, [status.eligible, status.nextEligibleAt]);

  function handleWatch() {
    setMessage("");

    startTransition(async () => {
      try {
        // Placeholder: simulates a completed ad view.
        // Swap this for a real ad SDK's completion callback
        // once a provider is wired up.
        await new Promise((resolve) => setTimeout(resolve, 1200));

        const result = await claimAdReward();

        setMessage(
          `+${formatCoins(result.awarded)} added to your wallet!`
        );

        setStatus((current) => ({
          ...current,
          watchedCount: current.watchedCount + 1,
          eligible:
            current.watchedCount + 1 < current.maxPerWindow,
        }));

        onEarned?.(result.newBalance);
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
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Watch an Ad</h3>

        <span className="text-sm opacity-60">
          {status.watchedCount} / {status.maxPerWindow} today
        </span>
      </div>

      <p className="mt-2 flex items-center gap-1.5 text-sm opacity-70">
        Earn
        <Flame size={14} style={{ color: "var(--accent)" }} />
        {formatCoins(status.rewardAmount)} per ad watched.
      </p>

      {status.eligible ? (
        <button
          type="button"
          onClick={handleWatch}
          disabled={isPending}
          className="
            mt-4
            flex
            w-full
            items-center
            justify-center
            gap-2
            rounded-lg
            px-4
            py-3
            font-semibold
            disabled:opacity-50
          "
          style={{
            backgroundColor: "var(--button)",
            color: "var(--button-text)",
          }}
        >
          <Play size={18} />
          {isPending ? "Watching..." : "Watch Ad"}
        </button>
      ) : (
        <div
          className="mt-4 rounded-lg border p-3 text-center text-sm"
          style={{ borderColor: "var(--card-border)" }}
        >
          <p className="opacity-70">
            Come back in
          </p>
          <p
            className="mt-1 font-mono text-lg font-semibold"
            style={{ color: "var(--accent)" }}
          >
            {countdown || "..."}
          </p>
        </div>
      )}

      {message && (
        <p className="mt-3 text-sm opacity-80">{message}</p>
      )}
    </div>
  );
}