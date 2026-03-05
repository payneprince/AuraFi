import { useEffect, useState } from 'react';
import { ledgerService, UnifiedLedger, UnifiedTransaction } from '@/lib/shared/unified-ledger';

/**
 * React hook for unified ledger integration
 * Use this in any component to access cross-app financial data
 */
export function useUnifiedLedger() {
  const [ledger, setLedger] = useState<UnifiedLedger | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load initial ledger
    const currentLedger = ledgerService?.getLedger();
    setLedger(currentLedger);
    setLoading(false);

    // Subscribe to updates
    if (ledgerService) {
      const unsubscribe = ledgerService.subscribe((updatedLedger) => {
        setLedger(updatedLedger);
      });
      return unsubscribe;
    }
  }, []);

  return {
    ledger,
    loading,
    balances: ledger?.balances || null,
    transactions: ledger?.transactions || [],
    accounts: ledger?.accounts || null,
  };
}

/**
 * Hook for transfer operations
 */
export function useTransfer() {
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transfer = async (params: {
    fromApp: 'bank' | 'wallet' | 'vest';
    toApp: 'bank' | 'wallet' | 'vest';
    amount: number;
    currency: string;
    fromAccountId?: string;
    toAccountId?: string;
    description?: string;
  }) => {
    setTransferring(true);
    setError(null);

    try {
      if (!ledgerService) {
        throw new Error('Ledger service not available');
      }

      const result = ledgerService.transferBetweenApps(params);

      if (!result.success) {
        setError(result.error || 'Transfer failed');
        return { success: false, error: result.error };
      }

      return { success: true, transactionId: result.transactionId };
    } catch (err: any) {
      const errorMsg = err.message || 'An unexpected error occurred';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    } finally {
      setTransferring(false);
    }
  };

  return {
    transfer,
    transferring,
    error,
    clearError: () => setError(null),
  };
}

/**
 * Hook for transaction filtering
 */
export function useTransactions(filter?: {
  source?: 'bank' | 'wallet' | 'vest';
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}) {
  const { transactions } = useUnifiedLedger();

  const filteredTransactions = transactions.filter((txn) => {
    if (filter?.source && txn.source !== filter.source) return false;
    
    if (filter?.startDate) {
      const txnDate = new Date(txn.timestamp);
      if (txnDate < filter.startDate) return false;
    }
    
    if (filter?.endDate) {
      const txnDate = new Date(txn.timestamp);
      if (txnDate > filter.endDate) return false;
    }
    
    return true;
  });

  return {
    transactions: filter?.limit 
      ? filteredTransactions.slice(0, filter.limit) 
      : filteredTransactions,
    totalCount: filteredTransactions.length,
  };
}
