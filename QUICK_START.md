# QUICK START: Integrating Unified Ledger

## 🚀 For Each App (AuraBank, AuraVest, AuraWallet)

### Step 1: Copy Shared Files to App

```bash
# In each app directory, create symlinks or copy:
cd /Users/PAYNE/Desktop/Aura\ Finance/AuraBank
mkdir -p src/lib/shared

# Copy unified ledger files
cp ../../shared/unified-ledger.ts src/lib/shared/
cp ../../shared/ledger-migration.ts src/lib/shared/
cp ../../shared/hooks/useUnifiedLedger.ts src/lib/shared/
```

### Step 2: Update AuthContext to Use Ledger

**In `src/contexts/AuthContext.tsx` (or create if doesn't exist):**

```typescript
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ledgerService } from '@/lib/shared/unified-ledger';
import type { UnifiedLedger } from '@/lib/shared/unified-ledger';

interface AuthContextType {
  user: User | null;
  ledger: UnifiedLedger | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ledger, setLedger] = useState(null);

  useEffect(() => {
    // Load user session
    const savedUser = localStorage.getItem('aura_user');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      
      // Initialize or load ledger
      const currentLedger = ledgerService.getLedger();
      if (currentLedger) {
        setLedger(currentLedger);
      } else {
        // Initialize new ledger
        const newLedger = ledgerService.initializeLedger(userData.id);
        setLedger(newLedger);
      }
    }

    // Subscribe to ledger updates
    if (ledgerService) {
      const unsubscribe = ledgerService.subscribe((updatedLedger) => {
        setLedger(updatedLedger);
      });
      return unsubscribe;
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Your login logic here
    const user = { id: 'user_123', email, name: 'User' };
    setUser(user);
    localStorage.setItem('aura_user', JSON.stringify(user));

    // Initialize ledger for user
    const newLedger = ledgerService.initializeLedger(user.id);
    setLedger(newLedger);
  };

  const logout = () => {
    setUser(null);
    setLedger(null);
    localStorage.removeItem('aura_user');
  };

  return (
    <AuthContext.Provider value={{ user, ledger, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
```

### Step 3: Update Dashboard to Show Unified Balances

**Example for AuraBank Dashboard:**

```typescript
'use client';

import { useUnifiedLedger } from '@/lib/shared/useUnifiedLedger';

export default function Dashboard() {
  const { ledger, balances, loading } = useUnifiedLedger();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {/* Show unified balances */}
      <div className="grid grid-cols-3 gap-4">
        <BalanceCard 
          title="Bank Total" 
          amount={balances?.bankTotal || 0} 
          color="blue"
        />
        <BalanceCard 
          title="Wallet" 
          amount={balances?.walletTotal || 0} 
          color="green"
        />
        <BalanceCard 
          title="Investments" 
          amount={balances?.vestTotal || 0} 
          color="purple"
        />
      </div>

      {/* Show net worth */}
      <div className="mt-6">
        <h2 className="text-3xl font-bold">
          Total Net Worth: ${balances?.totalNetWorth.toFixed(2)}
        </h2>
      </div>

      {/* Show bank accounts from ledger */}
      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Your Accounts</h3>
        {ledger?.accounts.bank.map(account => (
          <AccountCard key={account.id} account={account} />
        ))}
      </div>
    </div>
  );
}
```

### Step 4: Add Transfer Between Apps Component

**Create `src/components/TransferBetweenApps.tsx`:**

```typescript
'use client';

import { useState } from 'react';
import { useTransfer } from '@/lib/shared/useUnifiedLedger';
import { useAuth } from '@/contexts/AuthContext';

export default function TransferBetweenApps() {
  const { ledger } = useAuth();
  const { transfer, transferring, error } = useTransfer();
  
  const [fromApp, setFromApp] = useState<'bank' | 'wallet' | 'vest'>('bank');
  const [toApp, setToApp] = useState<'bank' | 'wallet' | 'vest'>('wallet');
  const [amount, setAmount] = useState('');
  const [fromAccountId, setFromAccountId] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await transfer({
      fromApp,
      toApp,
      amount: parseFloat(amount),
      currency: 'USD',
      fromAccountId: fromApp === 'bank' ? fromAccountId : undefined,
      description: `Transfer from ${fromApp} to ${toApp}`,
    });

    if (result.success) {
      alert('Transfer successful!');
      setAmount('');
    } else {
      alert(`Transfer failed: ${result.error}`);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">Transfer Between Apps</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* From */}
        <div>
          <label className="block text-sm font-medium mb-2">From</label>
          <select 
            value={fromApp} 
            onChange={(e) => setFromApp(e.target.value as any)}
            className="w-full p-2 border rounded"
          >
            <option value="bank">Bank</option>
            <option value="wallet">Wallet</option>
            <option value="vest">Vest</option>
          </select>

          {fromApp === 'bank' && (
            <select 
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              className="w-full p-2 border rounded mt-2"
            >
              <option value="">Select Account</option>
              {ledger?.accounts.bank.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} - ${acc.balance.toFixed(2)}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* To */}
        <div>
          <label className="block text-sm font-medium mb-2">To</label>
          <select 
            value={toApp} 
            onChange={(e) => setToApp(e.target.value as any)}
            className="w-full p-2 border rounded"
          >
            <option value="bank">Bank</option>
            <option value="wallet">Wallet</option>
            <option value="vest">Vest</option>
          </select>
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium mb-2">Amount</label>
          <input 
            type="number" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            step="0.01"
            min="0.01"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-100 text-red-700 p-3 rounded">
            {error}
          </div>
        )}

        {/* Submit */}
        <button 
          type="submit"
          disabled={transferring}
          className="w-full bg-blue-600 text-white py-3 rounded font-semibold hover:bg-blue-700 disabled:opacity-50"
        >
          {transferring ? 'Processing...' : 'Transfer'}
        </button>
      </form>
    </div>
  );
}
```

### Step 5: Update Account Balances in Ledger

**When balances change (e.g., after a transaction):**

```typescript
import { ledgerService } from '@/lib/shared/unified-ledger';

// After a transaction
const handleTransaction = (newAccounts) => {
  // Update local state
  setAccounts(newAccounts);
  
  // Update ledger (this syncs across all apps!)
  ledgerService.updateBankAccounts(newAccounts);
  
  // Don't need to manually update localStorage anymore!
};
```

### Step 6: Show Unified Transaction History

```typescript
import { useTransactions } from '@/lib/shared/useUnifiedLedger';

export default function TransactionHistory() {
  const { transactions, totalCount } = useTransactions({
    limit: 50 // Show last 50 transactions
  });

  return (
    <div>
      <h2>All Transactions ({totalCount})</h2>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>App</th>
            <th>Description</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(txn => (
            <tr key={txn.id}>
              <td>{new Date(txn.timestamp).toLocaleDateString()}</td>
              <td>
                <span className={`badge badge-${txn.source}`}>
                  {txn.source}
                </span>
              </td>
              <td>{txn.description}</td>
              <td>${txn.amount.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## 🔄 Migration for Existing Users

**Run this once in your app's initialization:**

```typescript
import { ledgerMigration } from '@/lib/shared/ledger-migration';

// In your main layout or dashboard
useEffect(() => {
  const needsMigration = !localStorage.getItem('aura_unified_ledger');
  
  if (needsMigration && user) {
    // Create backup
    ledgerMigration.createBackup();
    
    // Migrate
    const result = ledgerMigration.migrateFromLocalStorage(user.id);
    
    if (result.success) {
      console.log('✅ Migration successful:', result);
    } else {
      console.error('❌ Migration failed:', result.errors);
    }
  }
}, [user]);
```

---

## 🧪 Testing the Integration

### 1. Test Balance Sync

```typescript
// In browser console
import { ledgerService } from './lib/shared/unified-ledger';

// Check current balances
console.log(ledgerService.getLedger()?.balances);

// Update bank account
const ledger = ledgerService.getLedger();
ledger.accounts.bank[0].balance += 100;
ledgerService.updateBankAccounts(ledger.accounts.bank);

// Check updated balances (should recalculate automatically)
console.log(ledgerService.getLedger()?.balances);
```

### 2. Test Cross-Tab Sync

1. Open app in two browser tabs
2. Make a transfer in Tab 1
3. Watch balance update in Tab 2 automatically
4. Check console logs for BroadcastChannel events

### 3. Test Transfer

```typescript
const result = ledgerService.transferBetweenApps({
  fromApp: 'bank',
  toApp: 'wallet',
  amount: 50,
  currency: 'USD',
  fromAccountId: 'acc-1',
  description: 'Test transfer'
});

console.log(result); // { success: true, transactionId: "..." }
```

---

## 📱 AuraFinance Dashboard Integration

**In `/AuraFinance/src/app/dashboard/page.tsx`:**

```typescript
'use client';

import { useUnifiedLedger } from '@/lib/shared/useUnifiedLedger';

export default function UnifiedDashboard() {
  const { balances, transactions, loading } = useUnifiedLedger();

  if (loading) return <LoadingSpinner />;

  return (
    <div className="container mx-auto p-6">
      {/* Total Net Worth */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-8 rounded-2xl mb-6">
        <h1 className="text-2xl font-semibold mb-2">Total Net Worth</h1>
        <p className="text-5xl font-bold">
          ${balances?.totalNetWorth.toLocaleString('en-US', { 
            minimumFractionDigits: 2 
          })}
        </p>
      </div>

      {/* Balances Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <BalanceCard 
          title="AuraBank" 
          amount={balances?.bankTotal || 0}
          icon="🏦"
          color="blue"
          link="/bank"
        />
        <BalanceCard 
          title="AuraWallet" 
          amount={balances?.walletTotal || 0}
          icon="💳"
          color="green"
          link="/wallet"
        />
        <BalanceCard 
          title="AuraVest" 
          amount={balances?.vestTotal || 0}
          icon="📈"
          color="purple"
          link="/vest"
        />
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl shadow p-6">
        <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>
        <div className="space-y-2">
          {transactions.slice(0, 10).map(txn => (
            <TransactionRow key={txn.id} transaction={txn} />
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <QuickAction icon="↔️" label="Transfer" onClick={() => {}} />
        <QuickAction icon="💰" label="Pay Bill" onClick={() => {}} />
        <QuickAction icon="📊" label="Invest" onClick={() => {}} />
        <QuickAction icon="📥" label="Request Money" onClick={() => {}} />
      </div>
    </div>
  );
}
```

---

## 🎯 Key Takeaways

1. **Replace localStorage calls with ledger service**
   - Instead of: `localStorage.setItem('aurabank_accounts', ...)`
   - Use: `ledgerService.updateBankAccounts(...)`

2. **Subscribe to updates in components**
   - Use the `useUnifiedLedger()` hook
   - Automatic re-renders on balance changes

3. **Use transfer service for inter-app moves**
   - Don't manually update balances
   - Use `ledgerService.transferBetweenApps()`

4. **Migration is one-time**
   - Run once per user
   - Create backup first
   - Check for errors

5. **Real-time sync works automatically**
   - BroadcastChannel handles cross-tab sync
   - No manual refresh needed

---

## ⚠️ Important Notes

1. **TypeScript Paths**: Update `tsconfig.json` to resolve `@/lib/shared/*`:
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/lib/shared/*": ["./src/lib/shared/*"]
    }
  }
}
```

2. **Environment Variables**: None needed for localStorage version

3. **Browser Support**: BroadcastChannel is supported in all modern browsers (IE11 not supported)

4. **Testing**: Open multiple tabs to verify cross-tab sync

5. **Debugging**: Check browser console for ledger events

---

## 🆘 Troubleshooting

### Balances not updating?
- Check if `ledgerService.subscribe()` is called
- Verify `updateBankAccounts()` is being called
- Check browser console for errors

### Transfer failed?
- Verify sufficient balance
- Check account IDs are correct
- Look at error message in result.error

### Cross-tab sync not working?
- Check BroadcastChannel support
- Ensure same origin (localhost:3000)
- Try hard refresh (Cmd+Shift+R)

### Migration issues?
- Check localStorage keys exist
- Review migration errors array
- Restore from backup if needed

---

## ✅ Checklist

- [ ] Copy shared files to each app
- [ ] Update AuthContext to use ledger
- [ ] Replace localStorage calls with ledger service
- [ ] Add transfer UI component
- [ ] Test balance sync
- [ ] Test cross-tab sync
- [ ] Run migration for existing users
- [ ] Update AuraFinance dashboard
- [ ] Test inter-app transfers
- [ ] Deploy and celebrate! 🎉

---

Need help? Check the full documentation in:
- `/shared/unified-ledger.ts` - API documentation
- `/IMPLEMENTATION_PLAN.md` - Complete roadmap
- `/ARCHITECTURE.md` - System architecture
