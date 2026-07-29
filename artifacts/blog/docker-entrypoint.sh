#!/bin/sh
set -e

# Start Next.js standalone server in the background
bun /app/artifacts/blog/server.js &
NEXT_PID=$!

# Wait for Next.js to be ready (retry up to 15s)
for i in $(seq 1 15); do
    if curl -sf http://127.0.0.1:3000/api/healthz > /dev/null 2>&1; then
        echo "[entrypoint] Next.js server ready (PID $NEXT_PID)"
        break
    fi
    if [ $i -eq 15 ]; then
        echo "[entrypoint] WARNING: Next.js did not respond within 15s, starting nginx anyway"
    fi
    sleep 1
done

# Start nginx in the foreground (this becomes PID 1)
echo "[entrypoint] Starting nginx..."
exec nginx -g "daemon off;"
