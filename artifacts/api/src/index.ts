import "dotenv/config";

import app from "./app";
import { logger } from "./lib/logger";
import { getRedisClient, verifySmtp, enqueueExchangeRateSync } from "@workspace/queue";
import { connectDB } from "@workspace/db";

// ─── Boot workers (moved to boot() function) ──────────────────────────────────

const rawPort = process.env["PORT"] ?? "8080";
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// ─── Verify SMTP on startup (non-fatal) ──────────────────────────────────────
if (process.env.SMTP_HOST) {
  verifySmtp().catch((err) => {
    logger.warn({ err }, "[Mailer] SMTP verification failed — emails will queue but not send until SMTP is reachable");
  });
} else {
  logger.warn("[Mailer] SMTP_HOST not set — emails will be queued but not delivered");
}

// ─── Start HTTP server ────────────────────────────────────────────────────────
async function boot() {
  try {
    await connectDB();

    // ─── Boot workers ─────────────────────────────────────────────────────────────
    // Register BullMQ workers only AFTER DB is connected.
    await import("@workspace/queue/worker");
    await import("./workers/calc-worker");
    
    const server = app.listen(port, (err) => {
      if (err) {
        logger.error({ err }, "Error listening on port");
        process.exit(1);
      }
      logger.info({ port }, "Server listening");
      
      // ─── Schedule Background Jobs ───────────────────────────────────────────────
      enqueueExchangeRateSync({ force: true }).catch((err) => {
        logger.error({ err }, "[Queue] Failed to schedule exchange rate sync on startup");
      });
    });

    // Handle shutdown
    const shutdownHandler = (signal: string) => {
      logger.info({ signal }, "Shutdown signal received — closing gracefully");
      server.close(async () => {
        try {
          const { closeWorkers } = await import("@workspace/queue/worker");
          await closeWorkers();
          await getRedisClient().quit();
          logger.info("Shutdown complete");
          process.exit(0);
        } catch (err) {
          logger.error({ err }, "Error during shutdown");
          process.exit(1);
        }
      });
    };

    process.on("SIGTERM", () => shutdownHandler("SIGTERM"));
    process.on("SIGINT",  () => shutdownHandler("SIGINT"));

  } catch (err) {
    // Print raw error directly — pino fails to serialize Mongoose error objects (circular refs)
    console.error("[boot] Startup error:", err instanceof Error ? err.stack : String(err));
    logger.error({ err: String(err) }, "Failed to connect to database on startup");
    process.exit(1);
  }
}

boot();
