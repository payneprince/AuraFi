'use client';

import { useState } from 'react';
import { X, DollarSign, TrendingDown, AlertTriangle, CheckCircle } from 'lucide-react';
import { taxOptimization } from '@/lib/mockData';

interface TaxOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function TaxOptimizationModal({ isOpen, onClose }: TaxOptimizationModalProps) {
  const [selectedOpportunities, setSelectedOpportunities] = useState<string[]>([]);
  const [step, setStep] = useState(1);
  const [executed, setExecuted] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep(1);
    setExecuted(false);
    onClose();
  };

  const handleExecuteOptimization = () => {
    setExecuted(true);
  };

  if (executed) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <div className="h-1 w-full bg-gradient-to-r from-green-600 via-green-400 to-emerald-400" />
          <div className="px-6 py-10 text-center space-y-3">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full bg-green-500/15 animate-ping" style={{ animationDuration: '1.6s' }} />
              <div className="absolute inset-0 rounded-full bg-green-500/15 animate-ping" style={{ animationDuration: '1.6s', animationDelay: '0.35s' }} />
              <div className="absolute inset-2 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-500" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base">Tax Optimization Executed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Estimated savings: <span className="text-green-500 font-semibold">${taxOptimization.potentialSavings.toLocaleString()}</span>
              </p>
            </div>
            <div className="space-y-1.5 pt-1 text-left">
              {taxOptimization.opportunities.map((opportunity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50 text-sm animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${idx * 70}ms`, animationDuration: '300ms' }}
                >
                  <span className="font-medium">{opportunity.asset}</span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-500/15 text-green-500">
                    Saved ${opportunity.potentialTaxSavings.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={resetAndClose}
              className="mt-2 px-6 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-white text-sm font-bold transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-card border border-border rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center gap-3">
            <DollarSign className="w-6 h-6 text-green-500" />
            <h2 className="text-xl font-semibold">Tax Optimization</h2>
          </div>
          <button
            onClick={resetAndClose}
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
                  step >= stepNum ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'
                }`}>
                  {stepNum}
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-0.5 mx-2 ${
                    step > stepNum ? 'bg-green-500' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Tax-Loss Harvesting Opportunities</h3>
                <p className="text-muted-foreground mb-4">
                  Identify positions with unrealized losses that can offset capital gains taxes.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="w-5 h-5 text-green-500" />
                    <span className="font-medium text-green-500">Potential Savings</span>
                  </div>
                  <p className="text-2xl font-bold text-green-500">${taxOptimization.potentialSavings.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Estimated tax savings</p>
                </div>

                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingDown className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-500">Harvestable Losses</span>
                  </div>
                  <p className="text-2xl font-bold text-red-500">${taxOptimization.harvestableLosses.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">Available for harvesting</p>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="font-medium">Available Opportunities</h4>
                {taxOptimization.opportunities.map((opportunity, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{opportunity.asset}</span>
                      <span className="text-sm text-green-500 font-medium">
                        Save ${opportunity.potentialTaxSavings.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Current Loss: ${opportunity.currentLoss.toFixed(2)}</p>
                      <p>Harvest Amount: {opportunity.harvestAmount} units</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Wash Sale Considerations</h3>
                <p className="text-muted-foreground mb-4">
                  Review wash sale rules to avoid disallowed loss deductions.
                </p>
              </div>

              <div className="space-y-3">
                {taxOptimization.washSaleRisk.map((risk, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 ${
                        risk.risk === 'High' ? 'text-red-500' :
                        risk.risk === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                      }`} />
                      <div className="flex-1">
                        <p className="font-medium">{risk.asset}</p>
                        <p className="text-sm text-muted-foreground">
                          Risk Level: <span className={`font-medium ${
                            risk.risk === 'High' ? 'text-red-500' :
                            risk.risk === 'Medium' ? 'text-yellow-500' : 'text-green-500'
                          }`}>{risk.risk}</span>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Last Sale: {new Date(risk.lastSale).toLocaleDateString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Restriction Ends: {new Date(risk.restrictionEnds).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-2">Wash Sale Rule Reminder</h4>
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  You cannot claim a loss on a security if you purchase the same or substantially identical security within 30 days before or after the sale.
                </p>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Execute Tax Optimization</h3>
                <p className="text-muted-foreground mb-4">
                  Review and confirm the tax-loss harvesting trades.
                </p>
              </div>

              <div className="space-y-3">
                {taxOptimization.opportunities.map((opportunity, index) => (
                  <div key={index} className="p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{opportunity.asset} Tax-Loss Harvesting</span>
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    </div>
                    <div className="text-sm space-y-1">
                      <p>Sell {opportunity.harvestAmount} units at current market price</p>
                      <p>Realize loss of ${opportunity.currentLoss.toFixed(2)}</p>
                      <p className="text-green-500 font-medium">
                        Potential tax savings: ${opportunity.potentialTaxSavings.toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-yellow-700 dark:text-yellow-300">Important Notice</h4>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      These trades will realize capital losses. Make sure to consult with your tax advisor before proceeding.
                      Tax laws vary by jurisdiction and individual circumstances.
                    </p>
                  </div>
                </div>
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
              onClick={resetAndClose}
              className="px-4 py-2 border border-border rounded-lg hover:bg-accent"
            >
              Cancel
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-500/90"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleExecuteOptimization}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-500/90"
              >
                Execute Optimization
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
