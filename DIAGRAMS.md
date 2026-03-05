# VISUAL SYSTEM DIAGRAMS

## 1. UNIFIED LEDGER - DATA FLOW

```
┌─────────────────────────────────────────────────────────────────────┐
│                         USER: user_123                               │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │   UNIFIED LEDGER SERVICE      │
                    │   (Single Source of Truth)    │
                    └───────────────┬───────────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐
│   BANK ACCOUNTS   │     │  WALLET ACCOUNT   │     │  VEST HOLDINGS    │
├───────────────────┤     ├───────────────────┤     ├───────────────────┤
│ Checking: $12,458 │     │  Balance: $420.50 │     │ Stocks:  $52,180  │
│ Savings:  $72,280 │     │  Currency: USD    │     │ Crypto:  $45,230  │
│ Euro:     $3,200  │     │                   │     │ Gold:    $18,436  │
│ Cedi:     $50,500 │     │                   │     │ NFTs:    $10,000  │
│ Credit:   -$2,340 │     │                   │     │                   │
├───────────────────┤     └───────────────────┘     └───────────────────┘
│ Total: $84,739    │           Total: $421              Total: $125,846
└───────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │   AUTOMATIC CALCULATION       │
                    │   Total Net Worth:            │
                    │   $210,006.50                 │
                    └───────────────────────────────┘
```

## 2. TRANSFER FLOW DIAGRAM

```
User Action: Transfer $100 from Bank → Wallet

┌────────────────────────────────────────────────────────────────┐
│ Step 1: USER INITIATES TRANSFER                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  AuraBank Dashboard                                            │
│  ┌──────────────────────────────────┐                         │
│  │ Transfer to:  [Wallet ▼]         │                         │
│  │ Amount:       [$100.00]          │                         │
│  │ From Account: [Checking ▼]       │                         │
│  │                                   │                         │
│  │        [Transfer] [Cancel]        │                         │
│  └──────────────────────────────────┘                         │
│                      │                                          │
│                      │ Click "Transfer"                        │
└──────────────────────┼──────────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 2: LEDGER SERVICE VALIDATES                                │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✓ User authenticated?         YES                            │
│  ✓ Bank account exists?        YES (acc-1, Checking)          │
│  ✓ Sufficient balance?         YES ($12,458 > $100)           │
│  ✓ Wallet account exists?      YES                            │
│  ✓ Transfer limits OK?         YES                            │
│                                                                 │
│  → VALIDATION PASSED ✓                                         │
└──────────────────────┼──────────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 3: ATOMIC TRANSACTION                                      │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Create Transaction Record                                  │
│     ┌────────────────────────────────────┐                    │
│     │ ID:     txn_1234567890_abc         │                    │
│     │ Type:   transfer                   │                    │
│     │ Source: bank                       │                    │
│     │ From:   Checking (acc-1)           │                    │
│     │ To:     Wallet                     │                    │
│     │ Amount: $100.00                    │                    │
│     │ Status: pending                    │                    │
│     └────────────────────────────────────┘                    │
│                                                                 │
│  2. Debit Bank Account                                         │
│     Checking: $12,458.00 → $12,358.00  (-$100)                │
│                                                                 │
│  3. Credit Wallet Account                                      │
│     Wallet:   $420.50 → $520.50        (+$100)                │
│                                                                 │
│  4. Recalculate Balances                                       │
│     Bank Total:    $84,739 → $84,639                          │
│     Wallet Total:  $421 → $521                                │
│     Net Worth:     $210,006 (unchanged - just moved money)    │
│                                                                 │
│  5. Mark Transaction Complete                                  │
│     Status: pending → completed                               │
│                                                                 │
└──────────────────────┼──────────────────────────────────────────┘
                       ▼
┌────────────────────────────────────────────────────────────────┐
│ Step 4: BROADCAST UPDATE                                        │
├────────────────────────────────────────────────────────────────┤
│                                                                 │
│  BroadcastChannel.postMessage({                                │
│    type: 'ledger_updated',                                     │
│    balances: { bank: $84,639, wallet: $521, ... }             │
│  })                                                             │
│                                                                 │
└────────────┬───────────────────┬────────────────┬──────────────┘
             ▼                   ▼                ▼
    ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
    │   AuraBank     │  │   AuraWallet   │  │   AuraVest     │
    │   (Tab 1)      │  │   (Tab 2)      │  │   (Tab 3)      │
    ├────────────────┤  ├────────────────┤  ├────────────────┤
    │ ✓ Balance      │  │ ✓ Balance      │  │ ✓ Balance      │
    │   Updated      │  │   Updated      │  │   Updated      │
    │ ✓ Transaction  │  │ ✓ Transaction  │  │ ✓ Net Worth    │
    │   Added        │  │   Added        │  │   Updated      │
    └────────────────┘  └────────────────┘  └────────────────┘

    All apps update their UI automatically in real-time!
```

