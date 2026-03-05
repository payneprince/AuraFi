'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import 'chartjs-adapter-date-fns';
import {
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  Maximize2,
  Minimize2,
  RotateCcw,
  Download,
  MousePointer,
  Edit3,
  Zap,
} from 'lucide-react';
import {
  generateHistoricalData,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateSMA,
  calculateEMA,
  timeframeOptions,
  indicatorOptions,
  drawingTools,
  type CandleData,
} from '@/lib/chartData';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);

interface TechnicalAnalysisChartProps {
  asset: {
    id: string;
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    exchange?: string;
    currency?: string;
  };
  isEmbedded?: boolean;
}

export default function TechnicalAnalysisChart({ asset, onClose, isEmbedded = false }: TechnicalAnalysisChartProps & { onClose?: () => void }) {
  const [timeframe, setTimeframe] = useState('1h');
  const [candleData, setCandleData] = useState<CandleData[]>([]);
  const [indicators, setIndicators] = useState<any[]>(indicatorOptions.map(ind => ({ ...ind })));
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showVolume, setShowVolume] = useState(true);
  const chartRef = useRef<any>(null);
  const isLocalGhanaStock = asset?.exchange === 'GSE' || asset?.currency === 'GHS';
  const currencyPrefix = isLocalGhanaStock ? 'GHS ' : '$';

  // Load historical data
  useEffect(() => {
    const data = generateHistoricalData(asset.price, 30, timeframe as any);
    setCandleData(data);
  }, [asset.price, timeframe]);

  // Toggle indicators
  const toggleIndicator = (indicatorId: string) => {
    setIndicators(prev =>
      prev.map(ind =>
        ind.value === indicatorId ? { ...ind, enabled: !ind.enabled } : ind
      )
    );
  };

  // Calculate indicators
  const getIndicatorData = useCallback(() => {
    const indicatorsData: any[] = [];

    indicators.forEach(indicator => {
      if (!indicator.enabled) return;

      switch (indicator.value) {
        case 'rsi':
          const rsi = calculateRSI(candleData);
          indicatorsData.push({
            label: 'RSI',
            data: rsi,
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.1)',
            yAxisID: 'rsi',
            pointRadius: 0,
            borderWidth: 1,
          });
          break;

        case 'macd':
          const macd = calculateMACD(candleData);
          indicatorsData.push(
            {
              label: 'MACD',
              data: macd.macd,
              borderColor: '#3b82f6',
              yAxisID: 'macd',
              pointRadius: 0,
              borderWidth: 1,
            },
            {
              label: 'Signal',
              data: macd.signal,
              borderColor: '#ef4444',
              yAxisID: 'macd',
              pointRadius: 0,
              borderWidth: 1,
            }
          );
          break;

        case 'bb':
          const bb = calculateBollingerBands(candleData);
          indicatorsData.push(
            {
              label: 'BB Upper',
              data: bb.upper,
              borderColor: '#10b981',
              yAxisID: 'price',
              pointRadius: 0,
              borderWidth: 1,
              borderDash: [5, 5],
            },
            {
              label: 'BB Middle',
              data: bb.middle,
              borderColor: '#6b7280',
              yAxisID: 'price',
              pointRadius: 0,
              borderWidth: 1,
              borderDash: [5, 5],
            },
            {
              label: 'BB Lower',
              data: bb.lower,
              borderColor: '#ef4444',
              yAxisID: 'price',
              pointRadius: 0,
              borderWidth: 1,
              borderDash: [5, 5],
            }
          );
          break;

        case 'sma20':
          const sma20 = calculateSMA(candleData.map(d => d.close), 20);
          indicatorsData.push({
            label: 'SMA (20)',
            data: sma20,
            borderColor: '#8b5cf6',
            yAxisID: 'price',
            pointRadius: 0,
            borderWidth: 2,
          });
          break;

        case 'sma50':
          const sma50 = calculateSMA(candleData.map(d => d.close), 50);
          indicatorsData.push({
            label: 'SMA (50)',
            data: sma50,
            borderColor: '#f97316',
            yAxisID: 'price',
            pointRadius: 0,
            borderWidth: 2,
          });
          break;

        case 'ema20':
          const ema20 = calculateEMA(candleData.map(d => d.close), 20);
          indicatorsData.push({
            label: 'EMA (20)',
            data: ema20,
            borderColor: '#06b6d4',
            yAxisID: 'price',
            pointRadius: 0,
            borderWidth: 2,
          });
          break;

        case 'ema50':
          const ema50 = calculateEMA(candleData.map(d => d.close), 50);
          indicatorsData.push({
            label: 'EMA (50)',
            data: ema50,
            borderColor: '#84cc16',
            yAxisID: 'price',
            pointRadius: 0,
            borderWidth: 2,
          });
          break;
      }
    });

    return indicatorsData;
  }, [candleData, indicators]);

  // Chart data
  const chartData = {
    labels: candleData.map(d => new Date(d.timestamp)),
    datasets: [
      // Price line
      {
        label: 'Price',
        data: candleData.map(d => d.close),
        borderColor: asset.change24h >= 0 ? '#10b981' : '#ef4444',
        backgroundColor: asset.change24h >= 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
        yAxisID: 'price',
        pointRadius: 0,
        borderWidth: 2,
        fill: false,
      },
      // Indicators
      ...getIndicatorData(),
    ].filter(Boolean),
  };

  // Volume chart data
  const volumeData = {
    labels: candleData.map(d => new Date(d.timestamp)),
    datasets: [{
      label: 'Volume',
      data: candleData.map(d => d.volume),
      backgroundColor: candleData.map(d =>
        d.close >= d.open ? 'rgba(16, 185, 129, 0.6)' : 'rgba(239, 68, 68, 0.6)'
      ),
      borderWidth: 0,
      yAxisID: 'volume',
    }],
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        borderWidth: 1,
        callbacks: {
          title: (context: any) => {
            return new Date(context[0].parsed.x).toLocaleString();
          },
          label: (context: any) => {
            if (context.dataset.yAxisID === 'price') {
              return `${context.dataset.label}: ${currencyPrefix}${context.parsed.y?.toFixed(2) || 'N/A'}`;
            }
            return `${context.dataset.label}: ${context.parsed.y?.toFixed(2) || 'N/A'}`;
          },
        },
      },
    },
    scales: {
      x: {
        type: 'time' as const,
        time: {
          displayFormats: {
            hour: 'HH:mm',
            day: 'MMM dd',
          },
        },
        grid: {
          display: false,
        },
      },
      price: {
        type: 'linear' as const,
        position: 'left' as const,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)',
        },
        ticks: {
          callback: (value: any) => `${currencyPrefix}${value?.toFixed(2)}`,
        },
      },
      volume: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: {
          display: false,
        },
        ticks: {
          callback: (value: any) => {
            if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
            if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
            return value;
          },
        },
        display: showVolume,
      },
      rsi: {
        type: 'linear' as const,
        position: 'right' as const,
        min: 0,
        max: 100,
        grid: {
          display: false,
        },
        ticks: {
          callback: (value: any) => `${value}`,
        },
        display: indicators.find(i => i.value === 'rsi')?.enabled,
      },
      macd: {
        type: 'linear' as const,
        position: 'right' as const,
        grid: {
          display: false,
        },
        ticks: {
          callback: (value: any) => value?.toFixed(4),
        },
        display: indicators.find(i => i.value === 'macd')?.enabled,
      },
    },
  };

  return (
    <div className={`bg-card border border-border rounded-lg overflow-hidden ${isFullscreen ? 'fixed inset-4 z-50' : ''} ${isEmbedded ? 'border-0 bg-transparent' : ''}`}>
      {/* Header - Only show if not embedded */}
      {!isEmbedded && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-black to-crimson-600 flex items-center justify-center text-white font-bold text-sm">
                {asset.symbol.slice(0, 2)}
              </div>
              <div>
                <h3 className="font-semibold">{asset.name}</h3>
                <p className="text-sm text-muted-foreground">{asset.symbol}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="text-right">
                <p className="font-semibold">{currencyPrefix}{asset.price.toLocaleString()}</p>
                <p className={`text-sm ${asset.change24h >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {asset.change24h >= 0 ? '+' : ''}{asset.change24h.toFixed(2)}%
                </p>
              </div>

              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                className="p-2 hover:bg-accent rounded-lg transition-colors"
              >
                {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </button>
              {onClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Controls - Only show if not embedded */}
      {!isEmbedded && (
        <div className="p-4 border-b border-border bg-muted/30">
          <div className="flex flex-wrap items-center gap-4">
            {/* Timeframe Selector */}
            <div className="flex items-center gap-1">
              <BarChart3 className="w-4 h-4 text-muted-foreground" />
              {timeframeOptions.map((tf) => (
                <button
                  key={tf.value}
                  onClick={() => setTimeframe(tf.value)}
                  className={`px-3 py-1 text-xs rounded ${
                    timeframe === tf.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                >
                  {tf.label}
                </button>
              ))}
            </div>

            {/* Drawing Tools */}
            <div className="flex items-center gap-1">
              <Edit3 className="w-4 h-4 text-muted-foreground" />
              {drawingTools.map((tool) => (
                <button
                  key={tool.value}
                  onClick={() => setSelectedTool(selectedTool === tool.value ? null : tool.value)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedTool === tool.value
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent'
                  }`}
                  title={tool.label}
                >
                  {tool.icon}
                </button>
              ))}
            </div>

            {/* Indicators Toggle */}
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-muted-foreground" />
              <div className="flex gap-1">
                {indicators.slice(0, 4).map((indicator) => (
                  <button
                    key={indicator.value}
                    onClick={() => toggleIndicator(indicator.value)}
                    className={`px-2 py-1 text-xs rounded ${
                      indicator.enabled
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    {indicator.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="flex items-center gap-1 ml-auto">
              <button
                onClick={() => setShowVolume(!showVolume)}
                className={`px-2 py-1 text-xs rounded ${showVolume ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'}`}
              >
                Volume
              </button>
              <button className="p-1 hover:bg-accent rounded">
                <Settings className="w-4 h-4" />
              </button>
              <button className="p-1 hover:bg-accent rounded">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="relative">
        <div className="h-96">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>

        {showVolume && (
          <div className="h-24 border-t border-border">
            <Bar data={volumeData} options={{
              ...chartOptions,
              plugins: {
                ...chartOptions.plugins,
                legend: { display: false },
              },
              scales: {
                x: { display: false },
                volume: {
                  ...chartOptions.scales.volume,
                  display: true,
                },
              },
            }} />
          </div>
        )}
      </div>

      {/* Indicator Panel */}
      {indicators.some(i => i.enabled) && (
        <div className="p-4 border-t border-border bg-muted/30">
          <div className="flex flex-wrap gap-4 text-xs">
            {indicators.filter(i => i.enabled).map((indicator) => (
              <div key={indicator.value} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-primary"></div>
                <span>{indicator.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
