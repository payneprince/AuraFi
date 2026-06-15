# AuraVest

Multi-asset investment platform — part of the Aura Finance suite. Runs on **port 3002**.

## Features

- **Portfolio** — Track holdings across Crypto, Stocks, Gold, and NFTs with live P&L
- **Markets** — Live prices via CoinGecko (50 cryptos) and Yahoo Finance (10 stocks + gold futures)
- **Trading** — Buy/sell interface with real-time Binance WebSocket candlestick charts
- **Watchlist** — Save and monitor assets with price alerts
- **DCA** — Dollar-cost averaging planner
- **Fear & Greed Index** — Crypto sentiment via Alternative.me
- **Settings** — Preferences, security, notifications

## Live Data Sources

| Source | Data |
|--------|------|
| CoinGecko | Crypto prices, market caps, 30-day change |
| Yahoo Finance | Stock quotes + gold futures (GC=F) |
| Binance WebSocket | Live OHLC klines for trading charts |
| Alternative.me | Crypto Fear & Greed Index |

## Brand

Dark theme — `bg-slate-950` / black with `red-500` / `red-800` accent colors.

## Local Dev

```bash
cd AuraVest
npm install
npm run dev   # http://localhost:3002
```

## Auth

Reads unified session from AuraFinance hub. Redirects to `localhost:3000/login` if no session found. Demo user (`userId=1`) is pre-seeded with a $125k portfolio.
