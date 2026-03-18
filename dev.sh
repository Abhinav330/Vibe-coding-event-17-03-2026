#!/usr/bin/env sh
# Kill processes on backend (4000) and Next dev UI (3000) so both can start clean.
set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT"

echo "Killing processes on ports 4000 and 3000..."
for port in 4000 3000; do
  P=$(lsof -ti :$port 2>/dev/null) || true
  if [ -n "$P" ]; then
    kill -9 $P 2>/dev/null || true
  fi
done
sleep 1

echo "Starting backend (port 4000) and Next UI (port 3000)..."
bun run --watch brewbeats/backend/index.ts &
BACKEND_PID=$!

trap "kill $BACKEND_PID 2>/dev/null || true; exit 0" EXIT INT TERM

npm run dev:ui
