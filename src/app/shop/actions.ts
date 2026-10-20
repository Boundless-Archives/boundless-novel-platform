"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createAdminClient } from "@/utils/supabase/admin";
import { requireFeature } from "@/lib/platform";

/*
 * Everything here works on the logged-in user only: the user id always
 * comes from the session, never from the caller, so none of these can
 * be pointed at somebody else's wallet.
 */

async function requireUser() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("You must be logged in.");
  }

  return { supabase, user };
}

export type ShopItem = {
  slug: string;
  name: string;
  description: string;
  icon: string;
  kind: "streak_freeze" | "xp_booster";
  spark_price: number;
  ember_price: number;
  max_held: number | null;
  boost_percent: number | null;
  boost_minutes: number | null;
};

export type RestoreOffer = {
  streak_type: "reader" | "writer";
  broken_streak: number;
  spark_price: number;
  ember_price: number;
  expires_at: string;
};

export async function getShopData() {
  const { supabase, user } = await requireUser();

  const adminClient = createAdminClient();

  const [
    { data: items },
    { data: wallet },
    { data: owned },
    { data: boosters },
    { data: offers },
  ] = await Promise.all([
    supabase
      .from("shop_items")
      .select(
        "slug, name, description, icon, kind, spark_price, ember_price, max_held, boost_percent, boost_minutes"
      )
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("wallets")
      .select("balance, spark_balance")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("user_items")
      .select("item_slug, quantity")
      .eq("user_id", user.id),
    supabase
      .from("active_boosters")
      .select("item_slug, percent, expires_at")
      .eq("user_id", user.id)
      .gt("expires_at", new Date().toISOString())
      .order("percent", { ascending: false })
      .limit(1),
    adminClient.rpc("restore_offers", { p_user: user.id }),
  ]);

  const shopItems = (items ?? []) as ShopItem[];

  const inventory: Record<string, number> = {};

  for (const row of owned ?? []) {
    inventory[row.item_slug] = row.quantity;
  }

  const booster = boosters?.[0] ?? null;

  return {
    items: shopItems,
    embers: (wallet?.balance as number) ?? 0,
    sparks: (wallet?.spark_balance as number) ?? 0,
    inventory,
    restoreOffers: (offers ?? []) as RestoreOffer[],
    activeBooster: booster
      ? {
          name:
            shopItems.find((i) => i.slug === booster.item_slug)
              ?.name ?? "Booster",
          percent: booster.percent as number,
          expiresAt: booster.expires_at as string,
        }
      : null,
  };
}

