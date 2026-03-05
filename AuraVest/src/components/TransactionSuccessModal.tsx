'use client';

import { useEffect } from 'react';
import { CheckCircle, X } from 'lucide-react';

interface TransactionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: {
    type: 'buy' | 'sell';
    asset: string;
    assetName: string;
    currency?: string;
    quantityType?: 'shares' | 'units';
    amount: number;
    price: number;
    total: number;
  } | null;
  basketTransactions?: Array<{
    asset: string;
    assetName: string;
    currency?: string;
    quantityType?: 'shares' | 'units';
    amount: number;
    price: number;
    total: number;
  }>;
}

export default function TransactionSuccessModal({
  isOpen,
  onClose,
  transaction,
  basketTransactions
}: TransactionSuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto-close after 5 seconds

      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isBasket = basketTransactions && basketTransactions.length > 0;
  const getCurrencyPrefix = (currency?: string) => currency === 'GHS' ? 'GHS ' : '$';
  const formatAmount = (amount: number, quantityType?: 'shares' | 'units') => {
    if (quantityType === 'shares') return `${Math.floor(amount)} shares`;
    return amount.toFixed(4);
  };
  const transactionCurrencyPrefix = getCurrencyPrefix(transaction?.currency);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn" onClick={onClose}>
      <div className="bg-card border border-border rounded-xl max-w-md w-full animate-slideIn shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-green-500">Transaction Successful!</h2>
                <p className="text-sm text-muted-foreground">
                  {isBasket ? 'Basket trade completed' : `${transaction?.type === 'buy' ? 'Purchase' : 'Sale'} completed`}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          {isBasket ? (
            <div className="space-y-3">
              <h3 className="font-semibold">Basket Transactions ({basketTransactions.length})</h3>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {basketTransactions.map((tx, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{tx.assetName} ({tx.asset})</p>
                      <p className="text-xs text-muted-foreground">
                        {formatAmount(tx.amount, tx.quantityType)} @ {getCurrencyPrefix(tx.currency)}{tx.price.toFixed(2)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{getCurrencyPrefix(tx.currency)}{tx.total.toFixed(2)}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-3 border-t border-border">
                <div className="flex justify-between font-semibold">
                  <span>Total Value</span>
                  <span>{transactionCurrencyPrefix}{basketTransactions.reduce((sum, tx) => sum + tx.total, 0).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : transaction ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Asset</p>
                  <p className="font-semibold">{transaction.assetName}</p>
                  <p className="text-sm text-muted-foreground">{transaction.asset}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Type</p>
                  <p className={`font-semibold ${transaction.type === 'buy' ? 'text-green-500' : 'text-red-500'}`}>
                    {transaction.type === 'buy' ? 'Buy' : 'Sell'}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Amount</p>
                  <p className="font-semibold">{formatAmount(transaction.amount, transaction.quantityType)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Price</p>
                  <p className="font-semibold">{transactionCurrencyPrefix}{transaction.price.toFixed(2)}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total</span>
                  <span className="text-xl font-bold">{transactionCurrencyPrefix}{transaction.total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-1">
                  <span className="text-sm text-muted-foreground">Fee (0.1%)</span>
                  <span className="text-sm font-medium">{transactionCurrencyPrefix}{(transaction.total * 0.001).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : null}

          <div className="mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              This modal will close automatically in a few seconds
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
