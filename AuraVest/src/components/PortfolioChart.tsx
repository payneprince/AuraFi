'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  type ChartOptions,
  type TooltipItem,
  type ScriptableContext,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

interface ChartDataPoint { date: string; value: number; }
type Period = '1M' | '3M' | '6M' | '1Y';
const PERIODS: Period[] = ['1M', '3M', '6M', '1Y'];

function generatePeriodData(data: ChartDataPoint[], period: Period): ChartDataPoint[] {
  if (!data.length) return data;
  if (period === '1Y') return data;
  if (period === '6M') return data.slice(-6);
  if (period === '3M') return data.slice(-3);

  // 1M: generate 30 smooth daily points between the last two monthly values
  const last = data[data.length - 1].value;
  const prev = data.length > 1 ? data[data.length - 2].value : last * 0.97;
  return Array.from({ length: 31 }, (_, i) => {
    const t = i / 30;
    const base = prev + (last - prev) * t;
    const noise =
      Math.sin(i * 0.71) * Math.abs(last - prev) * 0.055 +
      Math.sin(i * 2.33) * Math.abs(last - prev) * 0.022;
    return {
      date: i === 0 ? '' : i === 15 ? 'Mid' : i === 30 ? data[data.length - 1].date : `${i}`,
      value: Math.round(base + noise),
    };
  });
}

export default function PortfolioChart({ data }: { data: ChartDataPoint[] }) {
  const [isClient, setIsClient] = useState(false);
  const [period, setPeriod] = useState<Period>('1Y');
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    setIsClient(true);
    const updateDark = () => setDarkMode(document.documentElement.classList.contains('dark'));
    updateDark();
    const observer = new MutationObserver(updateDark);
    observer.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  if (!isClient) return <div className="h-72 bg-muted rounded-lg animate-pulse" />;

  const periodData = generatePeriodData(data, period);
  const startVal = periodData[0]?.value ?? 0;
  const endVal = periodData[periodData.length - 1]?.value ?? 0;
  const change = startVal ? ((endVal - startVal) / startVal) * 100 : 0;
  const isUp = change >= 0;
  const lineColor = isUp ? 'rgb(34,197,94)' : 'rgb(239,68,68)';
  const gradientTop = isUp ? 'rgba(34,197,94,0.28)' : 'rgba(239,68,68,0.28)';
  const gradientMid = isUp ? 'rgba(34,197,94,0.07)' : 'rgba(239,68,68,0.07)';

  const chartData = {
    labels: periodData.map((d) => d.date),
    datasets: [
      {
        label: 'Portfolio Value',
        data: periodData.map((d) => d.value),
        borderColor: lineColor,
        backgroundColor: (context: ScriptableContext<'line'>) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea) return 'transparent';
          const g = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          g.addColorStop(0, gradientTop);
          g.addColorStop(0.55, gradientMid);
          g.addColorStop(1, 'rgba(0,0,0,0)');
          return g;
        },
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: lineColor,
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 2,
        fill: true,
        tension: 0.42,
      },
    ],
  };

  const gridColor = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)';
  const tickColor = darkMode ? '#666' : '#999';

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: darkMode ? 'rgba(10,10,10,0.92)' : 'rgba(255,255,255,0.95)',
        titleColor: darkMode ? '#888' : '#666',
        bodyColor: darkMode ? '#fff' : '#111',
        borderColor: darkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8,
        callbacks: {
          label: (ctx: TooltipItem<'line'>) =>
            ` $${Number(ctx.parsed.y).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: { color: tickColor, font: { size: 10 }, maxTicksLimit: 7, maxRotation: 0 },
      },
      y: {
        position: 'right',
        grid: { color: gridColor },
        border: { display: false },
        ticks: {
          color: tickColor,
          font: { size: 10 },
          callback: (v: string | number) => `$${(Number(v) / 1000).toFixed(0)}K`,
          maxTicksLimit: 4,
        },
      },
    },
    interaction: { mode: 'index', axis: 'x', intersect: false },
    animation: { duration: 1100, easing: 'easeInOutQuart' },
  };

  return (
    <div>
      {/* Period selector + % change */}
      <div className="flex items-center justify-between mb-4">
        <div className={`flex items-center gap-1.5 text-sm font-bold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          <span>{isUp ? '▲' : '▼'}</span>
          <span>{isUp ? '+' : ''}{change.toFixed(2)}%</span>
          <span className="text-muted-foreground font-normal text-xs ml-1">this period</span>
        </div>
        <div className="flex gap-0.5 bg-muted rounded-lg p-0.5">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all duration-200 ${
                period === p
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Chart — key forces remount + fresh draw animation on period change */}
      <div className="h-64" key={period}>
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}
