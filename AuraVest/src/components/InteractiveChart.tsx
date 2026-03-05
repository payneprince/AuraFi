'use client';

import { useEffect, useRef, useState } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface InteractiveChartProps {
  asset: {
    id: string;
    name: string;
    symbol: string;
    price: number;
    change24h: number;
  };
  isEmbedded?: boolean;
}

export default function InteractiveChart({ asset, isEmbedded = false }: InteractiveChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [currentPrice, setCurrentPrice] = useState(asset.price);
  const [priceHistory, setPriceHistory] = useState<number[]>([]);

  useEffect(() => {
    // Generate mock price history
    const basePrice = asset.price;
    const history = [];
    for (let i = 0; i < 50; i++) {
      const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
      history.push(basePrice * (1 + variation));
    }
    setPriceHistory(history);
  }, [asset.price]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const drawChart = () => {
      ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      if (priceHistory.length === 0) return;

      const width = canvas.offsetWidth;
      const height = canvas.offsetHeight;
      const padding = 20;

      // Find min/max prices
      const minPrice = Math.min(...priceHistory);
      const maxPrice = Math.max(...priceHistory);
      const priceRange = maxPrice - minPrice;

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(59, 130, 246, 0.1)');
      gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw price line
      ctx.strokeStyle = asset.change24h >= 0 ? '#10B981' : '#EF4444';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      priceHistory.forEach((price, index) => {
        const x = (index / (priceHistory.length - 1)) * (width - padding * 2) + padding;
        const y = height - padding - ((price - minPrice) / priceRange) * (height - padding * 2);

        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();

      // Fill area under curve
      ctx.lineTo(width - padding, height - padding);
      ctx.lineTo(padding, height - padding);
      ctx.closePath();

      const fillGradient = ctx.createLinearGradient(0, 0, 0, height);
      fillGradient.addColorStop(0, asset.change24h >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)');
      fillGradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
      ctx.fillStyle = fillGradient;
      ctx.fill();

      // Draw grid lines
      ctx.strokeStyle = 'rgba(156, 163, 175, 0.2)';
      ctx.lineWidth = 1;

      // Horizontal grid
      for (let i = 0; i <= 4; i++) {
        const y = padding + (i * (height - padding * 2)) / 4;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Vertical grid
      for (let i = 0; i <= 4; i++) {
        const x = padding + (i * (width - padding * 2)) / 4;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }
    };

    drawChart();

    // Animate price updates
    const interval = setInterval(() => {
      if (isHovered) {
        const variation = (Math.random() - 0.5) * 0.002; // Small ±0.2% variation
        setCurrentPrice(prev => prev * (1 + variation));
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [priceHistory, asset.change24h, isHovered]);

  return (
    <div
      className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden transition-all duration-300 ${
        isHovered ? 'shadow-2xl scale-105' : ''
      } ${isEmbedded ? 'p-4' : 'p-6'}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className={`font-bold text-gray-900 dark:text-white ${isEmbedded ? 'text-lg' : 'text-xl'}`}>
            {asset.name}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">{asset.symbol}</p>
        </div>
        <div className="text-right">
          <div className={`font-bold text-gray-900 dark:text-white ${isEmbedded ? 'text-lg' : 'text-2xl'}`}>
            ${currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className={`flex items-center gap-1 ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {asset.change24h >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            <span className="text-sm font-semibold">
              {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className={`relative ${isEmbedded ? 'h-32' : 'h-48'}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-full"
          style={{ width: '100%', height: '100%' }}
        />

        {/* Interactive overlay */}
        {isHovered && (
          <div className="absolute inset-0 bg-gradient-to-t from-blue-500/10 to-transparent pointer-events-none" />
        )}
      </div>

      {/* Time indicators */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mt-2">
        <span>1H</span>
        <span>24H</span>
        <span>7D</span>
        <span>1M</span>
      </div>
    </div>
  );
}
