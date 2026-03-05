'use client';

import { useState } from 'react';
import { X, Target, TrendingUp, Calendar, DollarSign, BarChart3 } from 'lucide-react';
import { monteCarloData } from '@/lib/mockData';

interface GoalsPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoalsPlanningModal({ isOpen, onClose }: GoalsPlanningModalProps) {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Target },
    { id: 'projections', label: 'Projections', icon: TrendingUp },
    { id: 'monte-carlo', label: 'Monte Carlo', icon: BarChart3 }
  ];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Target className="w-6 h-6 text-crimson-500" />
            <h2 className="text-xl font-semibold">Goals Planning & Monte Carlo Analysis</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-crimson-500 text-crimson-500'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-crimson-500/10 border border-crimson-500/20 rounded-lg text-center">
                  <Target className="w-8 h-8 text-crimson-500 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-crimson-500 mb-1">{monteCarloData.results.successRate}%</p>
                  <p className="text-sm text-muted-foreground">Success Rate</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Chance of reaching ${monteCarloData.targetAmount.toLocaleString()}
                  </p>
                </div>

                <div className="p-6 bg-slate-900/10 border border-slate-900/20 rounded-lg text-center">
                  <DollarSign className="w-8 h-8 text-slate-900 dark:text-white mx-auto mb-3" />
                  <p className="text-3xl font-bold text-slate-900 dark:text-white mb-1">${monteCarloData.results.median.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Median Projection</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Most likely outcome in {monteCarloData.timeHorizon} years
                  </p>
                </div>

                <div className="p-6 bg-green-500/10 border border-green-500/20 rounded-lg text-center">
                  <Calendar className="w-8 h-8 text-green-500 mx-auto mb-3" />
                  <p className="text-3xl font-bold text-green-500 mb-1">{monteCarloData.timeHorizon}</p>
                  <p className="text-sm text-muted-foreground">Years to Goal</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    ${monteCarloData.monthlyContribution}/month contribution
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Current Setup</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 border border-border rounded-lg">
                      <span className="text-muted-foreground">Current Savings</span>
                      <span className="font-semibold">${monteCarloData.currentSavings.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 border border-border rounded-lg">
                      <span className="text-muted-foreground">Monthly Contribution</span>
                      <span className="font-semibold">${monteCarloData.monthlyContribution}</span>
                    </div>
                    <div className="flex justify-between p-3 border border-border rounded-lg">
                      <span className="text-muted-foreground">Target Amount</span>
                      <span className="font-semibold">${monteCarloData.targetAmount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 border border-border rounded-lg">
                      <span className="text-muted-foreground">Time Horizon</span>
                      <span className="font-semibold">{monteCarloData.timeHorizon} years</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Risk Assessment</h3>
                  <div className="space-y-3">
                    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                      <p className="font-medium text-yellow-700 dark:text-yellow-300">Conservative Scenario</p>
                      <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                        ${monteCarloData.results.percentile10.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">10th percentile outcome</p>
                    </div>
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="font-medium text-green-700 dark:text-green-300">Optimistic Scenario</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        ${monteCarloData.results.percentile90.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">90th percentile outcome</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'projections' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Year-by-Year Projections</h3>
                <p className="text-muted-foreground">
                  Projected portfolio value over time based on current contribution rate and assumed returns.
                </p>
              </div>

              <div className="space-y-4">
                {monteCarloData.projections.map((projection, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-primary">{projection.year}Y</span>
                      </div>
                      <div>
                        <p className="font-medium">Year {projection.year}</p>
                        <p className="text-sm text-muted-foreground">Projected value range</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold">${projection.median.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        ${projection.low.toLocaleString()} - ${projection.high.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-crimson-500/10 border border-crimson-500/20 rounded-lg">
                <h4 className="font-medium text-crimson-700 dark:text-crimson-400 mb-2">Projection Assumptions</h4>
                <ul className="text-sm text-crimson-700 dark:text-crimson-400 space-y-1">
                  <li>• Assumes 7% average annual return with market volatility</li>
                  <li>• Monthly contributions of ${monteCarloData.monthlyContribution}</li>
                  <li>• Does not account for taxes, fees, or inflation adjustments</li>
                  <li>• Past performance does not guarantee future results</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'monte-carlo' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Monte Carlo Simulation Results</h3>
                <p className="text-muted-foreground">
                  1,000 simulated scenarios showing the range of possible outcomes for your investment goal.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-medium">Simulation Statistics</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between p-3 border border-border rounded-lg">
                      <span className="text-muted-foreground">Number of Simulations</span>
                      <span className="font-semibold">{monteCarloData.simulations.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 border border-border rounded-lg">
                      <span className="text-muted-foreground">Median Outcome</span>
                      <span className="font-semibold">${monteCarloData.results.median.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 border border-border rounded-lg">
                      <span className="text-muted-foreground">Average Outcome</span>
                      <span className="font-semibold">${monteCarloData.results.average.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between p-3 border border-border rounded-lg">
                      <span className="text-muted-foreground">Success Rate</span>
                      <span className="font-semibold text-green-500">{monteCarloData.results.successRate}%</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Probability Ranges</h4>
                  <div className="space-y-3">
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="font-medium text-red-700 dark:text-red-300">Worst Case (10th %)</p>
                      <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                        ${monteCarloData.results.percentile10.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">10% chance of worse outcome</p>
                    </div>
                    <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <p className="font-medium text-green-700 dark:text-green-300">Best Case (90th %)</p>
                      <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                        ${monteCarloData.results.percentile90.toLocaleString()}
                      </p>
                      <p className="text-sm text-muted-foreground">10% chance of better outcome</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <h4 className="font-medium text-yellow-700 dark:text-yellow-300 mb-2">Understanding Monte Carlo</h4>
                <p className="text-sm text-yellow-700 dark:text-yellow-300">
                  Monte Carlo simulation runs thousands of scenarios with random market returns to show the range of possible outcomes.
                  This helps you understand the uncertainty and risk associated with your investment goals.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
          >
            Close
          </button>
          <button
            onClick={() => {
              // Simulate goal settings update
              // Here you would typically call an API to update goal settings
              // For now, we'll show a success message instead of alert
              alert('Goal settings updated successfully!');
            }}
            className="px-4 py-2 bg-crimson-600 text-white rounded-lg hover:bg-crimson-700"
          >
            Update Goal Settings
          </button>
        </div>
      </div>
    </div>
  );
}
