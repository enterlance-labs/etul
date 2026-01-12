#!/bin/sh
set -e

attempts=30
while [ $attempts -gt 0 ]; do
  if bunx prisma db push; then
    break
  fi
  attempts=$((attempts - 1))
  if [ $attempts -eq 0 ]; then
    echo "Prisma db push failed after retries" >&2
    exit 1
  fi
  sleep 2
done

exec bun src/main.ts
