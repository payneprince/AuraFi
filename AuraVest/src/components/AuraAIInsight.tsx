'use client';

import { Sparkles, TrendingUp, Shield, DollarSign, Target, AlertCircle, Zap } from 'lucide-react';
import { portfolioData, riskMetrics } from '@/lib/mockData';
import { useState } from 'react';

export default function AuraAIInsight() {
  const [activeTab, setActiveTab] = useState('insights');

  // Simulated AI insights based on real data
  const insights = [
    {
      id: 1,
      icon: Target,
      title: 'Portfolio Diversification',
      content: riskMetrics.score > 70
        ? 'Your portfolio risk is high. Consider reducing crypto exposure by 5% and adding bonds or gold.'
        : riskMetrics.score < 40
        ? 'You are well-diversified! Your risk score is low and stable.'
        : 'Moderate risk detected. Adding defensive stocks (e.g., utilities) could improve resilience.',
      type: 'recommendation',
      action: 'Rebalance Portfolio',
    },
    {
      id: 2,
      icon: TrendingUp,
      title: 'Market Opportunity',
      content: portfolioData.change24h > 3
        ? `Strong momentum! Your portfolio gained ${portfolioData.change24h.toFixed(1)}% in 24h — consider scaling winning positions.`
        : portfolioData.change24h < -2
        ? `Volatility alert: Your portfolio declined ${Math.abs(portfolioData.change24h).toFixed(1)}%. AuraAI suggests dollar-cost averaging into dips.`
        : 'Markets are stable. A great time to review your long-term allocation.',
      type: 'opportunity',
      action: 'View Opportunities',
    },
    {
      id: 3,
      icon: DollarSign,
      title: 'Tax Optimization',
      content: 'You have $8,200 in unrealized losses. AuraAI suggests tax-loss harvesting before year-end to reduce your tax liability.',
      type: 'tax',
      action: 'Optimize Taxes',
    },
  ];

  const metrics = [
    {
      label: 'Risk Score',
      value: riskMetrics.score.toFixed(0),
      subtitle: riskMetrics.score > 70 ? 'High' : riskMetrics.score < 40 ? 'Low' : 'Moderate',
      color: riskMetrics.score > 70 ? 'text-red-500' : riskMetrics.score < 40 ? 'text-green-500' : 'text-yellow-500',
    },
    {
      label: 'Diversification',
      value: '7.2',
      subtitle: 'Good spread',
      color: 'text-blue-500',
    },
    {
      label: 'Performance',
      value: portfolioData.change24h >= 0 ? `+${portfolioData.change24h.toFixed(1)}%` : `${portfolioData.change24h.toFixed(1)}%`,
      subtitle: '24h change',
      color: portfolioData.change24h >= 0 ? 'text-green-500' : 'text-red-500',
    },
  ];

  const recommendations = [
    { action: 'Increase BTC holdings', confidence: 87, reason: 'Strong upward trend detected' },
    { action: 'Take profit on AAPL', confidence: 72, reason: 'Near resistance level' },
    { action: 'Add defensive positions', confidence: 65, reason: 'Market volatility increasing' },
  ];

  const tabs = [
    { id: 'insights', label: 'Insights' },
    { id: 'metrics', label: 'Metrics' },
    { id: 'recommendations', label: 'Actions' },
  ];

  return (
    <div className="relative bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-indigo-500/10 border border-primary/20 rounded-lg overflow-hidden group/ai">
      {/* Ambient glow */}
      <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-purple-500/10 blur-3xl pointer-events-none animate-pulse [animation-duration:4s]" />
      <div className="absolute -bottom-24 -left-16 w-56 h-56 rounded-full bg-blue-500/10 blur-3xl pointer-events-none animate-pulse [animation-duration:5s]" />

      {/* Header */}
      <div className="relative bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-b border-primary/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5">
            <div className="relative flex-shrink-0" style={{ width: 36, height: 36 }}>
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-purple-400 border-r-blue-400 animate-spin [animation-duration:3s]" />
              <div className="absolute inset-[3px] rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <Sparkles className="w-4 h-4 text-white animate-pulse" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm">AuraAI Insights</h3>
              <p className="text-xs text-muted-foreground">AI-powered portfolio analysis</p>
            </div>
          </div>
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 bg-primary/15 text-primary rounded-full font-medium">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-primary" />
            </span>
            Live
          </span>
        </div>

        {/* Tabs with animated sliding indicator */}
        <div className="relative flex gap-2 p-1 bg-muted/40 rounded-lg w-fit">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative z-10 px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-300 ${
                activeTab === tab.id
                  ? 'text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {activeTab === tab.id && (
                <span className="absolute inset-0 -z-10 rounded-md bg-primary shadow-md shadow-primary/30 animate-in fade-in zoom-in-95 duration-200" />
              )}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="relative p-4">
        {activeTab === 'insights' && (
          <div className="space-y-3">
            {insights.map((insight, idx) => {
              const Icon = insight.icon;
              return (
                <div
                  key={insight.id}
                  className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 hover:bg-card/90 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="relative w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20">
                      <span className="absolute inset-0 rounded-lg bg-primary/20 opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
                      <Icon className="relative w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{insight.content}</p>
                      <button className="text-xs text-primary font-medium hover:underline inline-flex items-center gap-1 transition-transform duration-200 group-hover:translate-x-0.5">
                        {insight.action} →
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'metrics' && (
          <div className="space-y-4 animate-in fade-in duration-300">
            <div className="grid grid-cols-3 gap-3">
              {metrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30 animate-in fade-in zoom-in-95 fill-mode-both"
                  style={{ animationDelay: `${idx * 90}ms` }}
                >
                  <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                  <p className={`text-xl font-bold tabular-nums ${metric.color}`}>{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
                </div>
              ))}
            </div>

            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 transition-all duration-300 hover:shadow-md">
              <div className="flex items-center gap-2 mb-2">
                <div className="relative w-7 h-7 rounded-md bg-blue-500/10 flex items-center justify-center">
                  <span className="absolute inset-0 rounded-md bg-blue-500/20 animate-ping [animation-duration:2.5s]" />
                  <Shield className="relative w-4 h-4 text-blue-500" />
                </div>
                <h4 className="text-sm font-semibold">Risk Assessment</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Your portfolio has a {riskMetrics.score > 70 ? 'high' : riskMetrics.score < 40 ? 'low' : 'moderate'} risk profile with exposure across {portfolioData.assets.length} asset classes.
              </p>
              <div className="relative w-full bg-muted rounded-full h-2 overflow-hidden">
                <div
                  className={`relative h-2 rounded-full transition-all duration-1000 ease-out overflow-hidden ${
                    riskMetrics.score > 70 ? 'bg-red-500' : riskMetrics.score < 40 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${riskMetrics.score}%` }}
                >
                  <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full animate-[shimmer_2.4s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => {
              const confColor = rec.confidence >= 80 ? 'text-green-500 stroke-green-500' : rec.confidence >= 60 ? 'text-yellow-500 stroke-yellow-500' : 'text-orange-500 stroke-orange-500';
              const circumference = 2 * Math.PI * 16;
              return (
                <div
                  key={idx}
                  className="group bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 hover:bg-card/90 hover:border-primary/30 hover:-translate-y-0.5 hover:shadow-lg transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 fill-mode-both"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start justify-between mb-2 gap-3">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                        <Zap className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-semibold text-sm mb-0.5 truncate">{rec.action}</h4>
                        <p className="text-xs text-muted-foreground truncate">{rec.reason}</p>
                      </div>
                    </div>
                    <div className="relative flex-shrink-0" style={{ width: 40, height: 40 }}>
                      <svg viewBox="0 0 40 40" className="w-full h-full -rotate-90">
                        <circle cx="20" cy="20" r="16" strokeWidth="3" className="fill-none stroke-muted" />
                        <circle
                          cx="20" cy="20" r="16" strokeWidth="3" strokeLinecap="round"
                          className={`fill-none transition-all duration-1000 ease-out ${confColor.split(' ')[1]}`}
                          style={{
                            strokeDasharray: `${circumference}`,
                            strokeDashoffset: `${circumference * (1 - rec.confidence / 100)}`,
                          }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className={`text-[10px] font-bold ${confColor.split(' ')[0]}`}>{rec.confidence}%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 hover:shadow-md hover:shadow-primary/30 transition-all duration-200 hover:scale-[1.02] active:scale-95">
                      Execute
                    </button>
                    <button className="px-3 py-1.5 bg-muted text-muted-foreground rounded-md text-xs font-medium hover:bg-muted/70 hover:scale-[1.02] active:scale-95 transition-all duration-200">
                      Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="relative border-t border-primary/20 p-3 bg-muted/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500" />
            </span>
            <AlertCircle className="w-3 h-3" />
            <span>Updated 2 min ago</span>
          </div>
          <button className="text-primary font-medium hover:underline transition-transform duration-200 hover:translate-x-0.5 inline-block">
            View full analysis →
          </button>
        </div>
      </div>
    </div>
  );
}
