export const AURAFINANCE_STORAGE_KEYS = [
  'aurafinance_dark_mode',
] as const;

export type AuraFinanceStorageKey = (typeof AURAFINANCE_STORAGE_KEYS)[number];