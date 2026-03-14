export const AURAVEST_STORAGE_KEYS = [
  'auravest_user',
  'auravest_portfolio',
  'auravest_transactions',
  'auravest_trade_holdings',
  'auravest_cash_balance',
  'auravest_cash_starting_balance',
  'auravest_local_positions',
  'auravest_watchlist',
  'auravest_dca',
  'auravest_alerts',
  'auravest_notifications',
  'auravest_dark_mode',
] as const;

export type AuraVestStorageKey = (typeof AURAVEST_STORAGE_KEYS)[number];