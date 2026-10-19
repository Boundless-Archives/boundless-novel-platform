"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import Link from "next/link";
import { Flame, X } from "lucide-react";
import { dailyCheckIn, type RestoreOffer } from "@/app/quests/actions";
import { SPARK_NAME, formatCoins } from "@/lib/currency";

const CHECKIN_KEY = "boundless:checkin";
const OFFER_KEY = "boundless:restore-offers";
const DISMISS_KEY = "boundless:restore-dismissed";
const CHANGE_EVENT = "boundless:beacon";
const ONE_HOUR = 60 * 60 * 1000;

function readStore(key: string): string | null {
  try {
    return window.sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStore(key: string, value: string) {
  try {
    window.sessionStorage.setItem(key, value);
  } catch {
    // Private mode etc: the beacon just runs more often.
  }

  window.dispatchEvent(new Event(CHANGE_EVENT));
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);

  return () => window.removeEventListener(CHANGE_EVENT, callback);
}

function parseOffers(raw: string | null): RestoreOffer[] {
  if (!raw) return [];

  try {
    const value = JSON.parse(raw);
    return Array.isArray(value) ? (value as RestoreOffer[]) : [];
  } catch {
    return [];
  }
}

/*
 * Site-wide, invisible unless there is something to say. Once an hour
 * per tab it checks the user in (time zone, the "Show up" quest) and
 * shows a gentle banner when a lost streak can still be restored.
 */
export default function SiteBeacon() {
  // sessionStorage is the source of truth; these re-render the banner
  // whenever it changes (and render nothing on the server).
  const rawOffers = useSyncExternalStore(
    subscribe,
    () => readStore(OFFER_KEY) ?? "",
    () => ""
  );

  const dismissed =
    useSyncExternalStore(
      subscribe,
      () => (readStore(DISMISS_KEY) === "1" ? "1" : ""),
      () => ""
    ) === "1";

  const offers = useMemo(() => parseOffers(rawOffers), [rawOffers]);

  useEffect(() => {
    let cancelled = false;

    const last = Number(readStore(CHECKIN_KEY) ?? 0);

    if (Date.now() - last < ONE_HOUR) {
      return;
    }

    writeStore(CHECKIN_KEY, String(Date.now()));

    dailyCheckIn(Intl.DateTimeFormat().resolvedOptions().timeZone)
      .then((result) => {
        if (cancelled || !result) return;

        writeStore(OFFER_KEY, JSON.stringify(result.restore));
      })
      .catch(() => {
        // A failed check-in must never get in the reader's way.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (dismissed || offers.length === 0) {
    return null;
  }

  const offer = offers[0];

  function dismiss() {
    writeStore(DISMISS_KEY, "1");
  }

  return (
    <div
      role="status"
      className="fixed bottom-4 left-1/2 z-40 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border p-3 text-sm shadow-lg"
      style={{
        borderColor: "var(--accent)",
        backgroundColor: "var(--card)",
      }}
    >
      <Flame
        size={22}
        className="shrink-0"
        style={{ color: "var(--accent)" }}
      />

      <p className="flex-1">
        Your {offer.broken_streak}-day {offer.streak_type} streak just
        ended.{" "}
        <Link
          href="/shop#restore"
          className="font-semibold underline underline-offset-4"
        >
          Restore it for {formatCoins(offer.spark_price)} {SPARK_NAME}
        </Link>
      </p>

      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss"
        className="shrink-0 opacity-60 hover:opacity-100"
      >
        <X size={16} />
      </button>
    </div>
  );
}
