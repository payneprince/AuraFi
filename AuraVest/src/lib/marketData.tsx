// src/lib/marketData.tsx
import { cryptoAssets, stockAssets, goldData } from './mockData';

// Track whether the mock stream has already been started.
let isCryptoFeedStarted = false;
let subscribers: ((prices: Record<string, { price: number; change24h: number }>) => void)[] = [];

// Mock NFT data - Expanded to 20+ collections
const mockNFTs = [
  { id: '1', name: 'Bored Ape Yacht Club', symbol: 'BAYC', price: 25.5, volume24h: 1250000, change24h: 2.3, image: '/nft/bayc.jpg' },
  { id: '2', name: 'CryptoPunks', symbol: 'PUNK', price: 45.2, volume24h: 890000, change24h: -1.8, image: '/nft/nft-2.jpg' },
  { id: '3', name: 'Azuki', symbol: 'BEAN', price: 12.8, volume24h: 450000, change24h: 5.1, image: '/nft/nft-3.jpg' },
  { id: '4', name: 'World of Women', symbol: 'WOW', price: 8.9, volume24h: 320000, change24h: 1.2, image: '/nft/nft-4.jpg' },
  { id: '5', name: 'Doodles', symbol: 'DOODLE', price: 6.7, volume24h: 280000, change24h: -0.5, image: '/nft/nft-5.jpg' },
  { id: '6', name: 'Clone X', symbol: 'CLONEX', price: 15.3, volume24h: 560000, change24h: 3.7, image: '/nft/nft-6.jpg' },
  { id: '7', name: 'Pudgy Penguins', symbol: 'PENGUIN', price: 4.2, volume24h: 180000, change24h: 0.8, image: '/nft/nft-7.jpg' },
  { id: '8', name: 'Art Blocks', symbol: 'BLOCKS', price: 3.1, volume24h: 95000, change24h: 1.9, image: '/nft/nft-8.jpg' },
  { id: '9', name: 'Moonbirds', symbol: 'MOON', price: 9.8, volume24h: 245000, change24h: -2.1, image: '/nft/nft-9.jpg' },
  { id: '10', name: 'Beeple Everydays', symbol: 'BEEPLE', price: 18.5, volume24h: 380000, change24h: 4.2, image: '/nft/nft-10.jpg' },
  { id: '11', name: 'Meebits', symbol: 'MEEBIT', price: 2.9, volume24h: 78000, change24h: 0.7, image: '/nft/nft-11.jpg' },
  { id: '12', name: 'World of Women Galaxy', symbol: 'WOWG', price: 5.4, volume24h: 165000, change24h: 2.8, image: '/nft/nft-12.jpg' },
  { id: '13', name: 'Invisible Friends', symbol: 'INVISIBLE', price: 7.2, volume24h: 210000, change24h: -1.4, image: '/nft/nft-13.jpg' },
  { id: '14', name: 'Otherdeed for Otherside', symbol: 'OTHER', price: 3.8, volume24h: 125000, change24h: 3.5, image: '/nft/nft-14.jpg' },
  { id: '15', name: 'Mutant Ape Yacht Club', symbol: 'MAYC', price: 11.6, volume24h: 320000, change24h: 1.6, image: '/nft/nft-15.jpg' },
  { id: '16', name: 'Bored Ape Kennel Club', symbol: 'BAKC', price: 8.9, volume24h: 195000, change24h: -0.9, image: '/nft/nft-16.jpg' },
  { id: '17', name: 'The Sandbox', symbol: 'SAND', price: 4.7, volume24h: 140000, change24h: 2.3, image: '/nft/nft-17.jpg' },
  { id: '18', name: 'Decentraland', symbol: 'MANA', price: 2.1, volume24h: 85000, change24h: 1.1, image: '/nft/nft-18.jpg' },
  { id: '19', name: 'Axie Infinity', symbol: 'AXIE', price: 6.3, volume24h: 175000, change24h: -1.7, image: '/nft/nft-19.jpg' },
  { id: '20', name: 'Illuvium', symbol: 'ILV', price: 85.4, volume24h: 420000, change24h: 5.8, image: '/nft/nft-20.jpg' },
  { id: '21', name: 'Gala Games', symbol: 'GALA', price: 0.15, volume24h: 65000, change24h: 3.2, image: '/nft/nft-21.jpg' },
  { id: '22', name: 'Enjin Coin', symbol: 'ENJ', price: 1.8, volume24h: 92000, change24h: 0.4, image: '/nft/nft-22.jpg' },
  { id: '23', name: 'The Graph', symbol: 'GRT', price: 0.45, volume24h: 135000, change24h: -2.5, image: '/nft/nft-23.jpg' },
];

