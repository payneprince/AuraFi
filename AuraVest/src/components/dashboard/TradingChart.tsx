'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  ColorType,
  CrosshairMode,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from 'lightweight-charts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  ChevronDown,
  Wifi,
  WifiOff,
  RefreshCw,
  Maximize2,
  Minimize2,
  X,
} from 'lucide-react';
import { loadCrypto } from '@/lib/marketData';

// ─── types ────────────────────────────────────────────────────────────────────

type Interval  = '1m' | '5m' | '15m' | '1h' | '4h' | '1d';
type ChartType = 'candles' | 'line' | 'area';

interface OhlcBar {
  time: Time;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface TickerInfo {
  price: number;
  changePct: number;
  high24h: number;
  low24h: number;
  volume24h: number;
}

interface Indicators {
  volume: boolean;
  sma20:  boolean;
  sma50:  boolean;
  ema20:  boolean;
}

// ─── assets ───────────────────────────────────────────────────────────────────

const ASSETS = [
  { symbol: 'BTC',  binance: 'BTCUSDT',   name: 'Bitcoin'   },
  { symbol: 'ETH',  binance: 'ETHUSDT',   name: 'Ethereum'  },
  { symbol: 'BNB',  binance: 'BNBUSDT',   name: 'BNB'       },
  { symbol: 'SOL',  binance: 'SOLUSDT',   name: 'Solana'    },
  { symbol: 'XRP',  binance: 'XRPUSDT',   name: 'XRP'       },
  { symbol: 'ADA',  binance: 'ADAUSDT',   name: 'Cardano'   },
  { symbol: 'AVAX', binance: 'AVAXUSDT',  name: 'Avalanche' },
  { symbol: 'DOT',  binance: 'DOTUSDT',   name: 'Polkadot'  },
  { symbol: 'LINK', binance: 'LINKUSDT',  name: 'Chainlink' },
  { symbol: 'DOGE', binance: 'DOGEUSDT',  name: 'Dogecoin'  },
  { symbol: 'MATIC',binance: 'MATICUSDT', name: 'Polygon'   },
  { symbol: 'ATOM', binance: 'ATOMUSDT',  name: 'Cosmos'    },
];

const INTERVALS: { label: string; value: Interval }[] = [
  { label: '1m',  value: '1m'  },
  { label: '5m',  value: '5m'  },
  { label: '15m', value: '15m' },
  { label: '1h',  value: '1h'  },
  { label: '4h',  value: '4h'  },
  { label: '1D',  value: '1d'  },
];

// ─── maths ────────────────────────────────────────────────────────────────────

function calcSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    let s = 0; for (let j = i - period + 1; j <= i; j++) s += closes[j];
    return s / period;
  });
}

