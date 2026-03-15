#!/usr/bin/env bash
set -euo pipefail

echo "=== CryptoFlow Deploy ==="

# Copy env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "[!] Created .env from .env.example — edit it before re-running!"
  exit 1
fi

# Pull latest code (if git)
if [ -d .git ]; then
  git pull
fi

# Build & restart
docker compose pull nginx 2>/dev/null || true
docker compose build --no-cache
docker compose up -d --remove-orphans

echo ""
echo "[OK] Services:"
docker compose ps

echo ""
echo "[OK] CryptoFlow is running!"
echo "     Frontend: http://$(curl -s ifconfig.me 2>/dev/null || echo 'YOUR_SERVER_IP')"
