import "dotenv/config";

import app from "./app";
import { logger } from "./lib/logger";
import { getRedisClient, closeWorkers, verifySmtp } from "@workspace/queue";

// ─── Boot workers ─────────────────────────────────────────────────────────────
// Import the workers module to register all BullMQ workers inside this process.
// In production you can move this to a separate worker process.
import "@workspace/queue/worker";
import "./workers/calc-worker";

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
const server = app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }
  logger.info({ port }, "Server listening");
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
async function shutdown(signal: string) {
  logger.info({ signal }, "Shutdown signal received — closing gracefully");

  server.close(async () => {
    try {
      await closeWorkers();
      await getRedisClient().quit();
      logger.info("Shutdown complete");
      process.exit(0);
    } catch (err) {
      logger.error({ err }, "Error during shutdown");
      process.exit(1);
    }
  });

  // Force-exit after 10s if connections hang
  setTimeout(() => {
    logger.error("Shutdown timeout — forcing exit");
    process.exit(1);
  }, 10_000);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT",  () => shutdown("SIGINT"));