function calcEMA(closes: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const out: (number | null)[] = [];
  let prev: number | null = null;
  closes.forEach((c, i) => {
    if (i < period - 1) { out.push(null); return; }
    if (prev === null) {
      let s = 0; for (let j = 0; j < period; j++) s += closes[j];
      prev = s / period;
      out.push(prev);
      return;
    }
    prev = c * k + prev * (1 - k);
    out.push(prev);
  });
  return out;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

async function fetchKlines(binanceSym: string, interval: Interval): Promise<OhlcBar[]> {
  const limit = interval === '1m' || interval === '5m' ? 200 : 150;
  const res = await fetch(`https://api.binance.com/api/v3/klines?symbol=${binanceSym}&interval=${interval}&limit=${limit}`);
  if (!res.ok) throw new Error('klines fetch failed');
  const raw: any[][] = await res.json();
  return raw.map((k) => ({
    time:   Math.floor(k[0] / 1000) as Time,
    open:   parseFloat(k[1]),
    high:   parseFloat(k[2]),
    low:    parseFloat(k[3]),
    close:  parseFloat(k[4]),
    volume: parseFloat(k[5]),
  }));
}

async function fetchTicker(binanceSym: string): Promise<TickerInfo> {
  const res = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${binanceSym}`);
  if (!res.ok) throw new Error('ticker fetch failed');
  const d = await res.json();
  return {
    price:      parseFloat(d.lastPrice),
    changePct:  parseFloat(d.priceChangePercent),
    high24h:    parseFloat(d.highPrice),
    low24h:     parseFloat(d.lowPrice),
    volume24h:  parseFloat(d.volume),
  };
}

function fmtPrice(n: number) {
  if (n >= 1000) return n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (n >= 1)    return n.toFixed(4);
  return n.toFixed(6);
}

function fmtVol(n: number) {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(2) + 'K';
  return n.toFixed(2);
}

// ─── AssetLogo ────────────────────────────────────────────────────────────────

function AssetLogo({ symbol, url, size }: { symbol: string; url?: string; size: number }) {
  const [err, setErr] = useState(false);
  const showImg = !!url && !err;
  return (
    <span
      className="inline-flex items-center justify-center rounded-full overflow-hidden flex-shrink-0"
      style={{ width: size, height: size, background: showImg ? 'transparent' : 'linear-gradient(135deg,#6366f1,#2dd4bf)' }}
    >
      {showImg ? (
        <img src={url} alt={symbol} width={size} height={size}
          style={{ width: size, height: size, objectFit: 'cover' }}
          onError={() => setErr(true)}
        />
      ) : (
        <span style={{ fontSize: size * 0.42, fontWeight: 700, color: '#fff', lineHeight: 1 }}>
          {symbol.slice(0, 2)}
        </span>
      )}
    </span>
  );
}

// ─── component ────────────────────────────────────────────────────────────────

interface TradingChartProps {
  initialSymbol?: string;
}

export default function TradingChart({ initialSymbol }: TradingChartProps = {}) {
  const resolveAsset = (sym?: string) =>
    (sym ? ASSETS.find((a) => a.symbol === sym.toUpperCase()) : undefined) ?? ASSETS[0];

  const [selectedAsset, setSelectedAsset] = useState(() => resolveAsset(initialSymbol));
  const [interval,      setIntervalState]  = useState<Interval>('1m');
  const [chartType,     setChartType]      = useState<ChartType>('candles');
  const [indicators,    setIndicators]     = useState<Indicators>({ volume: true, sma20: false, sma50: false, ema20: false });
  const [ticker,        setTicker]         = useState<TickerInfo | null>(null);
  const [isConnected,   setIsConnected]    = useState(false);
  const [isLoading,     setIsLoading]      = useState(true);
  const [showAssetMenu, setShowAssetMenu]  = useState(false);
  const [crosshairBar,  setCrosshairBar]   = useState<OhlcBar | null>(null);
  const [logos,         setLogos]          = useState<Record<string, string>>({});
  const [isFullscreen,  setIsFullscreen]   = useState(false);

  const containerRef    = useRef<HTMLDivElement>(null);
  const chartRef        = useRef<IChartApi | null>(null);
  const priceSeriesRef  = useRef<ISeriesApi<any> | null>(null);
  const volSeriesRef    = useRef<ISeriesApi<'Histogram'> | null>(null);
  const sma20Ref        = useRef<ISeriesApi<'Line'> | null>(null);
  const sma50Ref        = useRef<ISeriesApi<'Line'> | null>(null);
  const ema20Ref        = useRef<ISeriesApi<'Line'> | null>(null);
  const wsRef           = useRef<WebSocket | null>(null);
  const barsRef         = useRef<OhlcBar[]>([]);

  // ── escape to exit fullscreen ───────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsFullscreen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ── logo load ───────────────────────────────────────────────────────────────
  useEffect(() => {
    loadCrypto().then((assets) => {
      const map: Record<string, string> = {};
      assets.forEach((a) => { if (a.symbol && a.image) map[a.symbol.toUpperCase()] = a.image; });
      setLogos(map);
    }).catch(() => {});
  }, []);

  // ── sync initialSymbol ──────────────────────────────────────────────────────
  useEffect(() => {
    setSelectedAsset(resolveAsset(initialSymbol));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSymbol]);

  // ── chart init (once) ───────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: 'transparent' },
        textColor:  'rgba(255,255,255,0.4)',
        fontSize:   11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(255,255,255,0.18)', width: 1, style: 2 },
        horzLine: { color: 'rgba(255,255,255,0.18)', width: 1, style: 2, labelBackgroundColor: '#1e2a3a' },
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        scaleMargins: { top: 0.06, bottom: 0.28 }, // leave room for volume
      },
      timeScale: {
        borderColor:     'rgba(255,255,255,0.06)',
        timeVisible:     true,
        secondsVisible:  false,
      },
      handleScroll: true,
      handleScale:  true,
    });

    chartRef.current = chart;

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width:  containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);

    chart.subscribeCrosshairMove((param) => {
      if (!param.time || !priceSeriesRef.current) { setCrosshairBar(null); return; }
      const bar = param.seriesData.get(priceSeriesRef.current) as any;
      if (bar) setCrosshairBar({ time: param.time as Time, open: bar.open ?? bar.value, high: bar.high ?? bar.value, low: bar.low ?? bar.value, close: bar.close ?? bar.value, volume: 0 });
      else setCrosshairBar(null);
    });

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, []);

  // ── helpers: add/remove indicator series ────────────────────────────────────
  const removeSeries = useCallback((ref: React.MutableRefObject<ISeriesApi<any> | null>) => {
    if (ref.current && chartRef.current) {
      try { chartRef.current.removeSeries(ref.current); } catch {}
      ref.current = null;
    }
  }, []);

  // ── rebuild all series from current barsRef ─────────────────────────────────
  const rebuildSeries = useCallback((bars: OhlcBar[], type: ChartType, inds: Indicators) => {
    const chart = chartRef.current;
    if (!chart || bars.length === 0) return;

    // Remove everything
    removeSeries(priceSeriesRef);
    removeSeries(volSeriesRef);
    removeSeries(sma20Ref);
    removeSeries(sma50Ref);
    removeSeries(ema20Ref);

    // ── Price series ──────────────────────────────────────────────────────────
    if (type === 'candles') {
      const s = chart.addSeries(CandlestickSeries, {
        upColor: '#22c55e', downColor: '#ef4444',
        borderUpColor: '#22c55e', borderDownColor: '#ef4444',
        wickUpColor: '#22c55e', wickDownColor: '#ef4444',
      });
      s.setData(bars as CandlestickData<Time>[]);
      priceSeriesRef.current = s;
    } else if (type === 'line') {
      const s = chart.addSeries(LineSeries, { color: '#818cf8', lineWidth: 2 });
      s.setData(bars.map((b) => ({ time: b.time, value: b.close })));
      priceSeriesRef.current = s;
    } else {
      const s = chart.addSeries(AreaSeries, {
        lineColor: '#818cf8', topColor: 'rgba(129,140,248,0.28)', bottomColor: 'rgba(129,140,248,0)', lineWidth: 2,
      });
      s.setData(bars.map((b) => ({ time: b.time, value: b.close })));
      priceSeriesRef.current = s;
    }

    // ── Volume histogram ──────────────────────────────────────────────────────
    if (inds.volume) {
      const vs = chart.addSeries(HistogramSeries, {
        priceFormat: { type: 'volume' },
        priceScaleId: 'vol',
      });
      vs.priceScale().applyOptions({
        scaleMargins: { top: 0.78, bottom: 0 },
        borderVisible: false,
      });
      vs.setData(bars.map((b) => ({
        time:  b.time,
        value: b.volume,
        color: b.close >= b.open ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)',
      })));
      volSeriesRef.current = vs;
    }

    // ── MA overlays ───────────────────────────────────────────────────────────
    const closes = bars.map((b) => b.close);

    if (inds.sma20) {
      const vals = calcSMA(closes, 20);
      const s = chart.addSeries(LineSeries, { color: '#a78bfa', lineWidth: 1, crosshairMarkerVisible: false });
      s.setData(bars.map((b, i) => vals[i] !== null ? { time: b.time, value: vals[i]! } : null).filter(Boolean) as any);
      sma20Ref.current = s;
    }
    if (inds.sma50) {
      const vals = calcSMA(closes, 50);
      const s = chart.addSeries(LineSeries, { color: '#fb923c', lineWidth: 1, crosshairMarkerVisible: false });
      s.setData(bars.map((b, i) => vals[i] !== null ? { time: b.time, value: vals[i]! } : null).filter(Boolean) as any);
      sma50Ref.current = s;
    }
    if (inds.ema20) {
      const vals = calcEMA(closes, 20);
      const s = chart.addSeries(LineSeries, { color: '#22d3ee', lineWidth: 1, crosshairMarkerVisible: false });
      s.setData(bars.map((b, i) => vals[i] !== null ? { time: b.time, value: vals[i]! } : null).filter(Boolean) as any);
      ema20Ref.current = s;
    }

    chart.timeScale().fitContent();
  }, [removeSeries]);

  // ── fetch klines + ticker ───────────────────────────────────────────────────
  const loadData = useCallback(async (asset: typeof ASSETS[0], iv: Interval, type: ChartType, inds: Indicators) => {
    setIsLoading(true);
    setCrosshairBar(null);
    try {
      const [bars, tick] = await Promise.all([fetchKlines(asset.binance, iv), fetchTicker(asset.binance)]);
      barsRef.current = bars;
      setTicker(tick);
      rebuildSeries(bars, type, inds);
    } catch (err) {
      console.warn('chart load error', err);
    } finally {
      setIsLoading(false);
    }
  }, [rebuildSeries]);

  // ── WebSocket ───────────────────────────────────────────────────────────────
  const connectWs = useCallback((asset: typeof ASSETS[0], iv: Interval) => {
    if (wsRef.current) { wsRef.current.close(); wsRef.current = null; }
    setIsConnected(false);
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${asset.binance.toLowerCase()}@kline_${iv}`);
    wsRef.current = ws;
    ws.onopen  = () => setIsConnected(true);
    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);
    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.e !== 'kline') return;
        const k = msg.k;
        const bar: OhlcBar = {
          time: Math.floor(k.t / 1000) as Time,
          open: parseFloat(k.o), high: parseFloat(k.h),
          low:  parseFloat(k.l), close: parseFloat(k.c),
          volume: parseFloat(k.v),
        };
        const bars = barsRef.current;
        if (bars.length > 0 && bars[bars.length - 1].time === bar.time) bars[bars.length - 1] = bar;
        else bars.push(bar);

        if (priceSeriesRef.current) {
          const isCandle = !!('open' in (priceSeriesRef.current.data()[0] ?? {}));
          if (chartType === 'candles') (priceSeriesRef.current as ISeriesApi<'Candlestick'>).update(bar as CandlestickData<Time>);
          else priceSeriesRef.current.update({ time: bar.time, value: bar.close });
        }
        if (volSeriesRef.current) volSeriesRef.current.update({ time: bar.time, value: bar.volume, color: bar.close >= bar.open ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)' });
        setTicker((prev) => prev ? { ...prev, price: bar.close } : null);
      } catch {}
    };
  }, [chartType]);

  // ── reload on asset / interval change ───────────────────────────────────────
  useEffect(() => {
    loadData(selectedAsset, interval, chartType, indicators);
    connectWs(selectedAsset, interval);
    return () => { if (wsRef.current) { wsRef.current.close(); wsRef.current = null; } };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAsset.binance, interval]);

  // ── rebuild when chart type changes ─────────────────────────────────────────
  useEffect(() => {
    if (barsRef.current.length > 0) rebuildSeries(barsRef.current, chartType, indicators);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartType]);

  // ── rebuild when indicators toggle ──────────────────────────────────────────
  useEffect(() => {
    if (barsRef.current.length > 0) rebuildSeries(barsRef.current, chartType, indicators);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicators.volume, indicators.sma20, indicators.sma50, indicators.ema20]);

  const toggleIndicator = (key: keyof Indicators) =>
    setIndicators((prev) => ({ ...prev, [key]: !prev[key] }));

  const isUp = (ticker?.changePct ?? 0) >= 0;

  // ── render ──────────────────────────────────────────────────────────────────
  // Keep the chart div in a SINGLE React tree position so `containerRef` is
  // never unmounted. Fullscreen is achieved purely via CSS (fixed inset).
  return (
    <>
      {/* Backdrop — separate element so the chart stays in place */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-[9998] bg-black/85 backdrop-blur-sm"
          onClick={() => setIsFullscreen(false)}
        />
      )}

      <div
        className={`flex flex-col bg-[#080d1a] border border-white/8 overflow-hidden transition-[border-radius] duration-200 ${
          isFullscreen ? 'fixed z-[9999] rounded-2xl' : 'h-full rounded-2xl'
        }`}
        style={isFullscreen ? { inset: 16, animation: 'fsChartPop .25s cubic-bezier(.34,1.56,.64,1) both' } : undefined}
      >
      <style>{`@keyframes fsChartPop{from{opacity:0;transform:scale(.94)}to{opacity:1;transform:scale(1)}}`}</style>

      {/* ── Top bar: asset + ticker ──────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/8 flex-wrap relative">

        {/* Asset dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowAssetMenu((v) => !v)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-colors text-sm font-bold"
          >
            <AssetLogo symbol={selectedAsset.symbol} url={logos[selectedAsset.symbol]} size={22} />
            <span>{selectedAsset.symbol}<span className="text-white/30 font-normal">/USDT</span></span>
            <ChevronDown className="w-3.5 h-3.5 opacity-40" />
          </button>
          {showAssetMenu && (
            <>
              <button className="fixed inset-0 z-10" onClick={() => setShowAssetMenu(false)} />
              <div className="absolute left-0 top-full mt-1.5 z-20 w-52 bg-[#0c1220] border border-white/12 rounded-xl shadow-2xl overflow-hidden" style={{ maxHeight: 280, overflowY: 'auto' }}>
                {ASSETS.map((a) => (
                  <button
                    key={a.symbol}
                    onClick={() => { setSelectedAsset(a); setShowAssetMenu(false); }}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors ${a.symbol === selectedAsset.symbol ? 'bg-white/8 text-white font-semibold' : 'text-white/60 hover:bg-white/5 hover:text-white/90'}`}
                  >
                    <AssetLogo symbol={a.symbol} url={logos[a.symbol]} size={26} />
                    <span className="font-semibold">{a.symbol}</span>
                    <span className="text-white/30 text-xs ml-auto">{a.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Ticker */}
        {ticker && (
          <div className="flex items-center gap-4 flex-wrap min-w-0">
            <span className="text-xl font-black tabular-nums text-white">
              ${fmtPrice(ticker.price)}
            </span>
            <span className={`flex items-center gap-1 text-sm font-semibold px-2 py-0.5 rounded-lg ${isUp ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
              {isUp ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {isUp ? '+' : ''}{ticker.changePct.toFixed(2)}%
            </span>
            <span className="hidden md:flex items-center gap-3 text-xs text-white/35">
              <span>24H H <span className="text-white/60">${fmtPrice(ticker.high24h)}</span></span>
              <span>24H L <span className="text-white/60">${fmtPrice(ticker.low24h)}</span></span>
              <span>Vol <span className="text-white/60">{fmtVol(ticker.volume24h)}</span></span>
            </span>
          </div>
        )}

        {/* Live dot + close */}
        <div className="ml-auto flex items-center gap-2 text-xs">
          {isConnected ? (
            <><span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60" /><span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" /></span><span className="text-green-400 hidden sm:inline">Live</span></>
          ) : (
            <><WifiOff className="w-3.5 h-3.5 text-white/25" /><span className="text-white/25 hidden sm:inline">Connecting…</span></>
          )}
          {isFullscreen && (
            <button
              onClick={() => setIsFullscreen(false)}
              className="ml-1 w-7 h-7 rounded-lg bg-white/8 hover:bg-white/15 border border-white/10 flex items-center justify-center transition-all"
            >
              <X className="w-3.5 h-3.5 text-white/60" />
            </button>
          )}
        </div>
      </div>

      {/* ── OHLC crosshair bar ───────────────────────────────────────────────── */}
      <div className={`flex items-center gap-3 px-4 py-1.5 border-b border-white/5 text-xs font-mono transition-opacity duration-100 ${crosshairBar ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} style={{ minHeight: 28 }}>
        <span className="text-white/35">O</span><span className="text-white/75">{crosshairBar ? fmtPrice(crosshairBar.open) : ''}</span>
        <span className="text-white/35">H</span><span className="text-green-400">{crosshairBar ? fmtPrice(crosshairBar.high) : ''}</span>
        <span className="text-white/35">L</span><span className="text-red-400">{crosshairBar ? fmtPrice(crosshairBar.low) : ''}</span>
        <span className="text-white/35">C</span>
        <span className={crosshairBar && crosshairBar.close >= crosshairBar.open ? 'text-green-400' : 'text-red-400'}>
          {crosshairBar ? fmtPrice(crosshairBar.close) : ''}
        </span>
      </div>

      {/* ── Controls bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-1 px-3 py-1.5 border-b border-white/5 flex-wrap">
        {/* Intervals */}
        {INTERVALS.map((iv) => (
          <button key={iv.value} onClick={() => setIntervalState(iv.value)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${interval === iv.value ? 'bg-primary/20 text-primary border border-primary/30' : 'text-white/35 hover:text-white/65 hover:bg-white/5'}`}
          >{iv.label}</button>
        ))}

        <div className="w-px h-4 bg-white/8 mx-1.5" />

        {/* Chart type */}
        <button onClick={() => setChartType('candles')} title="Candlestick"
          className={`p-1.5 rounded-lg transition-all ${chartType === 'candles' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
          <BarChart2 className="w-4 h-4" />
        </button>
        <button onClick={() => setChartType('line')} title="Line"
          className={`p-1.5 rounded-lg transition-all ${chartType === 'line' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
          <TrendingUp className="w-4 h-4" />
        </button>
        <button onClick={() => setChartType('area')} title="Area"
          className={`p-1.5 rounded-lg transition-all ${chartType === 'area' ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}>
          <Activity className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-white/8 mx-1.5" />

        {/* Indicators */}
        {([
          { key: 'volume', label: 'Vol' },
          { key: 'sma20',  label: 'SMA 20',  color: '#a78bfa' },
          { key: 'sma50',  label: 'SMA 50',  color: '#fb923c' },
          { key: 'ema20',  label: 'EMA 20',  color: '#22d3ee' },
        ] as { key: keyof Indicators; label: string; color?: string }[]).map(({ key, label, color }) => (
          <button key={key} onClick={() => toggleIndicator(key)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border ${
              indicators[key]
                ? 'border-transparent text-white bg-white/10'
                : 'border-white/8 text-white/35 hover:text-white/60 hover:border-white/15'
            }`}
          >
            {color && indicators[key] && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />}
            {label}
          </button>
        ))}

        {/* Refresh + Fullscreen */}
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => loadData(selectedAsset, interval, chartType, indicators)}
            className="p-1.5 rounded-lg text-white/25 hover:text-white/55 hover:bg-white/5 transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => setIsFullscreen((v) => !v)}
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            className="p-1.5 rounded-lg text-white/25 hover:text-white/70 hover:bg-white/8 transition-all">
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* ── Chart canvas ─────────────────────────────────────────────────────── */}
      <div className="relative flex-1 min-h-0">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#080d1a]/80 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
                <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
              </div>
              <span className="text-xs text-white/35">Loading chart…</span>
            </div>
          </div>
        )}
        <div ref={containerRef} className="w-full h-full" />
      </div>
    </div>
    </>
  );
}
