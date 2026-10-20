import { unstable_cache } from "next/cache";
import { createAdminClient } from "@/utils/supabase/admin";

/*
 * Platform settings that are safe to show anyone. Read through a database
 * function (get_public_settings) and cached for a short while, so the
 * layout doesn't hit the database on every request. Saving the settings
 * page refreshes this cache straight away (tag: PLATFORM_SETTINGS_TAG).
 */

export const PLATFORM_SETTINGS_TAG = "platform-settings";

export type PublicSettings = {
  platform_name: string;
  platform_description: string;
  support_email: string | null;
  allow_new_registrations: boolean;
  allow_author_applications: boolean;
  maintenance_mode: boolean;
  maintenance_message: string | null;
  maintenance_eta: string | null;
  read_only_mode: boolean;
  comments_enabled: boolean;
  reviews_enabled: boolean;
  gifts_enabled: boolean;
  shop_enabled: boolean;
  quests_enabled: boolean;
  sparks_multiplier: number;
  sparks_multiplier_ends_at: string | null;
};

export const DEFAULT_SETTINGS: PublicSettings = {
  platform_name: "Boundless Archive",
  platform_description:
    "Discover, read, and share original stories, novels, and web serials without limits.",
  support_email: null,
  allow_new_registrations: true,
  allow_author_applications: true,
  maintenance_mode: false,
  maintenance_message: null,
  maintenance_eta: null,
  read_only_mode: false,
  comments_enabled: true,
  reviews_enabled: true,
  gifts_enabled: true,
  shop_enabled: true,
  quests_enabled: true,
  sparks_multiplier: 1,
  sparks_multiplier_ends_at: null,
};

export const getPublicSettings = unstable_cache(
  async (): Promise<PublicSettings> => {
    try {
      const { data, error } = await createAdminClient().rpc(
        "get_public_settings"
      );

      if (error || !data) return DEFAULT_SETTINGS;

      const raw = data as Partial<PublicSettings>;

      return {
        ...DEFAULT_SETTINGS,
        ...raw,
        platform_name:
          raw.platform_name?.trim() || DEFAULT_SETTINGS.platform_name,
        platform_description:
          raw.platform_description?.trim() ||
          DEFAULT_SETTINGS.platform_description,
        sparks_multiplier: Number(raw.sparks_multiplier ?? 1) || 1,
      };
    } catch {
      // If settings can't be read, keep the site up rather than lock it.
      return DEFAULT_SETTINGS;
    }
  },
  ["public-platform-settings"],
  { revalidate: 30, tags: [PLATFORM_SETTINGS_TAG] }
);

export type Feature =
  | "comments"
  | "reviews"
  | "gifts"
  | "shop"
  | "quests"
  | "author_applications";

/*
 * For server actions that touch a feature: returns a message when the
 * action is not allowed right now, otherwise null. Admins are never
 * blocked. Pass the signed-in user's id.
 */
export async function featureBlock(
  feature: Feature,
  userId: string
): Promise<string | null> {
  const s = await getPublicSettings();

  let message: string | null = null;

  if (s.maintenance_mode) {
    message = "The site is under maintenance right now.";
  } else if (
    s.read_only_mode &&
    (feature === "gifts" || feature === "shop")
  ) {
    message = "The site is read-only right now. Please try again later.";
  } else if (feature === "comments" && !s.comments_enabled) {
    message = "Comments are paused right now.";
  } else if (feature === "reviews" && !s.reviews_enabled) {
    message = "Reviews are paused right now.";
  } else if (feature === "gifts" && !s.gifts_enabled) {
    message = "Gifting is paused right now.";
  } else if (feature === "shop" && !s.shop_enabled) {
    message = "The shop is closed right now.";
  } else if (feature === "quests" && !s.quests_enabled) {
    message = "Quests are paused right now.";
  } else if (
    feature === "author_applications" &&
    !s.allow_author_applications
  ) {
    message = "Author applications are closed right now.";
  }

  if (!message) return null;

  const { data } = await createAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (data?.role === "admin" || data?.role === "superadmin") return null;

  return message;
}

/* Throws when the feature is paused. Use inside server actions. */
export async function requireFeature(feature: Feature, userId: string) {
  const message = await featureBlock(feature, userId);
  if (message) throw new Error(message);
}

export async function isAdminUser(userId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  return data?.role === "admin" || data?.role === "superadmin";
}
