import { createClient } from "@/utils/supabase/server";

/*
 * Cosmetics: avatar frames, name colours, profile titles and streak
 * flame styles. What a user is wearing is public (everyone who sees
 * their profile, comments or follower lists needs it), so reading it
 * needs no special access.
 */

export type CosmeticSlot = "frame" | "name_color" | "title" | "flame";

export type Cosmetic = {
  slug: string;
  name: string;
  style: Record<string, unknown>;
};

export type Loadout = Partial<Record<CosmeticSlot, Cosmetic>>;

type EquippedRow = {
  user_id: string;
  slot: CosmeticSlot;
  cosmetics: Cosmetic | Cosmetic[] | null;
};

/*
 * What each of these users is wearing, in one query. Users who wear
 * nothing are simply missing from the map (use `.get(id) ?? {}`).
 */
export async function getEquippedFor(
  userIds: string[]
): Promise<Map<string, Loadout>> {
  const result = new Map<string, Loadout>();

  const ids = [...new Set(userIds.filter(Boolean))];

  if (ids.length === 0) return result;

  try {
    const supabase = await createClient();

    const { data } = await supabase
      .from("equipped_cosmetics")
      .select("user_id, slot, cosmetics ( slug, name, style )")
      .in("user_id", ids);

    for (const row of (data ?? []) as unknown as EquippedRow[]) {
      const item = Array.isArray(row.cosmetics)
        ? row.cosmetics[0]
        : row.cosmetics;

      if (!item) continue;

      const loadout = result.get(row.user_id) ?? {};
      loadout[row.slot] = item;
      result.set(row.user_id, loadout);
    }
  } catch {
    // Cosmetics are decoration: never let them break a page.
  }

  return result;
}