## 3. APP ECOSYSTEM OVERVIEW

```
┌─────────────────────────────────────────────────────────────────┐
│                    AURA FINANCE ECOSYSTEM                        │
│                    aurafinance.com (Main Hub)                    │
│                                                                   │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌──────────┐ │
│  │  Landing   │  │  Dashboard │  │   Quick    │  │   User   │ │
│  │   Page     │  │  (Unified) │  │  Transfer  │  │ Profile  │ │
│  └────────────┘  └────────────┘  └────────────┘  └──────────┘ │
│                                                                   │
│  Features:                                                       │
│  • Single Sign-On (SSO)                                         │
│  • Unified Net Worth Display                                    │
│  • Cross-App Transaction History                               │
│  • Quick Transfer Widget                                        │
│  • AuraAI Insights (All Apps)                                  │
└───────────────────────────┬─────────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
        ▼                   ▼                   ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  AuraBank    │    │  AuraVest    │    │  AuraWallet  │
│  :3001       │    │  :3002       │    │  :3003       │
├──────────────┤    ├──────────────┤    ├──────────────┤
│ Features:    │    │ Features:    │    │ Features:    │
│ • Accounts   │    │ • Stocks     │    │ • Balance    │
│ • Cards      │    │ • Crypto     │    │ • P2P Pay    │
│ • Transfers  │    │ • Gold       │    │ • QR Code    │
│ • Bills      │    │ • NFTs       │    │ • Bills      │
│ • Budgets    │    │ • Portfolio  │    │ • Contacts   │
│ • Loans      │    │ • Analytics  │    │ • History    │
└──────────────┘    └──────────────┘    └──────────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                            ▼
        ┌───────────────────────────────────────┐
        │    SHARED INFRASTRUCTURE              │
        ├───────────────────────────────────────┤
        │ • Unified Ledger Service              │
        │ • Authentication Service              │
        │ • AuraAI Insight Engine               │
        │ • Notification Service                │
        │ • Analytics Service                   │
        └───────────────────────────────────────┘
```

## 4. BEFORE vs AFTER (Data Management)

### BEFORE (Fragmented)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AuraBank   │     │  AuraVest   │     │  AuraWallet │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       ▼                   ▼                   ▼
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│localStorage │     │localStorage │     │localStorage │
│             │     │             │     │             │
│bank_accounts│     │vest_port... │     │wallet_bal...│
│bank_trans...│     │vest_trans...│     │wallet_tra...│
│bank_cards   │     │vest_assets  │     │wallet_con...│
└─────────────┘     └─────────────┘     └─────────────┘

❌ Problems:
• Separate storage per app
• No unified view
• Data inconsistency risk
• No cross-app transfers
• Manual synchronization
• Duplicate transaction records
```

### AFTER (Unified)
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  AuraBank   │     │  AuraVest   │     │  AuraWallet │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                   │                   │
       └───────────────────┼───────────────────┘
                           ▼
        ┌──────────────────────────────────────┐
        │    UNIFIED LEDGER SERVICE            │
        ├──────────────────────────────────────┤
        │                                      │
        │  userId: "user_123"                  │
        │                                      │
        │  accounts:                           │
        │    bank: [...]                       │
        │    wallet: {...}                     │
        │    vestHoldings: [...]               │
        │                                      │
        │  transactions: [...]                 │
        │  (ALL transactions, all apps)        │
        │                                      │
        │  balances:                           │
        │    bankTotal:   $84,739              │
        │    walletTotal: $421                 │
        │    vestTotal:   $125,846             │
        │    netWorth:    $210,006             │
        │                                      │
        └──────────────────┬───────────────────┘
                           ▼
                  ┌────────────────┐
                  │  localStorage  │
                  │                │
                  │  aura_unified_ │
                  │  ledger        │
                  └────────────────┘

✅ Benefits:
• Single source of truth
• Unified view across apps
• Always consistent data
• Easy cross-app transfers
• Automatic synchronization
• Complete transaction history
• Real-time balance calculations
```

## 5. TRANSACTION TIMELINE

