import { Redis, type RedisOptions } from "ioredis";

function buildRedisOptions(tls: boolean): RedisOptions {
  const base: RedisOptions = {
    maxRetriesPerRequest: null,
    enableOfflineQueue: true,
    reconnectOnError: (err) => {
      // Recover from replica READONLY errors (e.g., Redis Sentinel failover)
      return err.message.includes("READONLY");
    },
  };

  if (tls) {
    base.tls = {
      rejectUnauthorized: true,
      checkServerIdentity: () => undefined,
    };
  }

  return base;
}

let _client: Redis | null = null;

/**
 * Returns a shared IORedis client suitable for BullMQ connections.
 * Reads REDIS_URL from env; uses TLS when REDIS_TLS=true or NODE_ENV=production.
 */
export function getRedisClient(): Redis {
  if (_client) return _client;

  const url = process.env.REDIS_URL;
  if (!url) throw new Error("REDIS_URL environment variable is required");

  // Default to true in production ONLY if REDIS_TLS is not explicitly set to "false"
  const useTls = process.env.REDIS_TLS === "false" 
    ? false 
    : (process.env.REDIS_TLS === "true" || process.env.NODE_ENV === "production");

  _client = new Redis(url, buildRedisOptions(useTls));

  _client.on("connect",     () => console.info("[Queue:Redis] Connected"));
  _client.on("ready",       () => console.info("[Queue:Redis] Ready"));
  _client.on("reconnecting",() => console.warn("[Queue:Redis] Reconnecting…"));
  _client.on("end",         () => console.info("[Queue:Redis] Connection closed"));
  _client.on("error",  (err) => console.error("[Queue:Redis] Error:", err.message));

  return _client;
}

/** Close the shared Redis connection (for graceful shutdown). */
export async function closeRedis(): Promise<void> {
  if (_client) {
    await _client.quit();
    _client = null;
  }
}
