'use client';

import { useEffect, useState } from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface Transaction {
  id: string;
  type: 'buy' | 'sell';
  asset: string;
  amount: number;
  location: string;
  lat: number;
  lng: number;
  timestamp: number;
}

export default function LiveTransactionMap() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        type: Math.random() > 0.5 ? 'buy' : 'sell',
        asset: ['BTC', 'ETH', 'AAPL', 'GOOGL', 'GOLD'][Math.floor(Math.random() * 5)],
        amount: Math.random() * 10000,
        location: ['New York', 'London', 'Tokyo', 'Singapore', 'Dubai'][Math.floor(Math.random() * 5)],
        lat: Math.random() * 180 - 90,
        lng: Math.random() * 360 - 180,
        timestamp: Date.now(),
      };
      setTransactions(prev => [newTx, ...prev].slice(0, 20));
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <h3 className="font-semibold mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
        Live Transactions
      </h3>

      <div className="relative h-64 bg-gradient-to-br from-black/20 to-crimson-500/10 rounded-lg overflow-hidden mb-4">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIgLz48L3N2Zz4=')] opacity-30" />

        {transactions.slice(0, 8).map((tx, idx) => (
          <div
            key={tx.id}
            className="absolute animate-fadeIn"
            style={{
              left: `${((tx.lng + 180) / 360) * 100}%`,
              top: `${((90 - tx.lat) / 180) * 100}%`,
              animationDelay: `${idx * 0.1}s`,
            }}
          >
            <div className={`w-3 h-3 rounded-full ${tx.type === 'buy' ? 'bg-green-500' : 'bg-red-500'} animate-ping absolute`} />
            <div className={`w-3 h-3 rounded-full ${tx.type === 'buy' ? 'bg-green-500' : 'bg-red-500'}`} />
          </div>
        ))}
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {transactions.slice(0, 6).map((tx) => (
          <div
            key={tx.id}
            className="flex items-center justify-between p-2 bg-accent/50 rounded-lg animate-slideIn"
          >
            <div className="flex items-center gap-2">
              <div className={`p-1 rounded ${tx.type === 'buy' ? 'bg-green-500/10' : 'bg-red-500/10'}`}>
                {tx.type === 'buy' ? (
                  <ArrowDownRight className="w-3 h-3 text-green-500" />
                ) : (
                  <ArrowUpRight className="w-3 h-3 text-red-500" />
                )}
              </div>
              <div className="text-xs">
                <p className="font-medium">{tx.asset}</p>
                <p className="text-muted-foreground">{tx.location}</p>
              </div>
            </div>
            <p className="text-xs font-semibold">${tx.amount.toFixed(0)}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
