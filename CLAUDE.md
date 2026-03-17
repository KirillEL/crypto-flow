# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Frontend (in `frontend/`)
```bash
npm run build    # TypeScript check + production build
npm run preview  # Preview production build
```

### Backend (in `backend/`)
```bash
go build ./cmd/server     # Build binary
go run ./cmd/server       # Run dev server (port 8080)
```

### Docker (from root)
```bash
docker compose up --build    # Build and start all services
docker compose build         # Build images only
./deploy.sh                  # Full VDS deployment (git pull + build + up)
```

No lint or test pipelines exist in this project.

## Architecture

**Request flow**: Browser → Nginx (port 80) → routes `/api/*` to Go backend (port 8080) or serves React SPA

**Real-time prices**: Browser connects **directly** to `wss://stream.binance.com:9443/stream` — no backend WebSocket relay. This avoids rate limiting and backend complexity.

**Data flow**:
1. On load, frontend fetches `/api/coins` (Go fetches from Binance REST, 15s cache, returns prices + 24×1h sparkline candles)
2. Zustand store (`cryptoStore.ts`) holds all state: coin list, watchlist, sort, active timeframe
3. `useWebSocket.ts` opens Binance WS and patches live prices into the store
4. Watchlist is persisted in `localStorage`

**Backend services** (`backend/internal/services/`):
- `binance.go` — Binance REST calls + sparkline fetch
- `telegram.go` — Bot webhook handling, sends notifications
- Alert monitor — background goroutine polling for price alerts

**Database**: SQLite at `/data/alerts.db` (Docker volume `alerts_data`). Used for alerts and portfolio.

**Environment**: Copy `.env.example` → `.env` at root and `backend/.env`. Key vars: `TELEGRAM_BOT_TOKEN`, `WEBHOOK_URL`, `CORS_ORIGINS`, `VITE_API_URL=/api`.

## Key Patterns

- Path alias `@/*` maps to `frontend/src/*`
- Tailwind dark theme base color: `bg-primary = #0a0e1a`
- Telegram deep linking via `?startapp=coin_BTC` query param → navigates to `/coin/BTC`
- Backend CORS configured via env var `CORS_ORIGINS`
- Frontend Docker build passes `VITE_*` vars as build args (not at runtime)
- Nginx applies rate limiting (30 req/min) on `/api/` routes
