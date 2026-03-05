import { Home, Send, PieChart, Settings } from 'lucide-react';
import type { WalletNavItem, WalletSection } from '@/components/dashboard/types';

export const walletNavItems: WalletNavItem[] = [
  { id: 'overview', label: 'Home', icon: Home },
  { id: 'send', label: 'Send', icon: Send },
  { id: 'portfolio', label: 'Portfolio', icon: PieChart },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export const walletSectionTitles: Record<WalletSection, string> = {
  overview: 'Home',
  send: 'Send Money',
  portfolio: 'Portfolio',
  settings: 'Settings',
};
