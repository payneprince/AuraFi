'use client';

import { Sparkles, TrendingUp, Shield, DollarSign, Target, AlertCircle } from 'lucide-react';
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

  return (
    <div className="bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-indigo-500/10 border border-primary/20 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600/10 to-blue-600/10 border-b border-primary/20 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">AuraAI Insights</h3>
              <p className="text-xs text-muted-foreground">AI-powered portfolio analysis</p>
            </div>
          </div>
          <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded-full font-medium">
            Live
          </span>
        </div>

        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'insights'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Insights
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'metrics'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Metrics
          </button>
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              activeTab === 'recommendations'
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Actions
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'insights' && (
          <div className="space-y-3">
            {insights.map((insight) => {
              const Icon = insight.icon;
              return (
                <div key={insight.id} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 hover:bg-card/80 transition-all">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-sm mb-1">{insight.title}</h4>
                      <p className="text-xs text-muted-foreground mb-2">{insight.content}</p>
                      <button className="text-xs text-primary font-medium hover:underline">
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
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {metrics.map((metric, idx) => (
                <div key={idx} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                  <p className={`text-xl font-bold ${metric.color}`}>{metric.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{metric.subtitle}</p>
                </div>
              ))}
            </div>
            
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="w-4 h-4 text-blue-500" />
                <h4 className="text-sm font-semibold">Risk Assessment</h4>
              </div>
              <p className="text-xs text-muted-foreground mb-2">
                Your portfolio has a {riskMetrics.score > 70 ? 'high' : riskMetrics.score < 40 ? 'low' : 'moderate'} risk profile with exposure across {portfolioData.assets.length} asset classes.
              </p>
              <div className="w-full bg-muted rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all ${
                    riskMetrics.score > 70 ? 'bg-red-500' : riskMetrics.score < 40 ? 'bg-green-500' : 'bg-yellow-500'
                  }`}
                  style={{ width: `${riskMetrics.score}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div className="space-y-3">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <h4 className="font-semibold text-sm mb-1">{rec.action}</h4>
                    <p className="text-xs text-muted-foreground">{rec.reason}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-medium text-muted-foreground">Confidence</div>
                    <div className={`text-sm font-bold ${rec.confidence >= 80 ? 'text-green-500' : rec.confidence >= 60 ? 'text-yellow-500' : 'text-orange-500'}`}>
                      {rec.confidence}%
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="flex-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-md text-xs font-medium hover:bg-primary/90 transition-colors">
                    Execute
                  </button>
                  <button className="px-3 py-1.5 bg-muted text-muted-foreground rounded-md text-xs font-medium hover:bg-muted/70 transition-colors">
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-primary/20 p-3 bg-muted/30">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <AlertCircle className="w-3 h-3" />
            <span>Updated 2 min ago</span>
          </div>
          <button className="text-primary font-medium hover:underline">
            View full analysis
          </button>
        </div>
      </div>
    </div>
  );
}
