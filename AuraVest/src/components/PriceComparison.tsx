'use client';

import { useState } from 'react';
import { RefreshCw, ArrowRight } from 'lucide-react';

interface Asset {
  name: string;
  symbol: string;
  price: number;
  change24h: number;
  image?: string;
}

interface PriceComparisonProps {
  assets: Asset[];
}

export default function PriceComparison({ assets }: PriceComparisonProps) {
  const [asset1, setAsset1] = useState(assets[0]);
  const [asset2, setAsset2] = useState(assets[1]);
  const [flipping, setFlipping] = useState(false);

  const handleFlip = () => {
    setFlipping(true);
    setTimeout(() => {
      const temp = asset1;
      setAsset1(asset2);
      setAsset2(temp);
      setFlipping(false);
    }, 300);
  };

  const priceDiff = ((asset2.price / asset1.price - 1) * 100).toFixed(2);
  const isPriceDiffPositive = Number(priceDiff) >= 0;

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold text-lg mb-4">Price Comparison</h3>

      <div className="grid grid-cols-2 gap-4 mb-4">
        {/* Asset 1 Card */}
        <div
          className={`bg-gradient-to-br from-purple-500/10 to-blue-500/10 border border-primary/20 rounded-lg p-4 transition-all duration-300 ${
            flipping ? 'animate-flip' : ''
          }`}
        >
          <select
            value={asset1.symbol}
            onChange={(e) => {
              const selected = assets.find(a => a.symbol === e.target.value);
              if (selected) setAsset1(selected);
            }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {assets.map((asset) => (
              <option key={asset.symbol} value={asset.symbol}>
                {asset.name}
              </option>
            ))}
          </select>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold mx-auto mb-2">
              {asset1.image || asset1.symbol.slice(0, 2)}
            </div>
            <p className="text-2xl font-bold mb-1">${asset1.price.toLocaleString()}</p>
            <p className={`text-sm ${asset1.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {asset1.change24h >= 0 ? '+' : ''}{asset1.change24h}%
            </p>
          </div>
        </div>

        {/* Asset 2 Card */}
        <div
          className={`bg-gradient-to-br from-cyan-500/10 to-green-500/10 border border-cyan-500/20 rounded-lg p-4 transition-all duration-300 ${
            flipping ? 'animate-flip' : ''
          }`}
        >
          <select
            value={asset2.symbol}
            onChange={(e) => {
              const selected = assets.find(a => a.symbol === e.target.value);
              if (selected) setAsset2(selected);
            }}
            className="w-full bg-background border border-border rounded-lg px-3 py-2 mb-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            {assets.map((asset) => (
              <option key={asset.symbol} value={asset.symbol}>
                {asset.name}
              </option>
            ))}
          </select>

          <div className="text-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-green-500 flex items-center justify-center text-white font-bold mx-auto mb-2">
              {asset2.image || asset2.symbol.slice(0, 2)}
            </div>
            <p className="text-2xl font-bold mb-1">${asset2.price.toLocaleString()}</p>
            <p className={`text-sm ${asset2.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {asset2.change24h >= 0 ? '+' : ''}{asset2.change24h}%
            </p>
          </div>
        </div>
      </div>

      {/* Comparison Stats */}
      <div className="bg-muted rounded-lg p-4 mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Price Ratio</span>
          <span className="font-semibold">1 {asset1.symbol} = {(asset2.price / asset1.price).toFixed(6)} {asset2.symbol}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Price Difference</span>
          <span className={`font-semibold ${isPriceDiffPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPriceDiffPositive ? '+' : ''}{priceDiff}%
          </span>
        </div>
      </div>

      <button
        onClick={handleFlip}
        className="w-full flex items-center justify-center gap-2 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        <RefreshCw className={`w-4 h-4 ${flipping ? 'animate-spin' : ''}`} />
        Swap Assets
      </button>
    </div>
  );
}
