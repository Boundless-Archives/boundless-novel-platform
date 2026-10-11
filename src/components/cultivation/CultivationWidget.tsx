"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Wind, Sparkles } from "lucide-react";
import {
  choosePath,
  spendEmbersForCultivation,
} from "@/app/cultivation/actions";
import {
  XP_PER_EMBER,
  EMBERS_ACCELERATION_MIN_REALM,
} from "@/lib/cultivation";

type CultivationProfile = {
  path: "qi" | "mana";
  totalXp: number;
  majorNumber: number;
  minorNumber: number;
  majorName: string | null;
  minorName: string | null;
  nextMajorName: string | null;
  nextMinorName: string | null;
  nextThreshold: number;
  xpInCurrentStage: number;
  xpNeededForStage: number;
  isMaxRealm: boolean;
  progressInStep: number;
} | null;

const PATH_COLORS = {
  qi: "#2DD4BF",
  mana: "#818CF8",
};

export default function CultivationWidget({
  profile,
}: {
  profile: CultivationProfile;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [embersInput, setEmbersInput] = useState("");
  const [spendMessage, setSpendMessage] = useState("");

  function handleChoose(path: "qi" | "mana") {
    setError("");

    startTransition(async () => {
      try {
        await choosePath(path);
        router.refresh();
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "Something went wrong."
        );
      }
    });
  }

  function handleSpend() {
    const amount = Number(embersInput);
    setSpendMessage("");

    startTransition(async () => {
      try {
        await spendEmbersForCultivation(amount);
        setEmbersInput("");
        router.refresh();
      } catch (e) {
        setSpendMessage(
          e instanceof Error ? e.message : "Something went wrong."
        );
      }
    });
  }

  if (!profile) {
    return (
      <div
        className="rounded-xl border p-6"
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "var(--card)",
        }}
      >
        <h3 className="font-semibold">Begin Cultivation</h3>

        <p className="mt-1 text-sm opacity-70">
          Choose your path. This can't be changed later.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => handleChoose("qi")}
            disabled={isPending}
            className="flex flex-col items-center gap-2 rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
            style={{ borderColor: "var(--card-border)" }}
          >
            <Wind size={28} style={{ color: PATH_COLORS.qi }} />
            <span className="font-semibold">Qi Cultivation</span>
            <span className="text-xs opacity-60">
              Body, breath, and inner strength
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleChoose("mana")}
            disabled={isPending}
            className="flex flex-col items-center gap-2 rounded-xl border p-5 transition hover:-translate-y-0.5 hover:shadow-md disabled:opacity-50"
            style={{ borderColor: "var(--card-border)" }}
          >
            <Sparkles
              size={28}
              style={{ color: PATH_COLORS.mana }}
            />
            <span className="font-semibold">Mana Magic</span>
            <span className="text-xs opacity-60">
              Ley lines, runes, and arcane force
            </span>
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }

  const pathColor = PATH_COLORS[profile.path];
  const PathIcon = profile.path === "qi" ? Wind : Sparkles;

  const stageLabel = profile.minorName
    ? profile.minorName
    : profile.minorNumber > 0
    ? `Stage ${profile.minorNumber}`
    : "Not yet begun";

  const fillPercent = profile.isMaxRealm
    ? 100
    : Math.round(profile.progressInStep * 100);

  return (
    <div
      className="rounded-xl border p-6"
      style={{
        borderColor: "var(--card-border)",
        backgroundColor: "var(--card)",
      }}
    >
      <div className="flex items-center gap-2 opacity-70">
        <PathIcon size={16} style={{ color: pathColor }} />
        <span className="text-sm font-medium">
          {profile.path === "qi" ? "Qi Cultivation" : "Mana Magic"}
        </span>
      </div>

      <div className="mt-2">
        <h3 className="font-serif text-2xl font-bold">
          {profile.majorName}
        </h3>

        <p className="text-sm opacity-60">
          {profile.isMaxRealm ? "Peak Realm" : stageLabel}
        </p>
      </div>

      <div
        className="relative mt-4 h-6 w-full overflow-hidden rounded-full"
        style={{ backgroundColor: "var(--background)" }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${fillPercent}%`,
            backgroundColor: pathColor,
          }}
        />

        <span
          className="absolute inset-0 flex items-center justify-center text-xs font-semibold"
          style={{
            color: fillPercent > 50 ? "#0a0a0a" : "inherit",
          }}
        >
          {fillPercent}%
        </span>
      </div>

      <p className="mt-2 text-xs opacity-50">
        {profile.isMaxRealm
          ? `${profile.totalXp.toLocaleString()} XP — the end of the path`
          : `${profile.xpInCurrentStage.toLocaleString()} / ${profile.xpNeededForStage.toLocaleString()} XP to next stage`}
      </p>

      {profile.majorNumber >= EMBERS_ACCELERATION_MIN_REALM && (
        <div
          className="mt-5 border-t pt-4"
          style={{ borderColor: "var(--card-border)" }}
        >
          <p className="text-xs opacity-60">
            Spend Embers to accelerate ({XP_PER_EMBER} XP per
            Ember)
          </p>

          <div className="mt-2 flex gap-2">
            <input
              type="number"
              min={1}
              value={embersInput}
              onChange={(e) => setEmbersInput(e.target.value)}
              placeholder="Amount"
              className="w-28 rounded-lg border px-3 py-2 text-sm"
              style={{ borderColor: "var(--card-border)" }}
            />

            <button
              type="button"
              onClick={handleSpend}
              disabled={isPending || !embersInput}
              className="rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: pathColor,
                color: "#0a0a0a",
              }}
            >
              Accelerate
            </button>
          </div>

          {spendMessage && (
            <p className="mt-2 text-xs text-red-500">
              {spendMessage}
            </p>
          )}
        </div>
      )}
    </div>
  );
}