```
Timeline: How a Transaction Propagates

T+0ms  │ User clicks "Transfer" in AuraBank
       │
T+10ms │ Validation starts
       │ ├─ Check authentication
       │ ├─ Verify balance
       │ └─ Validate accounts
       │
T+20ms │ Create transaction record
       │ Status: pending
       │
T+30ms │ Update account balances
       │ ├─ Debit source (-$100)
       │ └─ Credit destination (+$100)
       │
T+40ms │ Recalculate totals
       │ ├─ Bank total
       │ ├─ Wallet total
       │ └─ Net worth
       │
T+50ms │ Save to localStorage
       │
T+60ms │ Mark transaction complete
       │ Status: completed
       │
T+70ms │ Broadcast update event
       │ ↓
       │ BroadcastChannel.postMessage()
       │
T+80ms │ All tabs receive event
       │ ├─ AuraBank tab
       │ ├─ AuraVest tab
       │ └─ AuraWallet tab
       │
T+90ms │ All UIs update
       │ ├─ Balance displays refresh
       │ ├─ Transaction lists update
       │ └─ Charts recalculate
       │
DONE   │ Total time: ~100ms
       │ Result: All apps synchronized ✓
```

## 6. USER JOURNEY MAP

```
1. LOGIN (AuraFinance)
   │
   ├─→ Enter credentials
   ├─→ JWT token generated
   ├─→ Ledger initialized
   └─→ Redirect to Dashboard
         │
         ▼
2. VIEW DASHBOARD
   │
   ├─→ See total net worth
   ├─→ View balances (Bank, Wallet, Vest)
   ├─→ Recent transactions (all apps)
   └─→ AuraAI insights
         │
         ▼
3. NAVIGATE TO APP
   │
   ├─→ Click "AuraBank" card
   ├─→ Open in new tab
   ├─→ Already authenticated (SSO)
   └─→ View bank dashboard
         │
         ▼
4. INITIATE TRANSFER
   │
   ├─→ Click "Transfer to Wallet"
   ├─→ Enter amount ($100)
   ├─→ Select source account
   └─→ Confirm transfer
         │
         ▼
5. TRANSFER COMPLETES
   │
   ├─→ See success message
   ├─→ Balance updates
   ├─→ Transaction recorded
   └─→ Notification sent
         │
         ▼
6. VERIFY IN OTHER APP
   │
   ├─→ Switch to AuraWallet tab
   ├─→ See updated balance (+$100)
   ├─→ Transaction appears in history
   └─→ Real-time sync confirmed ✓
         │
         ▼
7. CHECK UNIFIED DASHBOARD
   │
   ├─→ Return to AuraFinance
   ├─→ Net worth unchanged (just moved money)
   ├─→ Transaction in unified history
   └─→ AuraAI provides insight
```

## 7. COMPONENT HIERARCHY

```
AuraFinance (Main App)
│
├── App
│   ├── Navigation
│   │   ├── Logo
│   │   ├── NavLinks
│   │   │   ├── Dashboard
│   │   │   ├── Products
│   │   │   └── Pricing
│   │   └── UserMenu
│   │       ├── Profile
│   │       ├── Settings
│   │       └── Logout
│   │
│   ├── Dashboard (uses useUnifiedLedger)
│   │   ├── BalanceOverview
│   │   │   ├── NetWorthCard
│   │   │   ├── BankBalanceCard
│   │   │   ├── WalletBalanceCard
│   │   │   └── VestBalanceCard
│   │   │
│   │   ├── QuickTransfer
│   │   │   ├── TransferModal
│   │   │   └── TransferForm
│   │   │
│   │   ├── RecentTransactions
│   │   │   └── TransactionRow (x10)
│   │   │
│   │   └── AuraAIInsights
│   │       └── InsightCard (x3)
│   │
│   └── Footer
│
└── Providers
    ├── AuthProvider (manages user session)
    ├── LedgerProvider (manages ledger state)
    └── ThemeProvider
```

## 8. API LAYER

```
React Components
       │
       ▼
Custom Hooks
 ├─ useUnifiedLedger()
 ├─ useTransfer()
 └─ useTransactions()
       │
       ▼
Ledger Service
 ├─ getLedger()
 ├─ updateBankAccounts()
 ├─ updateWalletBalance()
 ├─ updateVestHoldings()
 ├─ transferBetweenApps()
 └─ addTransaction()
       │
       ▼
Storage Layer (Current)
 └─ localStorage
       │
       ▼
Storage Layer (Future)
 ├─ PostgreSQL
 ├─ Redis (cache)
 └─ S3 (documents)
```

---

These diagrams provide a visual understanding of how the unified ledger system works and how data flows through the Aura Finance ecosystem. Use them as reference when implementing the integration!
