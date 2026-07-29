#!/bin/sh
set -u

echo "[entrypoint] Starting Next.js..."
bun /app/artifacts/blog/server.js > /tmp/nextjs.log 2>&1 &
NEXT_PID=$!
echo "[entrypoint] Next.js PID: $NEXT_PID"

# Ensure Next.js is stopped cleanly if the container is asked to stop,
# and that nginx is stopped if Next.js dies unexpectedly.
cleanup() {
    echo "[entrypoint] Caught signal, shutting down..."
    kill -TERM "$NEXT_PID" 2>/dev/null
    kill -TERM "$NGINX_PID" 2>/dev/null
    wait "$NEXT_PID" 2>/dev/null
    wait "$NGINX_PID" 2>/dev/null
    exit 0
}
trap cleanup TERM INT

READY=0
DIED=0
for i in $(seq 1 30); do
    if curl -sf -o /dev/null --max-time 3 http://127.0.0.1:3000 2>/dev/null; then
        echo "[entrypoint] Next.js server ready (PID $NEXT_PID, attempt $i)"
        READY=1
        break
    fi
    if ! kill -0 "$NEXT_PID" 2>/dev/null; then
        echo "[entrypoint] ERROR: Next.js process died. Last log output:"
        tail -50 /tmp/nextjs.log
        DIED=1
        break
    fi
    sleep 5
done

if [ "$DIED" -eq 1 ]; then
    echo "[entrypoint] FATAL: Next.js exited before becoming ready. Not starting nginx."
    exit 1
fi

if [ "$READY" -eq 0 ]; then
    echo "[entrypoint] WARNING: Next.js not ready after retries, starting nginx anyway"
fi

echo "[entrypoint] Starting nginx..."
nginx -g "daemon off;" &
NGINX_PID=$!

# Wait on both; if either exits, tear down the other and exit with its code.
wait -n "$NEXT_PID" "$NGINX_PID" 2>/dev/null
EXIT_CODE=$?
cleanup
exit "$EXIT_CODE"