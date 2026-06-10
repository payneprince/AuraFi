'use client';

import { useState } from 'react';
import { X, Target, TrendingUp, Calendar, DollarSign, BarChart3, CheckCircle } from 'lucide-react';
import { monteCarloData } from '@/lib/mockData';

interface GoalsPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoalsPlanningModal({ isOpen, onClose }: GoalsPlanningModalProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [savedFlash, setSavedFlash] = useState(false);

  if (!isOpen) return null;

  const handleUpdateGoalSettings = () => {
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2200);
  };

  const tabs = [
    { id: 'overview',    label: 'Overview',    icon: Target },
    { id: 'projections', label: 'Projections', icon: TrendingUp },
    { id: 'monte-carlo', label: 'Monte Carlo',  icon: BarChart3 },
  ];

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border rounded-2xl max-w-3xl w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200">

        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-purple-700 via-purple-500 to-indigo-500 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 flex items-center justify-center">
              <Target className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">Goals Planning</h2>
              <p className="text-[11px] text-muted-foreground">Monte Carlo Analysis · {monteCarloData.simulations.toLocaleString()} simulations</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-6 pt-3 pb-0 flex-shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 ${
                  active
                    ? 'bg-purple-500/15 text-purple-400 border border-purple-500/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">

          {/* ── OVERVIEW ── */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Top stat row */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Target,    color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', label: 'Success Rate',      value: `${monteCarloData.results.successRate}%`,       sub: `Chance of reaching $${monteCarloData.targetAmount.toLocaleString()}` },
                  { icon: DollarSign, color: 'text-foreground', bg: 'bg-white/[0.04] border-white/8',       label: 'Median Projection', value: `$${monteCarloData.results.median.toLocaleString()}`, sub: `Most likely in ${monteCarloData.timeHorizon}yr` },
                  { icon: Calendar,  color: 'text-green-400',  bg: 'bg-green-500/10 border-green-500/20',  label: 'Time Horizon',      value: `${monteCarloData.timeHorizon} yrs`,            sub: `$${monteCarloData.monthlyContribution}/mo contribution` },
                ].map((s) => (
                  <div key={s.label} className={`rounded-2xl border ${s.bg} p-4 text-center`}>
                    <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
                    <div className={`text-2xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">{s.label}</div>
                    <div className="text-[10px] text-muted-foreground/70 mt-0.5">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Current setup + scenarios */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Current Setup</h3>
                  {[
                    { label: 'Current Savings',     value: `$${monteCarloData.currentSavings.toLocaleString()}` },
                    { label: 'Monthly Contribution', value: `$${monteCarloData.monthlyContribution.toLocaleString()}` },
                    { label: 'Target Amount',        value: `$${monteCarloData.targetAmount.toLocaleString()}` },
                    { label: 'Time Horizon',         value: `${monteCarloData.timeHorizon} years` },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center px-3 py-2.5 rounded-xl bg-white/[0.04] border border-white/6 text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className="font-semibold">{row.value}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Scenario Range</h3>
                  <div className="rounded-2xl bg-red-500/8 border border-red-500/20 p-3.5">
                    <p className="text-xs font-semibold text-red-400 mb-0.5">Conservative (10th %)</p>
                    <p className="text-xl font-black text-red-400">${monteCarloData.results.percentile10.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">10% chance of worse outcome</p>
                  </div>
                  <div className="rounded-2xl bg-green-500/8 border border-green-500/20 p-3.5">
                    <p className="text-xs font-semibold text-green-400 mb-0.5">Optimistic (90th %)</p>
                    <p className="text-xl font-black text-green-400">${monteCarloData.results.percentile90.toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground">10% chance of better outcome</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PROJECTIONS ── */}
          {activeTab === 'projections' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">Projected portfolio value over time based on current contribution rate and assumed 7% average annual return.</p>
              <div className="space-y-3">
                {monteCarloData.projections.map((p, i) => {
                  const pct = (p.median / monteCarloData.targetAmount) * 100;
                  return (
                    <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/6 p-4">
                      <div className="flex items-center justify-between mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-primary">{p.year}Y</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold">Year {p.year}</p>
                            <p className="text-[10px] text-muted-foreground">${p.low.toLocaleString()} — ${p.high.toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold">${p.median.toLocaleString()}</p>
                          <p className="text-[10px] text-muted-foreground">median</p>
                        </div>
                      </div>
                      {/* Progress toward target */}
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-indigo-400 rounded-full transition-all duration-700"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[10px] text-muted-foreground">{pct.toFixed(0)}% of target</span>
                        <span className="text-[10px] text-muted-foreground">Target: ${monteCarloData.targetAmount.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="rounded-2xl bg-purple-500/8 border border-purple-500/20 px-4 py-3">
                <p className="text-xs font-semibold text-purple-400 mb-1.5">Projection Assumptions</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 7% average annual return with market volatility</li>
                  <li>• ${monteCarloData.monthlyContribution}/mo contributions throughout</li>
                  <li>• Does not account for taxes, fees, or inflation</li>
                  <li>• Past performance does not guarantee future results</li>
                </ul>
              </div>
            </div>
          )}

          {/* ── MONTE CARLO ── */}
          {activeTab === 'monte-carlo' && (
            <div className="space-y-4">
              <p className="text-xs text-muted-foreground">{monteCarloData.simulations.toLocaleString()} simulated scenarios showing the range of possible outcomes for your investment goal.</p>

              {/* Success ring + stats side by side */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl bg-white/[0.03] border border-white/6 p-5 flex flex-col items-center justify-center gap-3">
                  <div className="relative w-28 h-28">
                    <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
                      <circle cx="40" cy="40" r="32" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                      <circle cx="40" cy="40" r="32" fill="none" stroke="#a855f7" strokeWidth="8" strokeLinecap="round"
                        strokeDasharray={`${(monteCarloData.results.successRate / 100) * 201} 201`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-black text-purple-400 leading-none">{monteCarloData.results.successRate}%</span>
                      <span className="text-[10px] text-muted-foreground">success</span>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground text-center">Probability of reaching<br/><span className="font-semibold text-foreground">${monteCarloData.targetAmount.toLocaleString()}</span> in {monteCarloData.timeHorizon} years</p>
                </div>

                <div className="space-y-2">
                  <h4 className="text-sm font-semibold">Simulation Stats</h4>
                  {[
                    { label: 'Simulations run', value: monteCarloData.simulations.toLocaleString() },
                    { label: 'Median outcome',  value: `$${monteCarloData.results.median.toLocaleString()}` },
                    { label: 'Average outcome', value: `$${monteCarloData.results.average.toLocaleString()}` },
                    { label: 'Success rate',    value: `${monteCarloData.results.successRate}%`, colored: true },
                  ].map((row) => (
                    <div key={row.label} className="flex justify-between items-center px-3 py-2 rounded-xl bg-white/[0.04] border border-white/6 text-sm">
                      <span className="text-muted-foreground">{row.label}</span>
                      <span className={`font-semibold ${row.colored ? 'text-green-400' : ''}`}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Probability outcomes */}
              <div className="space-y-2">
                <h4 className="text-sm font-semibold">Probability Outcomes</h4>
                {[
                  { label: 'Worst case (10th %)', value: monteCarloData.results.percentile10, sub: '10% chance of worse', color: 'text-red-400', bg: 'bg-red-500/8 border-red-500/20', bar: 'bg-red-400' },
                  { label: 'Median (50th %)',     value: monteCarloData.results.median,        sub: 'Most likely outcome',  color: 'text-yellow-400', bg: 'bg-yellow-500/8 border-yellow-500/20', bar: 'bg-yellow-400' },
                  { label: 'Best case (90th %)',  value: monteCarloData.results.percentile90,  sub: '10% chance of better', color: 'text-green-400', bg: 'bg-green-500/8 border-green-500/20', bar: 'bg-green-400' },
                ].map((s) => (
                  <div key={s.label} className={`rounded-2xl border ${s.bg} px-4 py-3`}>
                    <div className="flex justify-between items-start mb-1.5">
                      <div>
                        <p className={`text-xs font-semibold ${s.color}`}>{s.label}</p>
                        <p className="text-[10px] text-muted-foreground">{s.sub}</p>
                      </div>
                      <p className={`text-lg font-black ${s.color}`}>${s.value.toLocaleString()}</p>
                    </div>
                    <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                      <div className={`h-full ${s.bar} opacity-70 rounded-full`} style={{ width: `${(s.value / monteCarloData.results.percentile90) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-white/[0.03] border border-white/6 px-4 py-3 text-xs text-muted-foreground">
                Monte Carlo runs thousands of scenarios with randomised market returns to show the uncertainty around your goal. A 78%+ success rate is generally considered a healthy plan.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="relative flex items-center justify-end gap-3 px-6 py-4 border-t border-border/60 flex-shrink-0">
          {savedFlash && (
            <div className="absolute left-6 flex items-center gap-2 text-sm font-medium text-green-400 animate-in fade-in slide-in-from-left-2 duration-300">
              <div className="relative w-5 h-5 flex-shrink-0">
                <div className="absolute inset-0 rounded-full bg-green-500/20 animate-ping" style={{ animationDuration: '1.4s' }} />
                <div className="absolute inset-0 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center">
                  <CheckCircle className="w-3 h-3 text-green-400" />
                </div>
              </div>
              Goal settings updated
            </div>
          )}
          <button onClick={onClose} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-colors">
            Close
          </button>
          <button
            onClick={handleUpdateGoalSettings}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold transition-all active:scale-95"
          >
            Update Goal Settings
          </button>
        </div>
      </div>
    </div>
  );
}
