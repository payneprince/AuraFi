export const getAuraWalletStorageKeys = (userId: string) => {
  const normalizedUserId = String(userId || '1');
  return [
    `aurawallet_state_${normalizedUserId}`,
    `aurawallet_saved_recipients_${normalizedUserId}`,
    `aurawallet_scheduled_transfers_${normalizedUserId}`,
    'aurawallet_theme',
  ] as const;
};

export type AuraWalletStorageKey = ReturnType<typeof getAuraWalletStorageKeys>[number];