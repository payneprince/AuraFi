import { useCallback, useEffect, useState } from 'react';
import {
  appendUnifiedLedgerEvent,
  AppSource,
  getUnifiedLedgerEvents,
  replayUnifiedLedger,
  subscribeToUnifiedLedgerUpdates,
  UnifiedLedgerEvent,
  UnifiedReplayState,
} from '../unified-ledger';
import { readUnifiedAuthSession } from '../unified-auth';

/**
 * React hook for unified ledger integration.
 * Pass userId explicitly or it will be read from the unified auth session.
 */
export function useUnifiedLedger(userId?: string) {
  const [events, setEvents] = useState<UnifiedLedgerEvent[]>([]);
  const [replay, setReplay] = useState<UnifiedReplayState | null>(null);
  const [loading, setLoading] = useState(true);

  const resolveUserId = useCallback(
    () => userId || readUnifiedAuthSession()?.userId || '',
    [userId],
  );

  const refresh = useCallback(async () => {
    const uid = resolveUserId();
    if (!uid) {
      setLoading(false);
      return;
    }
    const [evts, state] = await Promise.all([
      getUnifiedLedgerEvents(uid),
      replayUnifiedLedger(uid),
    ]);
    setEvents(evts.slice().reverse()); // newest first
    setReplay(state);
    setLoading(false);
  }, [resolveUserId]);

  useEffect(() => {
    refresh();
    const unsubscribe = subscribeToUnifiedLedgerUpdates(() => refresh());
    return unsubscribe;
  }, [refresh]);

  return {
    events,
    replay,
    loading,
    balances: replay
      ? {
          bankTotal: replay.cashByApp.bank ?? 0,
          walletTotal: replay.cashByApp.wallet ?? 0,
          vestTotal: replay.cashByApp.vest ?? 0,
          totalNetWorth: replay.totalNetWorthEstimate,
        }
      : null,
    refresh,
  };
}

/**
 * Hook for inter-app transfer operations (event-sourced).
 * Records transfer events in the unified ledger.
 */
export function useTransfer(userId?: string) {
  const [transferring, setTransferring] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const transfer = async (params: {
    fromApp: AppSource;
    toApp: AppSource;
    amount: number;
    currency?: string;
    description?: string;
    metadata?: Record<string, unknown>;
  }) => {
    setTransferring(true);
    setError(null);

    try {
      const uid = userId || readUnifiedAuthSession()?.userId || '';
      if (!uid) throw new Error('No active user session');
      if (params.amount <= 0) throw new Error('Amount must be positive');

      const eventType = `transfer.${params.fromApp}_to_${params.toApp}` as const;
      const event = await appendUnifiedLedgerEvent({
        userId: uid,
        app: params.fromApp,
        type: eventType,
        amount: params.amount,
        currency: params.currency || 'USD',
        metadata: {
          ...params.metadata,
          toApp: params.toApp,
          description: params.description || `Transfer from ${params.fromApp} to ${params.toApp}`,
          sourceActionId: `transfer-${Date.now()}`,
        },
      });

      return { success: true, eventId: event.id };
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Transfer failed';
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
 * Hook for reading unified ledger events with optional filtering.
 */
export function useTransactions(
  userId?: string,
  filter?: {
    app?: AppSource;
    limit?: number;
    startDate?: Date;
    endDate?: Date;
  },
) {
  const [events, setEvents] = useState<UnifiedLedgerEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const resolveUserId = useCallback(
    () => userId || readUnifiedAuthSession()?.userId || '',
    [userId],
  );

  const load = useCallback(async () => {
    const uid = resolveUserId();
    const raw = await getUnifiedLedgerEvents(uid || undefined);
    let filtered = raw.slice().reverse(); // newest first

    if (filter?.app) {
      filtered = filtered.filter((e) => e.app === filter.app);
    }
    if (filter?.startDate) {
      filtered = filtered.filter((e) => new Date(e.timestamp) >= filter.startDate!);
    }
    if (filter?.endDate) {
      filtered = filtered.filter((e) => new Date(e.timestamp) <= filter.endDate!);
    }
    if (filter?.limit) {
      filtered = filtered.slice(0, filter.limit);
    }

    setEvents(filtered);
    setLoading(false);
  }, [resolveUserId, filter?.app, filter?.limit, filter?.startDate, filter?.endDate]);

  useEffect(() => {
    load();
    const unsubscribe = subscribeToUnifiedLedgerUpdates(() => load());
    return unsubscribe;
  }, [load]);

  return { events, loading, totalCount: events.length };
}
