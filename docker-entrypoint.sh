#!/bin/sh
set -e

DB_PATH="/app/db/databridge.db"
SEED_FILE="/app/prisma/seed.js"

echo "==> DataBridge Analytics starting..."

if [ -n "$REDIS_URL" ]; then
  echo "    Waiting for Redis..."
  REDIS_HOST=$(echo "$REDIS_URL" | sed -E 's|redis://[^@]*@?([^:]+):.*|\1|')
  REDIS_PORT=$(echo "$REDIS_URL" | sed -E 's|.*:([0-9]+)/?.*|\1|')
  for i in $(seq 1 10); do
    if nc -z "$REDIS_HOST" "${REDIS_PORT:-6379}" 2>/dev/null; then
      echo "    Redis is ready."
      break
    fi
    if [ "$i" -eq 10 ]; then
      echo "    WARNING: Redis not reachable. Using in-memory cache."
    fi
    sleep 1
  done
fi

if [ ! -f "$DB_PATH" ]; then
  echo "==> First run detected."
  mkdir -p /app/db
  npx prisma db push --skip-generate
  if [ -f "$SEED_FILE" ]; then
    echo "    Seeding demo data..."
    node "$SEED_FILE"
  fi
  echo "==> Database ready."
else
  echo "    Database found — skipping init."
fi

echo "==> Launching server on port ${PORT:-3000}..."
exec node server.js
