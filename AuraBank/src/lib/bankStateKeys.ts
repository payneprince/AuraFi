export const AURABANK_STORAGE_KEYS = [
  'aurabank_user',
  'aurabank_accounts',
  'aurabank_transactions',
  'aurabank_cards',
  'aurabank_bills',
  'aurabank_budgets',
  'aurabank_notifications',
  'aurabank_recurring',
  'aurabank_sound',
  'aurabank_theme',
] as const;

export type AuraBankStorageKey = (typeof AURABANK_STORAGE_KEYS)[number];