export function startCryptoWebSocket() {
  if (isCryptoFeedStarted) return;
  isCryptoFeedStarted = true;

  // Mock WebSocket - simulate price updates
  setInterval(() => {
    const livePrices: Record<string, { price: number; change24h: number }> = {};
    cryptoAssets.forEach(asset => {
      const change = (Math.random() - 0.5) * 0.1; // Random change between -5% and +5%
      livePrices[asset.symbol] = {
        price: asset.price * (1 + change),
        change24h: change * 100,
      };
    });

    subscribers.forEach(callback => callback(livePrices));
  }, 5000); // Update every 5 seconds
}

export function subscribeToCrypto(callback: (prices: Record<string, { price: number; change24h: number }>) => void) {
  subscribers.push(callback);
  return () => {
    subscribers = subscribers.filter(sub => sub !== callback);
  };
}

export async function getCryptoPage(page: number): Promise<any[]> {
  // Simulate pagination - return 10 items per page
  const startIndex = (page - 1) * 10;
  const endIndex = startIndex + 10;
  return cryptoAssets.slice(startIndex, endIndex);
}

export async function getStocksPage(page: number): Promise<any[]> {
  // Simulate pagination - return 10 items per page
  const startIndex = (page - 1) * 10;
  const endIndex = startIndex + 10;
  return stockAssets.slice(startIndex, endIndex);
}

export async function getGoldList(): Promise<any[]> {
  return [
    {
      id: 'gold-spot-gram',
      name: 'Gold Spot (per gram)',
      symbol: 'GOLD',
      price: goldData.pricePerGram,
      change24h: goldData.change24h,
      type: 'physical',
      purity: '24K',
      unit: 'gram',
      image: '🥇',
    },
    {
      id: 'gold-spot-ounce',
      name: 'Gold Spot (per ounce)',
      symbol: 'XAU',
      price: goldData.pricePerOunce,
      change24h: goldData.change24h,
      type: 'physical',
      purity: '24K',
      unit: 'ounce',
      image: '🏆',
    },
    {
      id: 'gold-18k-gram',
      name: 'Gold 18K (per gram)',
      symbol: 'GOLD18K',
      price: goldData.pricePerGram * 0.75, // 18K is 75% pure gold
      change24h: goldData.change24h,
      type: 'physical',
      purity: '18K',
      unit: 'gram',
      image: '💍',
    },
    {
      id: 'gold-18k-ounce',
      name: 'Gold 18K (per ounce)',
      symbol: 'XAU18K',
      price: goldData.pricePerOunce * 0.75,
      change24h: goldData.change24h,
      type: 'physical',
      purity: '18K',
      unit: 'ounce',
      image: '💎',
    },
    {
      id: 'gold-etf',
      name: 'SPDR Gold Shares ETF',
      symbol: 'GLD',
      price: 185.50,
      change24h: 1.2,
      type: 'digital',
      purity: '24K',
      unit: 'share',
      image: '📈',
    },
    {
      id: 'gold-digital-gram',
      name: 'Digital Gold (per gram)',
      symbol: 'DGOLD',
      price: goldData.pricePerGram * 1.02, // Slight premium for digital
      change24h: goldData.change24h,
      type: 'digital',
      purity: '24K',
      unit: 'gram',
      image: '💰',
    },
    {
      id: 'gold-digital-ounce',
      name: 'Digital Gold (per ounce)',
      symbol: 'DXAU',
      price: goldData.pricePerOunce * 1.02,
      change24h: goldData.change24h,
      type: 'digital',
      purity: '24K',
      unit: 'ounce',
      image: '🪙',
    },
  ];
}

export async function getNFTList(): Promise<any[]> {
  return mockNFTs;
}
