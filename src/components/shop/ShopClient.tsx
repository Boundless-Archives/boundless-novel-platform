"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Flame,
  FlaskConical,
  Gem,
  ShoppingBag,
  Snowflake,
  Sparkles,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  buyShopItem,
  exchangeEmbersForSparks,
  activateBooster,
  restoreStreak,
  type RestoreOffer,
  type ShopItem,
} from "@/app/shop/actions";
import CosmeticsSection, {
  type CosmeticsData,
} from "@/components/shop/CosmeticsSection";
import {
  CURRENCY_NAME,
  SPARK_NAME,
  SPARKS_PER_EMBER,
  formatCoins,
} from "@/lib/currency";

const ICON_MAP: Record<string, LucideIcon> = {
  Snowflake,
  Gem,
  FlaskConical,
  Sparkles,
};

type Props = {
  items: ShopItem[];
  embers: number;
  sparks: number;
  inventory: Record<string, number>;
  restoreOffers: RestoreOffer[];
  cosmetics: CosmeticsData;
  activeBooster: {
    name: string;
    percent: number;
    expiresAt: string;
  } | null;
};

const cardStyle = {
  borderColor: "var(--card-border)",
  backgroundColor: "var(--card)",
};

/*
 * The active-booster banner with a live countdown. It is keyed on the
 * expiry time, so a freshly started booster always mounts with a fresh
 * clock, and it asks the page to refresh when the time runs out.
 */
function BoosterBanner({
  name,
  percent,
  expiresAt,
}: {
  name: string;
  percent: number;
  expiresAt: string;
}) {
  const router = useRouter();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const msLeft = new Date(expiresAt).getTime() - now;
  const left = Math.max(0, Math.ceil(msLeft / 60000));

  useEffect(() => {
    if (msLeft <= 0) router.refresh();
  }, [msLeft, router]);

  return (
    <div
      className="mt-4 rounded-xl border p-4 text-sm"
      style={{ borderColor: "var(--accent)" }}
    >
      <strong>{name}</strong> is active: +{percent}% cultivation
      speed · {left > 0 ? `${left} min left` : "ending now"}
    </div>
  );
}

