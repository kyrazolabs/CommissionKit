#!/bin/sh

# Start Next.js standalone server in the background, capturing logs
echo "[entrypoint] Starting Next.js..."
bun /app/artifacts/blog/server.js > /tmp/nextjs.log 2>&1 &
NEXT_PID=$!
echo "[entrypoint] Next.js PID: $NEXT_PID"

# Wait for Next.js to accept connections (retry up to 30 attempts, 5s apart = 150s)
READY=0
for i in $(seq 1 30); do
    if curl -so /dev/null http://127.0.0.1:3000 2>/dev/null; then
        echo "[entrypoint] Next.js server ready (PID $NEXT_PID, attempt $i)"
        READY=1
        break
    fi
    # Check if process still alive
    if ! kill -0 $NEXT_PID 2>/dev/null; then
        echo "[entrypoint] ERROR: Next.js process died. Last log output:"
        tail -50 /tmp/nextjs.log
        break
    fi
    sleep 5
done

if [ $READY -eq 0 ]; then
    echo "[entrypoint] WARNING: Next.js not ready, starting nginx anyway"
fi

# Start nginx in the foreground (this becomes PID 1)
echo "[entrypoint] Starting nginx..."
exec nginx -g "daemon off;"
