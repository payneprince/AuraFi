// src/components/AssetDetailsModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { X, TrendingUp, TrendingDown, BarChart3, RotateCcw } from 'lucide-react';
import TransactionSuccessModal from '@/components/TransactionSuccessModal';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend
);

export default function AssetDetailsModal({ asset, onClose, onTrade }: any) {
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successTransaction, setSuccessTransaction] = useState<any>(null);
  const [tradeHoldings, setTradeHoldings] = useState<any[]>([]);
  const [now, setNow] = useState(new Date());

  const isPositive = asset.change24h >= 0;
  const isLocalGhanaStock = asset?.exchange === 'GSE' || asset?.currency === 'GHS';
  const isLogoImage = typeof asset?.image === 'string' && asset.image.startsWith('/logos/');
  const currencyPrefix = isLocalGhanaStock ? 'GHS ' : '$';

  useEffect(() => {
    const savedTradeHoldings = JSON.parse(localStorage.getItem('auravest_trade_holdings') || '[]');
    setTradeHoldings(savedTradeHoldings);
  }, [asset?.symbol]);

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const currentPrice = typeof asset?.price === 'number' ? asset.price : 0;
  const absolutePriceChange = (currentPrice * Number(asset?.change24h || 0)) / 100;
  const dayLow = currentPrice * (isPositive ? 0.985 : 0.965);
  const dayHigh = currentPrice * (isPositive ? 1.035 : 1.015);

  const currentPosition = useMemo(() => {
    if (!asset?.symbol) return null;
    return tradeHoldings.find((holding: any) => holding.symbol === asset.symbol && Number(holding.amount || 0) > 0) || null;
  }, [tradeHoldings, asset?.symbol]);

  const positionTotalValue = currentPosition ? Number(currentPosition.amount || 0) * currentPrice : 0;
  const positionCostBasis = currentPosition ? Number(currentPosition.costBasis || 0) : 0;
  const positionPnL = positionTotalValue - positionCostBasis;
  const positionPnLPercent = positionCostBasis > 0 ? (positionPnL / positionCostBasis) * 100 : 0;
  const hasPosition = !!currentPosition;

  const ghanaDay = now.getUTCDay();
  const ghanaMinutes = (now.getUTCHours() * 60) + now.getUTCMinutes();
  const gseOpenMinutes = 10 * 60;
  const gseCloseMinutes = 15 * 60;
  const isWeekday = ghanaDay >= 1 && ghanaDay <= 5;
  const isGseOpen = isWeekday && ghanaMinutes >= gseOpenMinutes && ghanaMinutes < gseCloseMinutes;
  const ghanaTimestamp = now.toLocaleString('en-GB', {
    timeZone: 'Africa/Accra',
    month: 'short',
    day: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" 
      onClick={onClose}
    >
      <div 
        className="bg-card border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-auto animate-slideIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold overflow-hidden ${isLogoImage ? 'bg-transparent' : 'bg-gradient-to-br from-purple-500 to-blue-500'}`}>
              {asset.image?.startsWith('/nft/') || asset.image?.startsWith('/logos/') ? (
                <img
                  src={asset.image}
                  alt={asset.symbol}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                    if (fallback) fallback.style.display = 'flex';
                  }}
                />
              ) : (
                asset.image
                  ? typeof asset.image === 'string' && asset.image.length <= 3
                    ? asset.image
                    : asset.symbol?.slice(0, 2)
                  : asset.symbol?.slice(0, 2) || '??'
              )}
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold hidden">
                {asset.symbol?.slice(0, 2) || '??'}
              </div>
            </div>
            <div>
              <h2 className="font-bold text-lg">{asset.name || asset.symbol}</h2>
              <p className="text-sm text-muted-foreground">{asset.symbol}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Price & Change */}
          <div className="bg-gradient-to-br from-primary/5 to-blue-500/5 rounded-lg p-6">
            <div className="flex items-end justify-between mb-4">
              <div className="flex items-end gap-2">
                <h3 className="text-4xl font-bold">
                  {currencyPrefix}{typeof asset.price === 'number' ? asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—'}
                </h3>
                <span 
                  className="w-2 h-2 rounded-full bg-green-500 animate-pulse"
                  title="Live price"
                />
              </div>
              <div 
                className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
                  isPositive 
                    ? 'bg-green-500/10 text-green-500' 
                    : 'bg-red-500/10 text-red-500'
                }`}
              >
                {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                <span>
                  {isPositive ? '+' : ''}
                  {typeof asset.change24h === 'number' 
                    ? asset.change24h.toFixed(2) 
                    : '—'}%
                </span>
              </div>
            </div>

            {isLocalGhanaStock && (
              <div className="mb-4">
                <div className={`flex items-center gap-2 text-sm ${isGseOpen ? 'text-green-500' : 'text-red-500'}`}>
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isGseOpen ? 'bg-green-500' : 'bg-red-500'}`} />
                  <span className="font-semibold">
                    {isGseOpen ? 'MARKET OPEN • CLOSES AT 3:00 PM GMT' : 'MARKET CLOSED • OPENS AT 10:00 AM GMT'}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">{ghanaTimestamp} GMT</p>
              </div>
            )}

            {/* Stats */}
            {isLocalGhanaStock ? (
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Period Change</p>
                  <p className={`text-xl font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                    {isPositive ? '+' : ''}{typeof asset.change24h === 'number' ? asset.change24h.toFixed(2) : '0.00'}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Price Change</p>
                  <p className={`text-xl font-bold ${absolutePriceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {absolutePriceChange >= 0 ? '+' : '-'}{currencyPrefix}{Math.abs(absolutePriceChange).toFixed(2)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">High - Low</p>
                  <p className="text-base md:text-lg font-semibold whitespace-nowrap">{currencyPrefix}{dayHigh.toFixed(2)} - {currencyPrefix}{dayLow.toFixed(2)}</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Market Cap</p>
                  <p className="text-xl font-bold">
                    {asset.marketCap && typeof asset.marketCap === 'number'
                      ? `$${(asset.marketCap / 1e9).toFixed(2)}B`
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">24h Volume</p>
                  <p className="text-xl font-bold">
                    {asset.volume24h && typeof asset.volume24h === 'number'
                      ? `$${(asset.volume24h / 1e9).toFixed(2)}B`
                      : 'N/A'}
                  </p>
                </div>
              </div>
            )}
          </div>

          {isLocalGhanaStock && hasPosition && (
            <div className="rounded-lg border border-green-500/20 bg-green-500/5 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-lg">Your Position</h3>
                <span className="text-xs text-muted-foreground">{asset.symbol}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Shares Owned</p>
                  <p className="text-2xl font-bold">{Math.floor(Number(currentPosition.amount || 0))}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Avg Buy Price</p>
                  <p className="text-2xl font-bold">{currencyPrefix}{(positionCostBasis / Math.max(Number(currentPosition.amount || 1), 1)).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Current Price</p>
                  <p className="text-2xl font-bold">{currencyPrefix}{currentPrice.toFixed(2)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-green-500/20 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Total Value</p>
                  <p className="text-3xl font-bold">{currencyPrefix}{positionTotalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-1">Profit / Loss</p>
                  <p className={`text-3xl font-bold ${positionPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {positionPnL >= 0 ? '+' : '-'}{currencyPrefix}{Math.abs(positionPnL).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                  <p className={`text-sm font-semibold ${positionPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {positionPnL >= 0 ? '+' : ''}{positionPnLPercent.toFixed(2)}%
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Chart or Sample NFTs */}
          {asset.image.startsWith('/nft/') ? (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Sample NFTs from Collection</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted rounded-lg p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={`/nft/${asset.id === '1' ? 'bayc' : `nft-${asset.id}`}-variant1.jpg`}
                      alt={`${asset.name} Variant 1`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold text-2xl hidden">
                      {asset.symbol?.slice(0, 2) || '??'}
                    </div>
                  </div>
                  <p className="font-medium text-sm">#{Math.floor(Math.random() * 10000) + 1}</p>
                  <p className="text-xs text-muted-foreground">Floor: {asset.price} ETH</p>
                </div>
                <div className="bg-muted rounded-lg p-4">
                  <div className="aspect-square bg-gray-100 rounded-lg mb-3 overflow-hidden">
                    <img
                      src={`/nft/${asset.id === '1' ? 'bayc' : `nft-${asset.id}`}-variant2.jpg`}
                      alt={`${asset.name} Variant 2`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling as HTMLElement;
                        if (fallback) fallback.style.display = 'flex';
                      }}
                    />
                    <div className="w-full h-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white font-bold text-2xl hidden">
                      {asset.symbol?.slice(0, 2) || '??'}
                    </div>
                  </div>
                  <p className="font-medium text-sm">#{Math.floor(Math.random() * 10000) + 1}</p>
                  <p className="text-xs text-muted-foreground">Floor: {asset.price} ETH</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Price Chart</h3>
              <div className="h-64">
                <Line
                  data={{
                    labels: Array.from({ length: 30 }, (_, i) => {
                      const date = new Date();
                      date.setDate(date.getDate() - (29 - i));
                      return date.toLocaleDateString();
                    }),
                    datasets: [{
                      label: 'Price',
                      data: Array.from({ length: 30 }, (_, i) => {
                        const basePrice = asset.price;
                        const volatility = 0.05;
                        const trend = Math.sin(i / 10) * 0.02;
                        const randomChange = (Math.random() - 0.5) * volatility;
                        return basePrice * (1 + trend + randomChange);
                      }),
                      borderColor: asset.change24h >= 0 ? '#10b981' : '#ef4444',
                      backgroundColor: asset.change24h >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                      borderWidth: 2,
                      pointRadius: 0,
                      fill: true,
                      tension: 0.3,
                    }],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false },
                      tooltip: {
                        callbacks: {
                          label: (context: any) => `${currencyPrefix}${context.parsed.y.toFixed(2)}`,
                        },
                      },
                    },
                    scales: {
                      x: { grid: { display: false } },
                      y: {
                        ticks: {
                          callback: (value: any) => `${currencyPrefix}${value.toFixed(2)}`,
                        },
                      },
                    },
                  }}
                />
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => onTrade(asset, 'buy')}
              className="py-3 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600 transition-colors disabled:opacity-50"
              disabled={!asset.price || asset.price <= 0}
            >
              Quick Buy
            </button>
            <button
              onClick={() => onTrade(asset, 'sell')}
              className="py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors disabled:opacity-50"
              disabled={!asset.price || asset.price <= 0}
            >
              Quick Sell
            </button>
          </div>

          {/* Additional Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button className="py-2 border border-border rounded-lg font-medium hover:bg-accent transition-colors">
              Set Alert
            </button>
            <button className="py-2 border border-border rounded-lg font-medium hover:bg-accent transition-colors">
              Add to Watchlist
            </button>
          </div>

          {/* Transaction Success Modal */}
          <TransactionSuccessModal
            isOpen={showSuccessModal}
            onClose={() => {
              setShowSuccessModal(false);
              setSuccessTransaction(null);
            }}
            transaction={successTransaction}
          />
        </div>
      </div>
    </div>
  );
}