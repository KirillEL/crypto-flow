# CryptoFlow

A Telegram Mini App for real-time cryptocurrency monitoring. Track prices, manage a watchlist, portfolio, and price alerts — all inside Telegram.

**Supported coins:** BTC, ETH, BNB, SOL, XRP, ADA, DOGE, AVAX, DOT, MATIC, LINK, UNI, ATOM, LTC, TRX

## Prerequisites

- Docker & Docker Compose
- A domain with HTTPS (required for Telegram webhooks)
- A Telegram Bot token from [@BotFather](https://t.me/BotFather)
- A Telegram Mini App configured in BotFather (for share links and deep linking)

## Setup

### 1. Clone and configure environment

```bash
git clone <repo-url>
cd cryptoFlow
cp .env.example .env
```

Edit `.env` and fill in all values:

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | Bot token from @BotFather |
| `TELEGRAM_BOT_NAME` | Yes | Bot username without `@` (e.g. `CryptoFlowBot`) |
| `TELEGRAM_APP_NAME` | Yes | Mini App short name set in BotFather |
| `TELEGRAM_WEBHOOK_URL` | Yes | Full URL to your server's webhook endpoint: `https://your-domain.com/bot/webhook` |
| `ALLOWED_ORIGINS` | Yes | Your frontend domain for CORS: `https://your-domain.com` |
| `VITE_WS_URL` | No | Binance WebSocket URL (default: `wss://stream.binance.com:9443/stream`) |

> **Note:** `VITE_TELEGRAM_BOT_NAME` and `VITE_TELEGRAM_APP_NAME` are passed automatically to the frontend build from `TELEGRAM_BOT_NAME` and `TELEGRAM_APP_NAME`. No need to set them separately.

### 2. Configure Nginx (optional but recommended)

The repo includes `nginx/nginx.conf` as a reverse proxy config. Point your domain to port 80 of the server. For HTTPS, uncomment and fill in the SSL block in `nginx/nginx.conf`.

### 3. Deploy

```bash
./deploy.sh
```

This will:
1. Check that `.env` exists (creates from `.env.example` if not — then exits for you to fill it in)
2. Pull latest code from git
3. Build and start all Docker services

The app will be available at `http://YOUR_SERVER_IP` (port 80 via Nginx).

### Manual commands

```bash
docker compose up --build        # Build and start
docker compose down              # Stop all services
docker compose logs -f backend   # View backend logs
docker compose logs -f frontend  # View frontend logs
```

## Architecture

```
Browser / Telegram Mini App
        │
        ├── GET /api/*  ──►  Go backend (port 8080)
        │                    ├── Binance REST API (coin prices, candles)
        │                    ├── SQLite /data/alerts.db (alerts, portfolio)
        │                    └── Telegram Bot API (webhooks, notifications)
        │
        ├── GET /*  ──────►  React SPA (served by Nginx)
        │
        └── WebSocket  ───►  Binance WS (direct from browser, no backend relay)
                             wss://stream.binance.com:9443/stream
```

- **Frontend:** React 18 + TypeScript + Vite + TailwindCSS + Zustand
- **Backend:** Go 1.22 + Gin — REST API with 15s cache on `/api/coins`
- **Real-time prices:** Browser connects directly to Binance WebSocket (no backend relay)
- **Database:** SQLite, persisted in Docker volume `alerts_data`
- **Proxy:** Nginx routes `/api/*` to backend, everything else to frontend SPA

## Local Development

```bash
# Backend
cd backend
cp .env.example .env   # fill in values
go run ./cmd/server

# Frontend (separate terminal)
cd frontend
cp .env.example .env   # set VITE_API_URL=http://localhost:8080/api for local
npm install
npm run dev            # Vite dev server on http://localhost:3000
```

The frontend Vite dev server proxies `/api` to `http://localhost:8080` automatically.
