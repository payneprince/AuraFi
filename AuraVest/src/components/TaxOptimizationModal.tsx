'use client';

import { useState } from 'react';
import { X, DollarSign, TrendingDown, AlertTriangle, CheckCircle, ChevronRight } from 'lucide-react';
import { taxOptimization } from '@/lib/mockData';

interface TaxOptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const STEP_LABELS = ['Opportunities', 'Wash Sales', 'Confirm'];

export default function TaxOptimizationModal({ isOpen, onClose }: TaxOptimizationModalProps) {
  const [step, setStep] = useState(1);
  const [executed, setExecuted] = useState(false);

  if (!isOpen) return null;

  const resetAndClose = () => {
    setStep(1);
    setExecuted(false);
    onClose();
  };

  if (executed) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
        <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-2xl shadow-black/40 overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          <div className="h-1 w-full bg-gradient-to-r from-green-600 via-green-400 to-emerald-400" />
          <div className="px-6 py-10 text-center space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-full bg-green-500/15 animate-ping" style={{ animationDuration: '1.6s' }} />
              <div className="absolute inset-0 rounded-full bg-green-500/15 animate-ping" style={{ animationDuration: '1.6s', animationDelay: '0.35s' }} />
              <div className="absolute inset-2 rounded-full bg-green-500/15 border border-green-500/25 flex items-center justify-center">
                <CheckCircle className="w-7 h-7 text-green-400" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-base">Tax Optimization Executed</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Estimated savings: <span className="text-green-400 font-semibold">${taxOptimization.potentialSavings.toLocaleString()}</span>
              </p>
            </div>
            <div className="space-y-1.5 text-left">
              {taxOptimization.opportunities.map((opp, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between px-3 py-2 rounded-xl bg-white/[0.04] border border-white/6 text-sm animate-in fade-in slide-in-from-bottom-1 fill-mode-both"
                  style={{ animationDelay: `${idx * 70}ms`, animationDuration: '300ms' }}
                >
                  <span className="font-semibold">{opp.asset}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-green-500/15 text-green-400">
                    Saved ${opp.potentialTaxSavings.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={resetAndClose}
              className="mt-2 px-6 py-2 rounded-xl bg-green-500 hover:bg-green-400 text-white text-sm font-bold transition-colors active:scale-95"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={(e) => { if (e.target === e.currentTarget) resetAndClose(); }}
    >
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full max-h-[88vh] overflow-hidden flex flex-col shadow-2xl shadow-black/40 animate-in fade-in zoom-in-95 duration-200">

        {/* Accent bar */}
        <div className="h-1 w-full bg-gradient-to-r from-green-700 via-green-500 to-emerald-400 flex-shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-green-500/15 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">Tax Optimization</h2>
              <p className="text-[11px] text-muted-foreground">Tax-loss harvesting wizard</p>
            </div>
          </div>
          <button onClick={resetAndClose} className="p-1.5 hover:bg-accent rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 px-6 py-4 flex-shrink-0">
          {STEP_LABELS.map((label, i) => {
            const num = i + 1;
            const done = step > num;
            const active = step === num;
            return (
              <div key={num} className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-200 ${
                    done   ? 'bg-green-500 text-white' :
                    active ? 'bg-green-500/20 text-green-400 border border-green-500/40' :
                             'bg-muted text-muted-foreground'
                  }`}>
                    {done ? <CheckCircle className="w-3.5 h-3.5" /> : num}
                  </div>
                  <span className={`text-xs font-medium ${active ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <ChevronRight className={`w-3.5 h-3.5 ${step > num ? 'text-green-500' : 'text-muted-foreground/40'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 pb-5 space-y-4">

          {/* ── STEP 1: Opportunities ── */}
          {step === 1 && (
            <>
              {/* Summary tiles */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-2xl bg-green-500/10 border border-green-500/20 p-4 text-center">
                  <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <div className="text-xl font-black text-green-400">${taxOptimization.potentialSavings.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">Potential savings</div>
                </div>
                <div className="rounded-2xl bg-red-500/10 border border-red-500/20 p-4 text-center">
                  <TrendingDown className="w-5 h-5 text-red-400 mx-auto mb-1" />
                  <div className="text-xl font-black text-red-400">${taxOptimization.harvestableLosses.toLocaleString()}</div>
                  <div className="text-[10px] text-muted-foreground">Harvestable losses</div>
                </div>
              </div>

              {/* Opportunities */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Available Opportunities ({taxOptimization.opportunities.length})</p>
                {taxOptimization.opportunities.map((opp, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/6 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{opp.asset}</span>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-green-500/15 text-green-400">
                        Save ${opp.potentialTaxSavings.toFixed(2)}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <div>Unrealised loss <span className="font-semibold text-red-400">${opp.currentLoss.toFixed(2)}</span></div>
                      <div>Harvest qty <span className="font-semibold text-foreground">{opp.harvestAmount} units</span></div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* ── STEP 2: Wash Sales ── */}
          {step === 2 && (
            <>
              <p className="text-xs text-muted-foreground">Review wash-sale rules to avoid disallowed loss deductions before proceeding.</p>
              <div className="space-y-3">
                {taxOptimization.washSaleRisk.map((risk, i) => (
                  <div key={i} className="rounded-2xl bg-white/[0.03] border border-white/6 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                        risk.risk === 'High' ? 'text-red-400' :
                        risk.risk === 'Medium' ? 'text-yellow-400' : 'text-green-400'
                      }`} />
                      <div className="flex-1 space-y-1 text-sm">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{risk.asset}</span>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                            risk.risk === 'High'   ? 'bg-red-500/15 text-red-400' :
                            risk.risk === 'Medium' ? 'bg-yellow-500/15 text-yellow-400' :
                                                     'bg-green-500/15 text-green-400'
                          }`}>{risk.risk} Risk</span>
                        </div>
                        <div className="text-xs text-muted-foreground">Last sale: {new Date(risk.lastSale).toLocaleDateString()}</div>
                        <div className="text-xs text-muted-foreground">Restriction ends: <span className="font-semibold text-foreground">{new Date(risk.restrictionEnds).toLocaleDateString()}</span></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-blue-500/8 border border-blue-500/20 px-4 py-3 text-xs text-muted-foreground">
                <span className="font-semibold text-blue-400">Wash Sale Rule: </span>
                You cannot claim a loss if you purchase the same or substantially identical security within 30 days before or after the sale.
              </div>
            </>
          )}

          {/* ── STEP 3: Confirm ── */}
          {step === 3 && (
            <>
              <p className="text-xs text-muted-foreground">Review and confirm the tax-loss harvesting trades below.</p>
              <div className="space-y-2">
                {taxOptimization.opportunities.map((opp, i) => (
                  <div key={i} className="rounded-2xl bg-green-500/5 border border-green-500/20 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{opp.asset} — Tax-Loss Harvest</span>
                      <CheckCircle className="w-4 h-4 text-green-400" />
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <div>Sell <span className="font-semibold text-foreground">{opp.harvestAmount} units</span> at current market price</div>
                      <div>Realise loss of <span className="font-semibold text-red-400">${opp.currentLoss.toFixed(2)}</span></div>
                      <div>Potential savings: <span className="font-semibold text-green-400">${opp.potentialTaxSavings.toFixed(2)}</span></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl bg-yellow-500/8 border border-yellow-500/20 px-4 py-3 flex items-start gap-2.5 text-xs text-muted-foreground">
                <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <span>These trades will realise capital losses. Consult your tax advisor before proceeding — tax laws vary by jurisdiction.</span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-border/60 flex-shrink-0">
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={step === 1}
            className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Back
          </button>
          <div className="flex gap-2">
            <button onClick={resetAndClose} className="px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-colors">
              Cancel
            </button>
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-all active:scale-95"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={() => setExecuted(true)}
                className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white text-sm font-semibold transition-all active:scale-95"
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
