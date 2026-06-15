# AuraWallet

Digital wallet and payments app — part of the Aura Finance suite. Runs on **port 3003**.

## Features

- **Wallet Balance** — Multi-currency wallet with USD as primary
- **P2P Transfers** — Send money to contacts by name or phone number
- **QR Payments** — Scan or generate QR codes for instant payments
- **Bills** — Pay utilities, airtime, and recurring services
- **Contacts** — Saved payees with recent transaction history
- **Spend Analytics** — Category breakdown charts on the home overview
- **Settings** — Profile, security, notification preferences

## Brand

Dark navy theme — `bg-[#0B1E39]` with `green-500` / `emerald-600` accent colors.

## Local Dev

```bash
cd AuraWallet
npm install
npm run dev   # http://localhost:3003
```

## Auth

Reads unified session from AuraFinance hub. Redirects to `localhost:3000/login` if no session found. State syncs to hub API every 1.2 s and on tab close.

Demo user (`userId=1`) is pre-seeded with wallet balance and transaction history.
