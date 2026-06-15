# AURA FINANCE - ARCHITECTURE OVERVIEW

## 📐 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      AURA FINANCE ECOSYSTEM                      │
│                     (Main Hub - Port 3000)                       │
│                                                                   │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────────────┐   │
│  │  Landing    │  │   Unified    │  │   Quick Transfer    │   │
│  │   Page      │  │  Dashboard   │  │      Widget         │   │
│  └─────────────┘  └──────────────┘  └─────────────────────┘   │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              SSO Authentication Layer                      │  │
│  │         (NextAuth.js + JWT Session Management)            │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              │               │               │
              ▼               ▼               ▼
    ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
    │  AuraBank    │  │  AuraVest    │  │  AuraWallet  │
    │  Port 3001   │  │  Port 3002   │  │  Port 3003   │
    │              │  │              │  │              │
    │ • Accounts   │  │ • Stocks     │  │ • P2P Pay    │
    │ • Cards      │  │ • Crypto     │  │ • Bills      │
    │ • Transfers  │  │ • Gold       │  │ • QR Code    │
    │ • Bills      │  │ • NFTs       │  │ • Contacts   │
    └──────────────┘  └──────────────┘  └──────────────┘
              │               │               │
              └───────────────┼───────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │           UNIFIED LEDGER SERVICE (NEW!)                  │
    │                                                           │
    │  ┌─────────────────────────────────────────────────┐   │
    │  │  Single Source of Truth                          │   │
    │  │  • All Bank Accounts                             │   │
    │  │  • Wallet Balance                                │   │
    │  │  • Investment Holdings                           │   │
    │  │  • ALL Transactions (Unified History)            │   │
    │  │  • Calculated Net Worth                          │   │
    │  └─────────────────────────────────────────────────┘   │
    │                                                           │
    │  ┌─────────────────────────────────────────────────┐   │
    │  │  Core Services                                   │   │
    │  │  • Balance Calculations                          │   │
    │  │  • Inter-App Transfers                           │   │
    │  │  • Transaction Recording                         │   │
    │  │  • Real-time Sync (BroadcastChannel)             │   │
    │  │  • Event Publishing                              │   │
    │  └─────────────────────────────────────────────────┘   │
    │                                                           │
    │  Storage: server-side JSON files under .data/ (per userId) │
    └─────────────────────────────────────────────────────────┘
                              │
                              ▼
    ┌─────────────────────────────────────────────────────────┐
    │              AURA AI INSIGHT ENGINE                      │
    │                                                           │
    │  • Analyzes data from ALL apps                           │
    │  • Cross-app recommendations                             │
    │  • Spending patterns                                     │
    │  • Investment suggestions                                │
    │  • Transfer optimization                                 │
    └─────────────────────────────────────────────────────────┘
```

---

## 🔄 Data Flow: Inter-App Transfer

```
User initiates transfer in AuraBank:
"Transfer $100 from Checking Account to AuraWallet"

Step 1: User Input
┌──────────────────────┐
│  AuraBank Dashboard  │
│                      │
│  [Transfer Button]   │
│  From: Checking      │
│  To: AuraWallet      │
│  Amount: $100        │
└──────────────────────┘
          │
          ▼
Step 2: Validation
┌──────────────────────────────────┐
│  Unified Ledger Service          │
│                                  │
│  ✓ Check balance ($100 avail?)  │
│  ✓ Validate accounts exist       │
│  ✓ Check transfer limits         │
│  ✓ Verify user permissions       │
└──────────────────────────────────┘
          │
          ▼
Step 3: Atomic Transaction
┌────────────────────────────────────────┐
│  Transaction Processing                │
│                                        │
│  1. Create pending transaction         │
│  2. Debit: Bank Checking -$100         │
│  3. Credit: Wallet +$100               │
│  4. Update balances object             │
│  5. Add to unified transaction history │
│  6. Mark transaction as completed      │
└────────────────────────────────────────┘
          │
          ▼
Step 4: Broadcast Event
┌────────────────────────────────────────┐
│  BroadcastChannel.postMessage()        │
│                                        │
│  Event: "balance_updated"              │
│  Payload: { userId, balances }         │
└────────────────────────────────────────┘
          │
    ┌─────┴─────┐
    ▼           ▼
┌─────────┐  ┌──────────┐  ┌───────────┐
│AuraBank │  │ AuraVest │  │AuraWallet │
│Updates  │  │ Updates  │  │ Updates   │
│UI       │  │ UI       │  │ UI        │
└─────────┘  └──────────┘  └───────────┘
```

---

## 🗄️ Data Model

### Data Model
```
localStorage:
└── aura_unified_ledger
    ├── userId: "user_123"
    ├── accounts:
    │   ├── bank: [
    │   │   { id, name, type, balance, currency },
    │   │   { id, name, type, balance, currency }
    │   │   ]
    │   ├── wallet: { balance, currency }
    │   └── vestHoldings: [
    │       { id, symbol, type, quantity, currentValue }
    │       ]
    ├── transactions: [
    │   { id, source, type, amount, from, to, timestamp },
    │   { id, source, type, amount, from, to, timestamp }
    │   ]
    ├── balances:
    │   ├── totalNetWorth: 125847.32
    │   ├── bankTotal: 84739.25
    │   ├── walletTotal: 420.50
    │   └── vestTotal: 125847.32
    └── lastSync: "2026-02-27T..."

✅ Single source of truth
✅ Real-time calculated balances
✅ Complete transaction history
✅ Cross-app consistency
```

---

## 🔐 Authentication Flow

```
User logs in at AuraFinance (NextAuth)
   ↓
Unified session written to sessionStorage + localStorage
   ↓
Product app (Bank/Vest/Wallet) reads session on load
   ↓
Fetches server state: GET /api/state?userId=...
   ↓
Bootstraps localStorage with user-scoped keys
   ↓
Periodic PUT /api/state every 1.2 s + on tab close
```

---

## 📊 Component Hierarchy

### AuraFinance (Main Hub)
```
App
├── Navigation
│   ├── Logo
│   ├── NavLinks
│   └── UserProfileMenu
├── UnifiedDashboard
│   ├── BalanceOverview (shows Bank + Wallet + Vest total)
│   ├── QuickTransfer (inter-app transfer widget)
│   ├── RecentTransactions (all apps)
│   ├── AuraAIInsights (cross-app recommendations)
│   └── AppCards (links to Bank, Vest, Wallet)
└── Footer
```

### AuraBank
```
Dashboard
├── AccountSummary (synced with ledger)
├── TransactionList (from ledger)
├── TransferBetweenApps (NEW - uses ledger service)
└── AuraAIBankInsights
```

### AuraVest
```
Dashboard
├── PortfolioOverview (synced with ledger)
├── FundAccount (NEW - transfer from Bank/Wallet)
├── TradeInterface
└── AuraAIVestInsights
```

### AuraWallet
```
Dashboard
├── WalletBalance (synced with ledger)
├── FundFromBank (NEW - transfer from Bank)
├── QuickPay
└── AuraAIWalletInsights
```

---

## 🔧 Technology Stack

### Frontend
- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: ShadCN UI
- **Animations**: Framer Motion
- **State Management**: Unified Ledger Service + React Context
- **Forms**: React Hook Form + Zod validation

### Backend (Current)
- **Storage**: Server-side JSON files under `.data/` per userId; localStorage for in-session state
- **Sync**: BroadcastChannel API (cross-tab) + periodic PUT to hub API

