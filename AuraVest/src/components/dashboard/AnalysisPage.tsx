'use client';

import { useState, useEffect } from 'react';
import { Search, TrendingUp, TrendingDown } from 'lucide-react';
import TechnicalAnalysisChart from '@/components/TechnicalAnalysisChart';
import { getCryptoPage } from '@/lib/marketData';

export default function AnalysisPage() {
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [cryptoAssets, setCryptoAssets] = useState<any[]>([]);

  // Load crypto assets for selection
  useEffect(() => {
    getCryptoPage(1).then(setCryptoAssets);
  }, []);

  const filteredAssets = cryptoAssets.filter(
    (asset) =>
      asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      asset.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (selectedAsset) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedAsset(null)}
            className="flex items-center gap-2 px-4 py-2 bg-muted rounded-lg hover:bg-accent transition-colors"
          >
            ← Back to Assets
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
              {selectedAsset.symbol.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-xl font-bold">{selectedAsset.name}</h2>
              <p className="text-muted-foreground">{selectedAsset.symbol}</p>
            </div>
          </div>
        </div>

        <TechnicalAnalysisChart asset={selectedAsset} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Technical Analysis</h1>
        <p className="text-muted-foreground">
          Advanced charting with technical indicators and analysis tools
        </p>
      </div>

      {/* Asset Selection */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search assets for analysis..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-card border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAssets.slice(0, 12).map((asset) => {
          const isPositive = asset.change24h >= 0;
          return (
            <div
              key={asset.id}
              onClick={() => setSelectedAsset(asset)}
              className="bg-card border border-border rounded-lg p-4 hover:bg-accent transition-all hover:scale-105 cursor-pointer"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                    {asset.symbol.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-semibold">{asset.name}</p>
                    <p className="text-sm text-muted-foreground">{asset.symbol}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${asset.price.toLocaleString()}</p>
                  <p className={`text-sm ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{asset.change24h.toFixed(2)}%
                  </p>
                </div>
              </div>

              <button className="w-full py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Analyze Chart
              </button>
            </div>
          );
        })}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          No assets found matching "{searchQuery}"
        </div>
      )}

      {/* Features Preview */}
      <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-xl p-6 border border-border">
        <h3 className="text-xl font-semibold mb-4 text-center">Advanced Analysis Features</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              📊
            </div>
            <h4 className="font-semibold mb-2">Technical Indicators</h4>
            <p className="text-sm text-muted-foreground">
              RSI, MACD, Bollinger Bands, Moving Averages, and more
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              📈
            </div>
            <h4 className="font-semibold mb-2">Multiple Timeframes</h4>
            <p className="text-sm text-muted-foreground">
              From 1 minute to 1 day charts for detailed analysis
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
              🎨
            </div>
            <h4 className="font-semibold mb-2">Drawing Tools</h4>
            <p className="text-sm text-muted-foreground">
              Trend lines, support/resistance, Fibonacci retracements
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
