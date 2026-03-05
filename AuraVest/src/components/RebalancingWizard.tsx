'use client';

import { useState } from 'react';
import { X, Settings, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface RebalancingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  currentAllocations: Array<{ type: string; value: number; allocation: number }>;
  targetAllocations: Array<{ type: string; target: number }>;
}

export default function RebalancingWizard({
  isOpen,
  onClose,
  currentAllocations,
  targetAllocations
}: RebalancingWizardProps) {
  const [step, setStep] = useState(1);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);

  if (!isOpen) return null;

  const totalValue = currentAllocations.reduce((sum, asset) => sum + asset.value, 0);

  const rebalancingActions = currentAllocations.map(asset => {
    const target = targetAllocations.find(t => t.type === asset.type)?.target || asset.allocation;
    const targetValue = (target / 100) * totalValue;
    const difference = targetValue - asset.value;

    return {
      type: asset.type,
      current: asset.allocation,
      target,
      difference,
      action: difference > 0 ? 'buy' : 'sell',
      amount: Math.abs(difference)
    };
  });

  const handleExecuteRebalancing = () => {
    // Simulate rebalancing execution
    // Here you would typically call an API to execute the rebalancing
    // For now, we'll show a success modal instead of alert
    onClose();
    // You could emit an event or callback here to show success modal
    // For demo purposes, we'll use alert as placeholder
    setTimeout(() => {
      alert('Rebalancing executed successfully! Portfolio has been rebalanced.');
    }, 100);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <Settings className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold">Portfolio Rebalancing Wizard</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Step Indicator */}
          <div className="flex items-center gap-4 mb-6">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= stepNum ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > stepNum ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Current vs Target Allocation</h3>
                <p className="text-muted-foreground mb-4">
                  Review your current portfolio allocation compared to your target allocations.
                </p>
              </div>

              <div className="space-y-3">
                {rebalancingActions.map((action) => (
                  <div key={action.type} className="flex items-center justify-between p-4 border border-border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        action.type === 'Crypto' ? 'bg-purple-500' :
                        action.type === 'Stocks' ? 'bg-blue-500' :
                        action.type === 'Gold' ? 'bg-yellow-500' : 'bg-cyan-500'
                      }`} />
                      <div>
                        <p className="font-medium">{action.type}</p>
                        <p className="text-sm text-muted-foreground">
                          Current: {action.current}% → Target: {action.target}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {action.difference !== 0 && (
                        <div className={`flex items-center gap-1 ${
                          action.difference > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {action.difference > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          <span className="text-sm font-medium">
                            {action.difference > 0 ? '+' : ''}${action.amount.toLocaleString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Select Assets to Rebalance</h3>
                <p className="text-muted-foreground mb-4">
                  Choose which assets you want to include in this rebalancing operation.
                </p>
              </div>

              <div className="space-y-3">
                {rebalancingActions.filter(action => action.difference !== 0).map((action) => (
                  <div key={action.type} className="flex items-center gap-3 p-4 border border-border rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedAssets.includes(action.type)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedAssets([...selectedAssets, action.type]);
                        } else {
                          setSelectedAssets(selectedAssets.filter(asset => asset !== action.type));
                        }
                      }}
                      className="rounded"
                    />
                    <div className="flex-1">
                      <p className="font-medium">{action.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {action.action === 'buy' ? 'Buy' : 'Sell'} ${action.amount.toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedAssets.length === 0 && (
                <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-yellow-500" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Please select at least one asset to rebalance.
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Confirm Rebalancing</h3>
                <p className="text-muted-foreground mb-4">
                  Review the rebalancing actions before executing.
                </p>
              </div>

              <div className="space-y-3">
                {rebalancingActions
                  .filter(action => selectedAssets.includes(action.type))
                  .map((action) => (
                    <div key={action.type} className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium">{action.type}</p>
                          <p className="text-sm text-muted-foreground">
                            {action.action === 'buy' ? 'Buy' : 'Sell'} ${action.amount.toLocaleString()}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          action.action === 'buy'
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-red-500/20 text-red-500'
                        }`}>
                          {action.action.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  <strong>Note:</strong> This will execute {selectedAssets.length} trade(s) to rebalance your portfolio.
                  Make sure you have sufficient funds for buy orders.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-border">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 border border-border rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={step === 2 && selectedAssets.length === 0}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleExecuteRebalancing}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90"
              >
                Execute Rebalancing
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
