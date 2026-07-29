#!/bin/sh
set -e

# Start Next.js standalone server in the background
bun /app/artifacts/blog/server.js &
NEXT_PID=$!

# Wait for Next.js to accept connections (retry up to 120s, 2s apart)
for i in $(seq 1 60); do
    if curl -so /dev/null http://127.0.0.1:3000 2>/dev/null; then
        echo "[entrypoint] Next.js server ready (PID $NEXT_PID)"
        break
    fi
    if [ $i -eq 60 ]; then
        echo "[entrypoint] WARNING: Next.js did not respond within 120s, starting nginx anyway"
    fi
    sleep 2
done

# Start nginx in the foreground (this becomes PID 1)
echo "[entrypoint] Starting nginx..."
exec nginx -g "daemon off;"
