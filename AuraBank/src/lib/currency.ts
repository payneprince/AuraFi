import type { Currency } from '@/types';

// Mock exchange rates (relative to USD)
const EXCHANGE_RATES: Record<Currency, number> = {
  USD: 1,
  EUR: 0.93,
  GHS: 10.5,
};

export const getCurrencySymbol = (currency: Currency): string => {
  switch (currency) {
    case 'USD': return '$';
    case 'EUR': return '€';
    case 'GHS': return '₵';
    default: return '';
  }
};

export const formatCurrency = (amount: number, currency: Currency): string => {
  return `${getCurrencySymbol(currency)}${new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(amount))}`;
};

export const convertCurrency = (amount: number, from: Currency, to: Currency): number => {
  if (from === to) return amount;
  const usdValue = amount / EXCHANGE_RATES[from];
  return usdValue * EXCHANGE_RATES[to];
};

export const getConversionRateString = (from: Currency, to: Currency): string => {
  if (from === to) return '1:1';
  const rate = convertCurrency(1, from, to);
  return `1 ${from} = ${rate.toFixed(4)} ${to}`;
};