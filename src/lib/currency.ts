export const CURRENCY_NAME = "Embers";
export const CURRENCY_NAME_SINGULAR = "Ember";

export const AD_REWARD_AMOUNT = 10;
export const MAX_ADS_PER_WINDOW = 5;
export const AD_COOLDOWN_HOURS = 6;

export function formatCoins(amount: number): string {
  return amount.toLocaleString();
}