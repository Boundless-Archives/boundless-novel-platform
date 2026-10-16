export const CURRENCY_NAME = "Embers";
export const CURRENCY_NAME_SINGULAR = "Ember";

// Sparks: the free, in-app-only currency. Earned in the app, spent in the
// Spark Shop, never gifted or withdrawn.
export const SPARK_NAME = "Sparks";
export const SPARK_NAME_SINGULAR = "Spark";

// How many Sparks one Ember buys. Must match public.sparks_per_ember()
// in the database.
export const SPARKS_PER_EMBER = 10;

export const AD_REWARD_AMOUNT = 10;
export const MAX_ADS_PER_WINDOW = 5;
export const AD_COOLDOWN_HOURS = 6;
export const OFFERWALL_MAX_POINTS_PER_CONVERSION = 100000;

export function formatCoins(amount: number): string {
  return amount.toLocaleString();
}