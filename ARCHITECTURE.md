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
    │  Storage: localStorage (Demo) → PostgreSQL (Production)  │
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

### Before (Current - Fragmented)
```
localStorage:
├── aurabank_accounts      → Bank accounts only
├── aurabank_transactions  → Bank transactions only
├── aurabank_cards         → Cards
├── aurawallet_balance     → Wallet balance only
├── aurawallet_transactions → Wallet transactions only
├── auravest_portfolio     → Investments only
└── auravest_transactions  → Trading history only

❌ Problem: No single source of truth
❌ Problem: Inconsistent data across apps
❌ Problem: No unified transaction history
```

### After (New - Unified)
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

### Current (Mock)
```
User logs in → Session stored in localStorage (per app)
❌ Each app has separate session
❌ No real SSO
```

### Planned (True SSO)
```
1. User logs in at AuraFinance
   ↓
2. JWT token generated
   ↓
3. Token stored in HTTP-only cookie
   ↓
4. Cookie shared across subdomains:
   - bank.aurafinance.com
   - vest.aurafinance.com
   - wallet.aurafinance.com
   ↓
5. All apps validate same token
   ↓
6. Single logout clears all sessions

✅ True SSO
✅ Secure (HTTP-only cookies)
✅ CSRF protection
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

### Backend (Current - Demo)
- **Storage**: localStorage (browser)
- **Sync**: BroadcastChannel API

### Backend (Planned - Production)
- **API**: Next.js API Routes / Node.js + Express
- **Database**: PostgreSQL
- **ORM**: Prisma / Drizzle
- **Cache**: Redis
- **Real-time**: WebSockets (Socket.io)
- **Auth**: JWT + NextAuth.js
- **File Storage**: AWS S3 / Cloudflare R2

### DevOps
- **Hosting**: Vercel / Netlify
- **CI/CD**: GitHub Actions
- **Monitoring**: Sentry
- **Analytics**: Vercel Analytics / PostHog

---

## 📈 Scalability Roadmap

### Phase 1: Demo (Current)
- localStorage
- Mock data
- Client-side only
- Single user

### Phase 2: MVP
- Backend API
- PostgreSQL
- Real authentication
- Multi-user support
- Basic security

### Phase 3: Production
- Microservices
- Redis caching
- WebSocket real-time updates
- Advanced analytics
- Payment gateway integration

### Phase 4: Scale
- Kubernetes
- Load balancing
- CDN
- Multi-region deployment
- 99.99% uptime SLA

---

## 🔒 Security Architecture

### Current (Demo)
```
├── Mock authentication
├── localStorage (unencrypted)
└── No server-side validation
```

### Planned (Production)
```
├── Authentication
│   ├── JWT with refresh tokens
│   ├── HTTP-only cookies
│   ├── 2FA (TOTP)
│   └── Biometric (WebAuthn)
├── Authorization
│   ├── Role-based access control
│   ├── Resource-level permissions
│   └── API rate limiting
├── Data Security
│   ├── Encryption at rest (AES-256)
│   ├── Encryption in transit (TLS 1.3)
│   ├── PII masking in logs
│   └── GDPR compliance
├── Monitoring
│   ├── Fraud detection
│   ├── Anomaly detection
│   ├── Audit logging
│   └── Security alerts
└── Compliance
    ├── PCI DSS (payments)
    ├── SOC 2 Type II
    └── ISO 27001
```

---

## 🧪 Testing Strategy

### Unit Tests
```
✓ Ledger service methods
✓ Balance calculations
✓ Transfer validation
✓ Transaction filtering
```

### Integration Tests
```
✓ Cross-app transfers
✓ Session synchronization
✓ Notification delivery
✓ Data migration
```

### E2E Tests
```
✓ User login flow
✓ Complete transfer journey
✓ Multi-tab synchronization
✓ Error handling
```

### Performance Tests
```
✓ Balance calculation speed
✓ Transaction query performance
✓ Cross-tab sync latency
✓ UI rendering performance
```

---

## 📱 Mobile Strategy

### Web App (Current)
- Responsive design
- Progressive Web App (PWA)
- Mobile-first UI

### Native Apps (Future)
- React Native
- Shared business logic
- Native performance
- Biometric authentication
- Push notifications

---

## 🎯 Success Metrics

### Technical KPIs
- API Response Time: < 200ms (p95)
- Balance Sync Time: < 100ms
- Transfer Success Rate: > 99.5%
- Uptime: > 99.9%
- Error Rate: < 0.1%

### User Experience KPIs
- Dashboard Load Time: < 2s
- Transfer Completion Time: < 5s
- Cross-app Navigation: < 500ms
- User Satisfaction: > 4.5/5

### Business KPIs
- Active Users
- Transaction Volume
- Transfer Success Rate
- Customer Support Tickets
- Net Promoter Score (NPS)

---

## 🚧 Known Limitations & Future Improvements

### Current Limitations
1. localStorage limited to 5-10MB
2. No real backend validation
3. Mock authentication
4. No encryption
5. Single device only

### Future Improvements
1. Backend API with PostgreSQL
2. Real-time WebSocket updates
3. Multi-device sync
4. Advanced fraud detection
5. Machine learning for insights
6. Third-party integrations (Plaid, Stripe)
7. International transfers
8. Cryptocurrency support
9. Robo-advisor features
10. Social trading

---

## 📞 Support & Maintenance

### Monitoring
- Error tracking (Sentry)
- Performance monitoring (Vercel)
- User analytics (PostHog)
- Uptime monitoring (UptimeRobot)

### Logging
- Application logs
- Transaction logs
- Audit logs
- Security logs

### Backup & Recovery
- Daily database backups
- Point-in-time recovery
- Disaster recovery plan
- Data retention policy (7 years)

---

## 🎓 Developer Onboarding

### Prerequisites
- Node.js 18+
- TypeScript knowledge
- React/Next.js experience
- Git fundamentals

### Setup Steps
1. Clone repository
2. Install dependencies (`npm install`)
3. Review architecture docs
4. Run local development servers
5. Explore codebase with examples
6. Read API documentation
7. Write first feature

### Resources
- Architecture diagrams (this file)
- API documentation (OpenAPI spec)
- Component storybook
- Testing guides
- Contribution guidelines

---

## 🏆 Best Practices

### Code Quality
- TypeScript strict mode
- ESLint + Prettier
- Automated testing
- Code reviews
- Documentation

### Git Workflow
- Feature branches
- Conventional commits
- Pull request templates
- CI/CD automation
- Semantic versioning

### Security
- Regular dependency updates
- Security audits
- Penetration testing
- Bug bounty program
- Incident response plan

---

This architecture is designed to scale from a demo/prototype to a production-ready financial platform with millions of users. Start with the unified ledger, then gradually add features while maintaining backwards compatibility.
