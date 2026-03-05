// Technical Analysis Chart Data and Utilities

export interface CandleData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TechnicalIndicator {
  name: string;
  data: number[];
  color: string;
  type: 'line' | 'area';
}

// Generate mock historical candle data for technical analysis
export function generateHistoricalData(
  basePrice: number,
  days: number = 30,
  timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h'
): CandleData[] {
  const candles: CandleData[] = [];
  const now = Date.now();
  let currentPrice = basePrice;

  // Timeframe multipliers (in milliseconds)
  const timeframeMultipliers = {
    '1m': 60 * 1000,
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '4h': 4 * 60 * 60 * 1000,
    '1d': 24 * 60 * 60 * 1000,
  };

  const interval = timeframeMultipliers[timeframe];
  const totalCandles = Math.floor((days * 24 * 60 * 60 * 1000) / interval);

  for (let i = totalCandles; i >= 0; i--) {
    const timestamp = now - (i * interval);

    // Generate realistic price movement
    const volatility = 0.02; // 2% volatility
    const trend = Math.sin(i / 20) * 0.005; // Slight trend
    const randomChange = (Math.random() - 0.5) * volatility;

    const change = trend + randomChange;
    const open = currentPrice;
    const close = open * (1 + change);

    // Generate high/low within realistic bounds
    const range = Math.abs(close - open) * (1 + Math.random());
    const high = Math.max(open, close) + (range * Math.random() * 0.5);
    const low = Math.min(open, close) - (range * Math.random() * 0.5);

    // Generate volume (higher for larger price movements)
    const volume = Math.floor(1000000 + Math.random() * 5000000 * (1 + Math.abs(change) * 10));

    candles.push({
      timestamp,
      open,
      high,
      low,
      close,
      volume,
    });

    currentPrice = close;
  }

  return candles.reverse();
}

// Calculate RSI (Relative Strength Index)
export function calculateRSI(data: CandleData[], period: number = 14): number[] {
  const gains: number[] = [];
  const losses: number[] = [];

  // Calculate price changes
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
  }

  const rsi: number[] = [];

  for (let i = period - 1; i < gains.length; i++) {
    const avgGain = gains.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;
    const avgLoss = losses.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0) / period;

    if (avgLoss === 0) {
      rsi.push(100);
    } else {
      const rs = avgGain / avgLoss;
      rsi.push(100 - (100 / (1 + rs)));
    }
  }

  // Pad with nulls for initial values
  return Array(period - 1).fill(null).concat(rsi);
}

// Calculate MACD (Moving Average Convergence Divergence)
export function calculateMACD(
  data: CandleData[],
  fastPeriod: number = 12,
  slowPeriod: number = 26,
  signalPeriod: number = 9
): { macd: number[]; signal: number[]; histogram: number[] } {
  const closes = data.map(d => d.close);

  // Calculate EMAs
  const fastEMA = calculateEMA(closes, fastPeriod);
  const slowEMA = calculateEMA(closes, slowPeriod);

  // Calculate MACD line
  const macd = fastEMA.map((fast, i) => fast - (slowEMA[i] || 0));

  // Calculate signal line (EMA of MACD)
  const signal = calculateEMA(macd.filter(v => v !== null) as number[], signalPeriod);

  // Calculate histogram
  const histogram = macd.map((m, i) => {
    const signalValue = signal[i - (macd.length - signal.length)] || 0;
    return m - signalValue;
  });

  return { macd, signal, histogram };
}

// Calculate EMA (Exponential Moving Average)
export function calculateEMA(data: number[], period: number): number[] {
  const ema: number[] = [];
  const multiplier = 2 / (period + 1);

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      ema.push(null as any);
    } else if (i === period - 1) {
      // First EMA is SMA
      const sma = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
      ema.push(sma);
    } else {
      const prevEMA = ema[i - 1] as number;
      ema.push((data[i] - prevEMA) * multiplier + prevEMA);
    }
  }

  return ema;
}

// Calculate Bollinger Bands
export function calculateBollingerBands(
  data: CandleData[],
  period: number = 20,
  standardDeviations: number = 2
): { upper: number[]; middle: number[]; lower: number[] } {
  const closes = data.map(d => d.close);
  const sma = calculateSMA(closes, period);

  const upper: number[] = [];
  const lower: number[] = [];

  for (let i = 0; i < closes.length; i++) {
    if (i < period - 1) {
      upper.push(null as any);
      lower.push(null as any);
    } else {
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = slice.reduce((a, b) => a + b, 0) / period;
      const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
      const stdDev = Math.sqrt(variance);

      upper.push(mean + (standardDeviations * stdDev));
      lower.push(mean - (standardDeviations * stdDev));
    }
  }

  return { upper, middle: sma, lower };
}

// Calculate SMA (Simple Moving Average)
export function calculateSMA(data: number[], period: number): number[] {
  const sma: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      sma.push(null as any);
    } else {
      const slice = data.slice(i - period + 1, i + 1);
      sma.push(slice.reduce((a, b) => a + b, 0) / period);
    }
  }

  return sma;
}

// Generate Fibonacci retracement levels
export function calculateFibonacciLevels(high: number, low: number): { level: number; value: number; label: string }[] {
  const diff = high - low;
  const levels = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

  return levels.map(level => ({
    level,
    value: high - (diff * level),
    label: `${(level * 100).toFixed(1)}%`
  }));
}

// Timeframe options for the chart
export const timeframeOptions = [
  { value: '1m', label: '1 Minute', interval: 60 * 1000 },
  { value: '5m', label: '5 Minutes', interval: 5 * 60 * 1000 },
  { value: '15m', label: '15 Minutes', interval: 15 * 60 * 1000 },
  { value: '1h', label: '1 Hour', interval: 60 * 60 * 1000 },
  { value: '4h', label: '4 Hours', interval: 4 * 60 * 60 * 1000 },
  { value: '1d', label: '1 Day', interval: 24 * 60 * 60 * 1000 },
] as const;

// Technical indicator options
export const indicatorOptions = [
  { value: 'rsi', label: 'RSI (14)', enabled: false },
  { value: 'macd', label: 'MACD (12,26,9)', enabled: false },
  { value: 'bb', label: 'Bollinger Bands (20,2)', enabled: false },
  { value: 'sma20', label: 'SMA (20)', enabled: false },
  { value: 'sma50', label: 'SMA (50)', enabled: false },
  { value: 'ema20', label: 'EMA (20)', enabled: false },
  { value: 'ema50', label: 'EMA (50)', enabled: false },
] as const;

// Drawing tool types
export const drawingTools = [
  { value: 'trendline', label: 'Trend Line', icon: '📈' },
  { value: 'horizontal', label: 'Horizontal Line', icon: '➖' },
  { value: 'rectangle', label: 'Rectangle', icon: '▭' },
  { value: 'fibonacci', label: 'Fibonacci', icon: '🌀' },
] as const;
