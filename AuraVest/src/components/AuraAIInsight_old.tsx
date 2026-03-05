'use client';

import { Sparkles } from 'lucide-react';
import { portfolioData, riskMetrics } from '@/lib/mockData';

export default function AuraAIInsight() {
  // Simulated AI insights based on real data
  const insights = [
    {
      id: 1,
      title: 'Portfolio Diversification',
      content: riskMetrics.score > 70
        ? 'Your portfolio risk is high. Consider reducing crypto exposure by 5% and adding bonds or gold.'
        : riskMetrics.score < 40
        ? 'You’re well-diversified! Your risk score is low and stable.'
        : 'Moderate risk detected. Adding defensive stocks (e.g., utilities) could improve resilience.',
      type: 'recommendation',
    },
    {
      id: 2,
      title: 'Market Opportunity',
      content: portfolioData.change24h > 3
        ? `🚀 Strong momentum! Your portfolio gained ${portfolioData.change24h.toFixed(1)}% in 24h — consider scaling winning positions.`
        : portfolioData.change24h < -2
        ? `⚠️ Volatility alert: Your portfolio declined ${Math.abs(portfolioData.change24h).toFixed(1)}%. AuraAI suggests dollar-cost averaging into dips.`
        : 'Markets are stable. A great time to review your long-term allocation.',
      type: 'opportunity',
    },
    {
      id: 3,
      title: 'Tax Optimization',
      content: 'You have $8,200 in unrealized losses. AuraAI suggests tax-loss harvesting before year-end.',
      type: 'tax',
    },
  ];

  const activeInsight = insights[0]; // Rotate or pick dynamically later

  const bgColor = {
    recommendation: 'from-purple-500/10 to-blue-500/10',
    opportunity: 'from-green-500/10 to-emerald-500/10',
    tax: 'from-amber-500/10 to-orange-500/10',
  }[activeInsight.type];

  return (
    <div className={`bg-gradient-to-r ${bgColor} border border-primary/20 rounded-lg p-4 animate-fadeIn`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">AuraAI Insight</h3>
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded">
              AI-Powered
            </span>
          </div>
          <p className="text-sm text-muted-foreground">{activeInsight.content}</p>
          <button className="mt-2 text-xs text-primary font-medium hover:underline">
            Learn more →
          </button>
        </div>
      </div>
    </div>
  );
}