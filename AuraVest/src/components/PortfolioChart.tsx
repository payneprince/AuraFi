'use client';

import { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  type ChartOptions,
  type TooltipItem,
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

interface ChartDataPoint {
  date: string;
  value: number;
}

export default function PortfolioChart({ data }: { data: ChartDataPoint[] }) {
  const [isClient, setIsClient] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== 'undefined') {
      setDarkMode(document.documentElement.classList.contains('dark'));
    }
  }, []);

  if (!isClient) return <div className="h-64 bg-muted rounded-lg animate-pulse" />;

  const chartData = {
    labels: data.map((d) => d.date),
    datasets: [
      {
        label: 'Portfolio Value ($)',
        data: data.map((d) => d.value),
        borderColor: darkMode ? 'rgb(124, 58, 237)' : 'rgb(124, 58, 237)',
        backgroundColor: darkMode ? 'rgba(124, 58, 237, 0.1)' : 'rgba(124, 58, 237, 0.1)',
        borderWidth: 3,
        pointRadius: 3,
        pointBackgroundColor: darkMode ? 'rgb(124, 58, 237)' : 'rgb(124, 58, 237)',
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        callbacks: {
          label: (context: TooltipItem<'line'>) =>
            ` $${Number(context.parsed.y ?? 0).toLocaleString('en-US', {
              minimumFractionDigits: 0,
              maximumFractionDigits: 0,
            })}`,
        },
        backgroundColor: darkMode ? 'rgb(17, 17, 17)' : '#ffffff',
        titleColor: darkMode ? '#ffffff' : '#000000',
        bodyColor: darkMode ? '#ffffff' : '#000000',
        borderColor: darkMode ? 'rgb(55, 55, 55)' : 'rgb(220, 220, 220)',
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: darkMode ? '#ffffff' : '#000000',
          font: {
            size: 11,
          },
        },
      },
      y: {
        grid: {
          color: darkMode ? 'rgb(55, 55, 55)' : 'rgb(220, 220, 220)',
        },
        ticks: {
          color: darkMode ? '#ffffff' : '#000000',
          font: {
            size: 11,
          },
          callback: (tickValue: string | number) => `$${(Number(tickValue) / 1000).toFixed(0)}K`,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
    animation: {
      duration: 500,
    },
  };

  return (
    <div className="h-64">
      <Line data={chartData} options={options} />
    </div>
  );
}