"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Diamond,
  FlaskConical,
  ScrollText,
  Egg,
  Sword,
  Star,
  Gift,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { sendGift } from "@/app/gifts/actions";
import { CURRENCY_NAME, formatCoins } from "@/lib/currency";

const ICON_MAP: Record<string, LucideIcon> = {
  Diamond,
  FlaskConical,
  ScrollText,
  Egg,
  Sword,
  Star,
};

type CatalogGift = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string;
  price: number;
};

type Supporter = {
  senderId: string;
  username: string;
  displayName: string | null;
  total: number;
};

type Props = {
  storyId: string;
  catalog: CatalogGift[];
  isLoggedIn: boolean;
  canGift: boolean;
  initialBalance: number | null;
  supporters: Supporter[];
  totalGifts: number;
  totalEmbers: number;
};

export default function GiftSection({
  storyId,
  catalog,
  isLoggedIn,
  canGift,
  initialBalance,
  supporters,
  totalGifts,
  totalEmbers,
}: Props) {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [balance, setBalance] = useState(initialBalance ?? 0);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const selected =
    catalog.find((gift) => gift.id === selectedId) ?? null;

  function handleSend() {
    if (!selected) return;

    setMessage("");

    startTransition(async () => {
      try {
        const result = await sendGift(selected.id, storyId);
        setBalance(result.newBalance);
        setSelectedId(null);
        setMessage(
          `${result.giftName} sent — thank you for supporting the author!`
        );
        router.refresh();
      } catch (e) {
        setMessage(
          e instanceof Error ? e.message : "Something went wrong."
        );
      }
    });
  }

  return (
    <section className="mt-12">
      <h2 className="mb-4 text-2xl font-bold">
        Support this story
      </h2>

      <div
        className="rounded-xl border p-5"
        style={{
          borderColor: "var(--card-border)",
          backgroundColor: "var(--card)",
        }}
      >
        <p className="text-sm opacity-70">
          {totalGifts === 0
            ? "No gifts yet."
            : `${totalGifts} gift${
                totalGifts === 1 ? "" : "s"
              } · ${formatCoins(totalEmbers)} ${CURRENCY_NAME} sent`}
        </p>

        {canGift ? (
          <>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 opacity-80">
                Your balance:
                <Flame
                  size={14}
                  style={{ color: "var(--accent)" }}
                />
                <strong>{formatCoins(balance)}</strong>
              </span>

              <Link
                href="/wallet"
                className="text-xs underline underline-offset-4 opacity-70"
              >
                Earn more {CURRENCY_NAME}
              </Link>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {catalog.map((gift) => {
                const Icon = ICON_MAP[gift.icon] ?? Gift;
                const affordable = balance >= gift.price;
                const isSelected = selectedId === gift.id;

                return (
                  <button
                    key={gift.id}
                    type="button"
                    disabled={!affordable || isPending}
                    onClick={() => setSelectedId(gift.id)}
                    title={
                      affordable
                        ? (gift.description ?? gift.name)
                        : `Not enough ${CURRENCY_NAME}`
                    }
                    className="flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
                    style={{
                      borderColor: isSelected
                        ? "var(--accent)"
                        : "var(--card-border)",
                      backgroundColor: isSelected
                        ? "var(--accent-soft)"
                        : "transparent",
                    }}
                  >
                    <Icon
                      size={26}
                      style={{ color: "var(--accent)" }}
                    />

                    <span className="text-sm font-semibold">
                      {gift.name}
                    </span>

                    <span className="flex items-center gap-1 text-xs opacity-70">
                      <Flame size={12} />
                      {formatCoins(gift.price)}
                    </span>
                  </button>
                );
              })}
            </div>

            {selected && (
              <div
                className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3 text-sm"
                style={{ borderColor: "var(--accent)" }}
              >
                <span>
                  Send <strong>{selected.name}</strong> for{" "}
                  {formatCoins(selected.price)} {CURRENCY_NAME}?
                </span>

                <span className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedId(null)}
                    disabled={isPending}
                    className="rounded-lg border px-3 py-1.5"
                    style={{ borderColor: "var(--card-border)" }}
                  >
                    Cancel
                  </button>

                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={isPending}
                    className="rounded-lg px-4 py-1.5 font-semibold disabled:opacity-50"
                    style={{
                      backgroundColor: "var(--button)",
                      color: "var(--button-text)",
                    }}
                  >
                    {isPending ? "Sending..." : "Send"}
                  </button>
                </span>
              </div>
            )}
          </>
        ) : !isLoggedIn ? (
          <p className="mt-4 text-sm">
            <Link
              href="/auth/login"
              className="font-semibold underline underline-offset-4"
            >
              Log in
            </Link>{" "}
            to send a gift to the author.
          </p>
        ) : (
          <p className="mt-4 text-sm opacity-70">
            Gifts from your readers will show up here.
          </p>
        )}

        {message && (
          <p className="mt-3 text-sm opacity-80">{message}</p>
        )}

        {supporters.length > 0 && (
          <div
            className="mt-5 border-t pt-4"
            style={{ borderColor: "var(--card-border)" }}
          >
            <p className="mb-2 text-xs font-medium uppercase tracking-wide opacity-60">
              Top supporters
            </p>

            <ol className="space-y-1.5 text-sm">
              {supporters.map((supporter, index) => (
                <li
                  key={supporter.senderId}
                  className="flex items-center justify-between"
                >
                  <span>
                    <span className="mr-2 opacity-50">
                      {index + 1}.
                    </span>
                    <Link
                      href={`/author/${supporter.username}`}
                      className="underline underline-offset-4"
                    >
                      {supporter.displayName ?? supporter.username}
                    </Link>
                  </span>

                  <span className="flex items-center gap-1 opacity-70">
                    <Flame size={12} />
                    {formatCoins(supporter.total)}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </section>
  );
}