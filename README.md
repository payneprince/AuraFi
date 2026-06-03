# Aura Finance Suite

Aura Finance is a multi-app fintech suite composed of one hub application and three product applications:
- AuraFinance: main hub, cross-app services, and orchestration
- AuraBank: banking experience
- AuraVest: investing experience
- AuraWallet: wallet and payments experience

This document is the single entry point for the project.

## 1. Project Overview

The suite is designed around shared user identity, cross-app balance visibility, and transfer interoperability.

Core goals:
- Unified user session behavior across apps
- Cross-app transfer support through the AuraFinance hub APIs
- Shared ledger and state synchronization
- Consistent UI and experience across the app family

## 2. Applications and Ports

- AuraFinance: http://localhost:3000
- AuraBank: http://localhost:3001
- AuraVest: http://localhost:3002
- AuraWallet: http://localhost:3003

## 3. Repository Structure

- AuraFinance/: main Next.js app and orchestration APIs
- AuraBank/: banking Next.js app
- AuraVest/: investing Next.js app
- AuraWallet/: wallet Next.js app
- shared/: cross-app shared logic and utilities
- scripts/: operational and integration scripts
- ARCHITECTURE.md: technical architecture deep dive
- QUICK_START.md: implementation-oriented guide
- IMPLEMENTATION_PLAN.md: phased roadmap
- DIAGRAMS.md: visual/system diagrams
- COMPARISON.md: implementation status and parity matrix
- EXECUTIVE_SUMMARY.md: high-level project narrative
- INDEX.md: index of documentation files

## 4. Tech Stack

- Next.js (App Router)
- React + TypeScript
- Tailwind CSS
- NextAuth (present in dependencies for auth flows)
- Shared TypeScript/JavaScript modules in shared/

## 5. Local Development Setup

Prerequisites:
- Node.js 18+
- npm 9+

Install dependencies per app:

```bash
cd AuraFinance && npm install
cd ../AuraBank && npm install
cd ../AuraVest && npm install
cd ../AuraWallet && npm install
```

Run all apps in separate terminals:

```bash
cd AuraFinance && npm run dev
cd AuraBank && npm run dev
cd AuraVest && npm run dev
cd AuraWallet && npm run dev
```

Build or lint per app:

```bash
npm run lint
npm run build
npm run start
```

## 6. Shared Modules

Important files in shared/:
- shared/unified-auth.ts: session synchronization utilities
- shared/unified-ledger.ts: consolidated ledger logic
- shared/unified-ledger-server.ts: server-facing ledger behaviors
- shared/cross-app-transfer-sync.ts: transfer propagation helpers
- shared/browser-app-state.ts: browser state helpers
- shared/user-registry.ts and shared/user-registry.json: user mapping and registry
- shared/hooks/useUnifiedLedger.ts: React integration helper for ledger state

## 7. Hub APIs (AuraFinance)

Commonly used endpoints:
- GET /api/state?userId=1
- GET /api/suite-balances?userId=1
- GET /api/unified-ledger?userId=1
- POST /api/quick-transfer

The hub serves as the cross-app coordination layer for balance and transfer orchestration.

## 8. Integration and Health Scripts

From repository root:

```bash
bash scripts/suite-health.sh
```

Modes:
- default: lint each app + runtime/API checks
- --build: lint + build + runtime/API checks
- --runtime-only: skip lint/build, only runtime/API checks

Full integration checks:

```bash
bash scripts/suite-integration.sh
```

This script validates:
- transfer propagation across app pairs
- unified ledger event propagation visibility

## 9. Architecture Summary

High-level model:
- AuraFinance acts as hub and service gateway
- Bank, Vest, and Wallet are product UIs with app-specific capabilities
- Shared modules provide common auth, ledger, and synchronization behavior
- APIs and browser sync mechanisms keep state aligned across apps

For detailed diagrams and deeper technical decisions, see:
- ARCHITECTURE.md
- DIAGRAMS.md

## 10. Product Scope by App

AuraBank:
- accounts, transfers, cards, bills, budgeting, and settings

AuraVest:
- portfolio and investing workflows, educational resources, settings

AuraWallet:
- wallet balances, transaction and payment workflows, settings

AuraFinance:
- top-level dashboard, cross-app monitoring, transfer orchestration, auth/login flows

## 11. Documentation Map

Read in this order for onboarding:
1. EXECUTIVE_SUMMARY.md
2. INDEX.md
3. QUICK_START.md
4. ARCHITECTURE.md
5. IMPLEMENTATION_PLAN.md
6. COMPARISON.md
7. DIAGRAMS.md

## 12. Notes

- This repository currently uses app-level package management rather than a single workspace package manifest.
- Runtime behavior depends on all four apps being available when testing full cross-app flows.
- Some integration behavior uses persisted local state files under .data/.

---

If you want, the next step can be generating role-specific docs as separate files, for example:
- docs/DEVELOPER_GUIDE.md
- docs/API_REFERENCE.md
- docs/QA_CHECKLIST.md
- docs/DEPLOYMENT.md
