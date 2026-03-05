import React from 'react';
// very small area chart using SVG, no deps
export default function LargeChart({ data = [10, 20, 15, 30, 25, 40, 35], color = '#29C7D9' }: { data?: number[]; color?: string }) {
  const width = 600;
  const height = 160;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((d - min) / range) * height;
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `M0,${height} L${points.split(' ').map(p => p).join(' L ')} L${width},${height} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-40" preserveAspectRatio="none">
      <defs>
        <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.12" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#g)" />
      <polyline fill="none" stroke={color} strokeWidth={2} points={points} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