export default function ShopClient({
  items,
  embers,
  sparks,
  inventory,
  restoreOffers,
  cosmetics,
  activeBooster,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [exchangeAmount, setExchangeAmount] = useState("");
  const exchangeEmbers = Math.floor(Number(exchangeAmount) || 0);

  function run(action: () => Promise<string>) {
    setMessage("");

    startTransition(async () => {
      try {
        setMessage(await action());
        router.refresh();
      } catch (e) {
        setMessage(
          e instanceof Error ? e.message : "Something went wrong."
        );
      }
    });
  }

  function handleBuy(item: ShopItem, currency: "sparks" | "embers") {
    run(async () => {
      await buyShopItem(item.slug, currency, 1);
      return `${item.name} added to your items.`;
    });
  }

  function handleUse(item: ShopItem) {
    run(async () => {
      const result = await activateBooster(item.slug);
      return `${item.name} is active: +${result.percent}% cultivation speed.`;
    });
  }

  function handleRestore(
    offer: RestoreOffer,
    currency: "sparks" | "embers"
  ) {
    run(async () => {
      const result = await restoreStreak(offer.streak_type, currency);
      return `Your ${offer.streak_type} streak is back at ${result.streak} days.`;
    });
  }

  function handleExchange() {
    run(async () => {
      const result = await exchangeEmbersForSparks(exchangeEmbers);
      setExchangeAmount("");
      return `Exchanged for ${formatCoins(result.gained)} ${SPARK_NAME}.`;
    });
  }

  const freezes = items.filter((i) => i.kind === "streak_freeze");
  const boosters = items.filter((i) => i.kind === "xp_booster");

  function renderItem(item: ShopItem) {
    const Icon = ICON_MAP[item.icon] ?? ShoppingBag;
    const owned = inventory[item.slug] ?? 0;
    const full = item.max_held !== null && owned >= item.max_held;
    const isBooster = item.kind === "xp_booster";

    return (
      <div
        key={item.slug}
        className="flex flex-col rounded-xl border p-5"
        style={cardStyle}
      >
        <div className="flex items-center gap-3">
          <Icon size={28} style={{ color: "var(--accent)" }} />

          <div>
            <p className="font-semibold">{item.name}</p>
            <p className="text-xs opacity-60">
              You have {owned}
              {item.max_held !== null && ` (max ${item.max_held})`}
            </p>
          </div>
        </div>

        <p className="mt-3 flex-1 text-sm opacity-80">
          {item.description}
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={isPending || full || sparks < item.spark_price}
            onClick={() => handleBuy(item, "sparks")}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundColor: "var(--button)",
              color: "var(--button-text)",
            }}
          >
            <Zap size={14} />
            {formatCoins(item.spark_price)}
          </button>

          <button
            type="button"
            disabled={isPending || full || embers < item.ember_price}
            onClick={() => handleBuy(item, "embers")}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            style={{ borderColor: "var(--card-border)" }}
          >
            <Flame size={14} />
            {formatCoins(item.ember_price)}
          </button>

          {isBooster && (
            <button
              type="button"
              disabled={isPending || owned < 1 || !!activeBooster}
              onClick={() => handleUse(item)}
              className="rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
              style={{ borderColor: "var(--accent)" }}
              title={
                activeBooster
                  ? "A booster is already active."
                  : owned < 1
                    ? "Buy one first."
                    : undefined
              }
            >
              Use
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-6 md:p-8">
      <h1 className="text-4xl font-bold">Spark Shop</h1>

      <p className="mt-2 text-sm opacity-70">
        {SPARK_NAME} are earned from streak milestones and spent
        here. They can&apos;t be gifted or withdrawn. {CURRENCY_NAME}{" "}
        can buy everything here too, at {SPARKS_PER_EMBER}× the
        buying power.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4">
        <div
          className="rounded-xl border p-5 text-center"
          style={cardStyle}
        >
          <p className="text-xs uppercase tracking-wide opacity-60">
            {SPARK_NAME}
          </p>
          <p
            className="mt-1 flex items-center justify-center gap-2 font-serif text-3xl font-bold"
            style={{ color: "var(--accent)" }}
          >
            <Zap size={26} />
            {formatCoins(sparks)}
          </p>
        </div>

        <div
          className="rounded-xl border p-5 text-center"
          style={cardStyle}
        >
          <p className="text-xs uppercase tracking-wide opacity-60">
            {CURRENCY_NAME}
          </p>
          <p
            className="mt-1 flex items-center justify-center gap-2 font-serif text-3xl font-bold"
            style={{ color: "var(--accent)" }}
          >
            <Flame size={26} />
            {formatCoins(embers)}
          </p>
        </div>
      </div>

      {activeBooster && (
        <BoosterBanner
          key={activeBooster.expiresAt}
          name={activeBooster.name}
          percent={activeBooster.percent}
          expiresAt={activeBooster.expiresAt}
        />
      )}

      {message && (
        <p role="status" className="mt-4 text-sm opacity-90">
          {message}
        </p>
      )}

      {restoreOffers.length > 0 && (
        <section id="restore" className="mt-8">
          <h2 className="mb-1 text-xl font-semibold">
            Restore a lost streak
          </h2>
          <p className="mb-4 text-sm opacity-60">
            A streak of 7+ days that ended in the last 3 days can be
            brought back, once every 30 days. You keep the old count
            plus any days you have rebuilt since.
          </p>

          <div className="grid gap-4">
            {restoreOffers.map((offer) => (
              <div
                key={offer.streak_type}
                className="rounded-xl border p-5"
                style={{ borderColor: "var(--accent)" }}
              >
                <div className="flex items-center gap-3">
                  <Flame
                    size={28}
                    style={{ color: "var(--accent)" }}
                  />

                  <div>
                    <p className="font-semibold">
                      {offer.broken_streak}-day {offer.streak_type}{" "}
                      streak
                    </p>
                    <p className="text-xs opacity-60">
                      Restore before{" "}
                      {new Date(offer.expires_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={isPending || sparks < offer.spark_price}
                    onClick={() => handleRestore(offer, "sparks")}
                    className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                    style={{
                      backgroundColor: "var(--button)",
                      color: "var(--button-text)",
                    }}
                  >
                    <Zap size={14} />
                    {formatCoins(offer.spark_price)}
                  </button>

                  <button
                    type="button"
                    disabled={isPending || embers < offer.ember_price}
                    onClick={() => handleRestore(offer, "embers")}
                    className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    <Flame size={14} />
                    {formatCoins(offer.ember_price)}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8">
        <h2 className="mb-1 text-xl font-semibold">Streak Freezes</h2>
        <p className="mb-4 text-sm opacity-60">
          Miss a day and a freeze is used automatically, so your
          streak carries on. One freeze covers one missed day, and
          freezes only protect their own streak.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {freezes.map(renderItem)}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-1 text-xl font-semibold">
          Cultivation Boosters
        </h2>
        <p className="mb-4 text-sm opacity-60">
          A booster raises how fast you earn cultivation XP from
          reading and writing while it lasts. One at a time; start
          it with Use.
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          {boosters.map(renderItem)}
        </div>
      </section>

      <CosmeticsSection
        data={cosmetics}
        sparks={sparks}
        embers={embers}
        onMessage={setMessage}
      />

      <section
        className="mt-8 rounded-xl border p-5"
        style={cardStyle}
      >
        <h2 className="text-xl font-semibold">
          Get more {SPARK_NAME}
        </h2>
        <p className="mt-1 text-sm opacity-60">
          1 Ember = {SPARKS_PER_EMBER} {SPARK_NAME}. This is one way
          only; {SPARK_NAME} can&apos;t be turned back into{" "}
          {CURRENCY_NAME}.
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <input
            type="number"
            min={1}
            max={Math.max(1, embers)}
            inputMode="numeric"
            value={exchangeAmount}
            onChange={(e) => setExchangeAmount(e.target.value)}
            placeholder={`${CURRENCY_NAME} to exchange`}
            className="w-44 rounded-lg border bg-transparent px-3 py-2 text-sm"
            style={{ borderColor: "var(--card-border)" }}
          />

          <span className="text-sm opacity-70">
            = {formatCoins(exchangeEmbers * SPARKS_PER_EMBER)}{" "}
            {SPARK_NAME}
          </span>

          <button
            type="button"
            onClick={handleExchange}
            disabled={
              isPending || exchangeEmbers < 1 || exchangeEmbers > embers
            }
            className="rounded-lg px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
            style={{
              backgroundColor: "var(--button)",
              color: "var(--button-text)",
            }}
          >
            Exchange
          </button>
        </div>

        <p className="mt-3 text-xs opacity-60">
          Need {CURRENCY_NAME}?{" "}
          <Link
            href="/wallet"
            className="underline underline-offset-4"
          >
            Earn some in your wallet
          </Link>
          .
        </p>
      </section>
    </main>
  );
}