export async function buyShopItem(
  slug: string,
  currency: "sparks" | "embers",
  quantity = 1
) {
  const { user } = await requireUser();
  await requireFeature("shop", user.id);

  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error("That item is not available.");
  }

  if (currency !== "sparks" && currency !== "embers") {
    throw new Error("Unknown currency.");
  }

  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    throw new Error("Enter a valid quantity.");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("buy_shop_item", {
      p_user_id: user.id,
      p_slug: slug,
      p_currency: currency,
      p_qty: quantity,
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/shop");
  revalidatePath("/wallet");

  const result = data as {
    new_quantity: number;
    new_spark_balance: number;
    new_ember_balance: number;
  };

  return {
    quantity: result.new_quantity,
    sparks: result.new_spark_balance,
    embers: result.new_ember_balance,
  };
}

export async function exchangeEmbersForSparks(embers: number) {
  const { user } = await requireUser();
  await requireFeature("shop", user.id);

  if (!Number.isInteger(embers) || embers < 1 || embers > 100000) {
    throw new Error("Enter a valid amount.");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("buy_sparks_with_embers", {
      p_user_id: user.id,
      p_embers: embers,
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/shop");
  revalidatePath("/wallet");

  const result = data as {
    new_ember_balance: number;
    new_spark_balance: number;
    sparks_gained: number;
  };

  return {
    embers: result.new_ember_balance,
    sparks: result.new_spark_balance,
    gained: result.sparks_gained,
  };
}

export async function activateBooster(slug: string) {
  const { user } = await requireUser();
  await requireFeature("shop", user.id);

  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error("That is not a booster.");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("use_booster", {
      p_user_id: user.id,
      p_slug: slug,
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/shop");

  const result = data as { percent: number; expires_at: string };

  return {
    percent: result.percent,
    expiresAt: result.expires_at,
  };
}

/*
 * Bring back a streak that broke in the last 3 days (7+ days long, once
 * per 30 days per streak). The database checks every rule and takes the
 * payment in one step.
 */
export async function restoreStreak(
  streakType: "reader" | "writer",
  currency: "sparks" | "embers"
) {
  const { user } = await requireUser();
  await requireFeature("shop", user.id);

  if (streakType !== "reader" && streakType !== "writer") {
    throw new Error("Unknown streak.");
  }

  if (currency !== "sparks" && currency !== "embers") {
    throw new Error("Unknown currency.");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("restore_streak", {
      p_user: user.id,
      p_type: streakType,
      p_currency: currency,
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/shop");
  revalidatePath("/wallet");
  revalidatePath("/profile");

  const result = data as {
    new_streak: number;
    price: number;
    new_spark_balance: number;
    new_ember_balance: number;
  };

  return {
    streak: result.new_streak,
    sparks: result.new_spark_balance,
    embers: result.new_ember_balance,
  };
}


/* ------------------------------------------------------------------ */
/* Cosmetics                                                          */
/* ------------------------------------------------------------------ */

export type CosmeticSlot = "frame" | "name_color" | "title" | "flame";

export type CosmeticItem = {
  slug: string;
  slot: CosmeticSlot;
  name: string;
  description: string;
  style: Record<string, unknown>;
  spark_price: number;
  ember_price: number;
  min_realm: number | null;
  required_path: "qi" | "mana" | null;
};

export async function getCosmeticsData() {
  const { supabase, user } = await requireUser();

  const [
    { data: items },
    { data: owned },
    { data: equipped },
    { data: cultivation },
  ] = await Promise.all([
    supabase
      .from("cosmetics")
      .select(
        "slug, slot, name, description, style, spark_price, ember_price, min_realm, required_path"
      )
      .eq("is_active", true)
      .order("sort_order"),
    supabase
      .from("user_cosmetics")
      .select("slug")
      .eq("user_id", user.id),
    supabase
      .from("equipped_cosmetics")
      .select("slot, slug")
      .eq("user_id", user.id),
    supabase
      .from("cultivation_profiles")
      .select("path, current_major")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const equippedBySlot: Partial<Record<CosmeticSlot, string>> = {};

  for (const row of equipped ?? []) {
    equippedBySlot[row.slot as CosmeticSlot] = row.slug as string;
  }

  return {
    items: (items ?? []) as CosmeticItem[],
    owned: (owned ?? []).map((row) => row.slug as string),
    equipped: equippedBySlot,
    realm: (cultivation?.current_major as number | undefined) ?? 0,
    path: (cultivation?.path as "qi" | "mana" | undefined) ?? null,
  };
}

export async function buyCosmetic(
  slug: string,
  currency: "sparks" | "embers"
) {
  const { user } = await requireUser();
  await requireFeature("shop", user.id);

  if (typeof slug !== "string" || slug.length === 0) {
    throw new Error("That item is not available.");
  }

  if (currency !== "sparks" && currency !== "embers") {
    throw new Error("Unknown currency.");
  }

  const adminClient = createAdminClient();

  const { data, error } = await adminClient
    .rpc("buy_cosmetic", {
      p_user: user.id,
      p_slug: slug,
      p_currency: currency,
    })
    .single();

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/shop");
  revalidatePath("/wallet");
  revalidatePath("/profile");

  const result = data as {
    new_spark_balance: number;
    new_ember_balance: number;
    equipped: boolean;
  };

  return {
    sparks: result.new_spark_balance,
    embers: result.new_ember_balance,
    equipped: result.equipped,
  };
}

/* Wear something you own, or pass null to take the slot off. */
export async function equipCosmetic(
  slot: CosmeticSlot,
  slug: string | null
) {
  const { user } = await requireUser();

  if (!["frame", "name_color", "title", "flame"].includes(slot)) {
    throw new Error("Unknown slot.");
  }

  if (slug !== null && (typeof slug !== "string" || slug.length === 0)) {
    throw new Error("That is not an item.");
  }

  const adminClient = createAdminClient();

  const { error } = await adminClient.rpc("equip_cosmetic", {
    p_user: user.id,
    p_slot: slot,
    p_slug: slug,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/shop");
  revalidatePath("/profile");
}
