# AuraBank

Digital banking app — part of the Aura Finance suite. Runs on **port 3001**.

## Features

- **Accounts** — Checking, savings, credit, and multi-currency (GHS, EUR) accounts
- **Cards** — Virtual and physical card management, freeze/unfreeze, spend controls
- **Transfers** — Internal account-to-account and cross-app transfers to AuraWallet/AuraVest
- **Bills** — Schedule and pay recurring bills
- **Budgeting** — Category-based budget tracking with spend ring indicators
- **Transactions** — Full history with search, filtering, and category tags
- **Settings** — Profile, security, notifications, and preferences

## Brand

Colors: `magenta-500` (#D91E78) + `cyan-500` (#40C9C9) on a light theme.

## Local Dev

```bash
cd AuraBank
npm install
npm run dev   # http://localhost:3001
```

## Auth

Uses a shared session written by AuraFinance. On load it reads the unified session from `sessionStorage` / `localStorage` and bootstraps user state from the hub API (`GET /api/state?userId=...`). State is persisted back every 1.2 s and on tab close.

Demo user: `userId=1` — pre-seeded with accounts and transactions.
