#!/usr/bin/env bash
# DevBox 启动脚本：后端 3000 + Web 静态/反代 8080
set -euo pipefail
ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT/backend"

if [ ! -d node_modules ]; then
  echo "[entrypoint] installing backend deps..."
  npm ci --omit=dev --no-audit --no-fund
fi

echo "[entrypoint] starting backend :3000"
node server.js &
BACK_PID=$!

echo "[entrypoint] starting web :8080"
cd "$ROOT"
node deploy/devbox/server-web.mjs &
WEB_PID=$!

cleanup() { kill "$BACK_PID" "$WEB_PID" 2>/dev/null || true; }
trap cleanup INT TERM
wait "$WEB_PID"
