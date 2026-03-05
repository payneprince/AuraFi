export type WalletSection = 'overview' | 'send' | 'portfolio' | 'settings';

export interface WalletNavItem {
	id: WalletSection;
	label: string;
	icon: any;
}
