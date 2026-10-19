"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Flame, Zap } from "lucide-react";
import {
  buyCosmetic,
  equipCosmetic,
  type CosmeticItem,
  type CosmeticSlot,
} from "@/app/shop/actions";
import FramedAvatar from "@/components/cosmetics/FramedAvatar";
import StyledName from "@/components/cosmetics/StyledName";
import { SPARK_NAME, formatCoins } from "@/lib/currency";

export type CosmeticsData = {
  items: CosmeticItem[];
  owned: string[];
  equipped: Partial<Record<CosmeticSlot, string>>;
  realm: number;
  path: "qi" | "mana" | null;
};

const TABS: { slot: CosmeticSlot; label: string; blurb: string }[] = [
  {
    slot: "frame",
    label: "Avatar frames",
    blurb: "A ring around your picture on your profile and in follower lists.",
  },
  {
    slot: "name_color",
    label: "Name colours",
    blurb: "Your name in colour, everywhere it appears.",
  },
  {
    slot: "title",
    label: "Titles",
    blurb: "A line of text beside your name. Some need a realm or a path.",
  },
  {
    slot: "flame",
    label: "Flame styles",
    blurb: "The colour of the flame on your streak.",
  },
];

type Props = {
  data: CosmeticsData;
  sparks: number;
  embers: number;
  onMessage: (text: string) => void;
};

function requirement(item: CosmeticItem, data: CosmeticsData) {
  if (item.required_path && data.path !== item.required_path) {
    return `${item.required_path === "qi" ? "Qi" : "Mana"} path only`;
  }

  if (item.min_realm && data.realm < item.min_realm) {
    return `Needs Realm ${item.min_realm}`;
  }

  return null;
}

function Preview({ item }: { item: CosmeticItem }) {
  const style = item.style;

  if (item.slot === "frame") {
    return (
      <FramedAvatar
        alt=""
        size={64}
        frame={{ slug: item.slug, name: item.name, style }}
        fallback="🙂"
      />
    );
  }

  if (item.slot === "name_color") {
    return (
      <span className="text-lg font-semibold">
        <StyledName
          name="Your name"
          nameColor={{ slug: item.slug, name: item.name, style }}
        />
      </span>
    );
  }

  if (item.slot === "title") {
    return (
      <span className="text-sm">
        Your name
        <span className="ml-2 text-xs italic opacity-70">
          {item.name}
        </span>
      </span>
    );
  }

  const color = typeof style.color === "string" ? style.color : "#f97316";
  const glow = typeof style.glow === "string" ? style.glow : color;

  return (
    <Flame
      size={34}
      style={{
        color,
        filter: `drop-shadow(0 0 6px ${glow})`,
      }}
    />
  );
}

export default function CosmeticsSection({
  data,
  sparks,
  embers,
  onMessage,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [slot, setSlot] = useState<CosmeticSlot>("frame");

  const owned = new Set(data.owned);
  const tab = TABS.find((t) => t.slot === slot) ?? TABS[0];
  const items = data.items.filter((item) => item.slot === slot);

  function run(action: () => Promise<string>) {
    onMessage("");

    startTransition(async () => {
      try {
        onMessage(await action());
        router.refresh();
      } catch (e) {
        onMessage(
          e instanceof Error ? e.message : "Something went wrong."
        );
      }
    });
  }

  function handleBuy(item: CosmeticItem, currency: "sparks" | "embers") {
    run(async () => {
      const result = await buyCosmetic(item.slug, currency);

      return result.equipped
        ? `${item.name} is yours, and you're wearing it.`
        : `${item.name} is yours. Wear it from here whenever you like.`;
    });
  }

  function handleEquip(item: CosmeticItem, wear: boolean) {
    run(async () => {
      await equipCosmetic(item.slot, wear ? item.slug : null);

      return wear ? `Now wearing ${item.name}.` : `${item.name} taken off.`;
    });
  }

  return (
    <section id="cosmetics" className="mt-8">
      <h2 className="mb-1 text-xl font-semibold">Cosmetics</h2>
      <p className="mb-4 text-sm opacity-60">
        Decoration only: they change how you look, never how you
        earn. Bought once, yours for good.
      </p>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.slot}
            type="button"
            onClick={() => setSlot(t.slot)}
            className="rounded-full border px-3 py-1.5 text-sm font-medium"
            style={{
              borderColor:
                t.slot === slot ? "var(--accent)" : "var(--card-border)",
              opacity: t.slot === slot ? 1 : 0.7,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      <p className="mb-4 text-xs opacity-60">{tab.blurb}</p>

      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((item) => {
          const isOwned = owned.has(item.slug);
          const isWorn = data.equipped[item.slot] === item.slug;
          const blocked = requirement(item, data);

          return (
            <div
              key={item.slug}
              className="flex flex-col rounded-xl border p-5"
              style={{
                borderColor: isWorn ? "var(--accent)" : "var(--card-border)",
                backgroundColor: "var(--card)",
              }}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-16 min-w-16 items-center justify-center">
                  <Preview item={item} />
                </div>

                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs opacity-60">
                    {isWorn
                      ? "Wearing"
                      : isOwned
                        ? "Owned"
                        : blocked ?? "Not owned"}
                  </p>
                </div>
              </div>

              <p className="mt-3 flex-1 text-sm opacity-80">
                {item.description}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                {isOwned ? (
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleEquip(item, !isWorn)}
                    className="rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                    style={{ borderColor: "var(--accent)" }}
                  >
                    {isWorn ? "Take off" : "Wear"}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={
                        isPending || !!blocked || sparks < item.spark_price
                      }
                      onClick={() => handleBuy(item, "sparks")}
                      title={blocked ?? undefined}
                      aria-label={`Buy ${item.name} for ${item.spark_price} ${SPARK_NAME}`}
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
                      disabled={
                        isPending || !!blocked || embers < item.ember_price
                      }
                      onClick={() => handleBuy(item, "embers")}
                      title={blocked ?? undefined}
                      aria-label={`Buy ${item.name} for ${item.ember_price} Embers`}
                      className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40"
                      style={{ borderColor: "var(--card-border)" }}
                    >
                      <Flame size={14} />
                      {formatCoins(item.ember_price)}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
