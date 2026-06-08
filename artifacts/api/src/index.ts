import "dotenv/config";

import "./instrument";
import app from "./app";
import { logger } from "./lib/logger";
import { getRedisClient, verifySmtp, enqueueExchangeRateSync, enqueueLogsFlush } from "@workspace/queue";
import { connectDB } from "@workspace/db";
import { bootstrapEngines } from "./workers/engines/registry";
import { pluginRegistry } from "@workspace/plugins-core";
import { CustomConnector } from "@workspace/plugins-custom";
import { OdooConnector } from "@workspace/plugins-odoo";
import { HubSpotConnector } from "@workspace/plugins-hubspot";

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

    // Register all commission engines
    await bootstrapEngines();

    // Register plugins
    pluginRegistry.register(new CustomConnector());
    pluginRegistry.register(new OdooConnector());
    pluginRegistry.register(new HubSpotConnector());

    // Rehydrate connected workspaces
    const { IntegrationConnection, IntegrationSync } = await import("@workspace/db");

    // Mark any "running" syncs as failed (stuck from previous crash)
    await IntegrationSync.updateMany(
      { status: "running" },
      { status: "failed", error: "Worker restarted", completedAt: new Date() },
    );
    const activeConnections = await IntegrationConnection.find({ status: "connected" });
    for (const conn of activeConnections) {
      try {
        const plugin = pluginRegistry.get(conn.connectorName);
        if (plugin) {
          await plugin.init(
            conn.workspaceId.toString(),
            conn.config as Record<string, unknown>,
          );
          logger.info({ workspaceId: conn.workspaceId, connector: conn.connectorName }, "[Boot] Rehydrated plugin connection");
        }
      } catch (err) {
        logger.error({ err, workspaceId: conn.workspaceId, connector: conn.connectorName }, "[Boot] Failed to rehydrate plugin");
      }
    }

    // ─── Boot workers ─────────────────────────────────────────────────────────────
    // Register BullMQ workers only AFTER DB is connected.
    await import("@workspace/queue/worker");
    await import("./workers/calc-worker");
    await import("./workers/logs-worker");
    await import("./workers/sync-reps-worker");
    await import("./workers/sync-deals-worker");
    await import("./workers/webhook-ingress-worker");

    // Restore scheduled sync jobs for connected workspaces
    const { syncRepsQueue, syncDealsQueue, commissionCalcQueue, exchangeRateQueue } = await import("@workspace/queue");

    // Sweep all existing scheduled-* repeatable jobs (cleanup stale ones)
    for (const q of [syncRepsQueue, syncDealsQueue, commissionCalcQueue, exchangeRateQueue]) {
      const jobs = await q.getRepeatableJobs().catch(() => []);
      for (const j of jobs) {
        if (j.name?.startsWith("scheduled-")) {
          await q.removeRepeatableByKey(j.key).catch(() => {});
        }
      }
    }

    for (const conn of activeConnections) {
      const wsId = conn.workspaceId.toString();
      const repSchedule = conn.syncSchedule?.reps || "hourly";
      const dealSchedule = conn.syncSchedule?.deals || "hourly";

      // Clean up any stale repeatable jobs first
      if (repSchedule === "manual") {
        for (const ms of [600_000, 3_600_000, 86_400_000]) {
          await syncRepsQueue.removeRepeatable(`scheduled-reps-${wsId}`, { every: ms }).catch(() => {});
        }
      } else {
        const repInterval = repSchedule === "realtime" ? 600_000 : repSchedule === "daily" ? 86_400_000 : 3_600_000;
        await syncRepsQueue.add(
          `scheduled-reps-${wsId}`,
          { workspaceId: wsId, connectorName: conn.connectorName, trigger: "scheduled" },
          { repeat: { every: repInterval }, jobId: `scheduled-reps-${wsId}`, removeOnComplete: { age: 300 }, removeOnFail: { age: 300 } },
        ).catch(() => {});
      }

      if (dealSchedule === "manual") {
        for (const ms of [600_000, 3_600_000, 86_400_000]) {
          await syncDealsQueue.removeRepeatable(`scheduled-deals-${wsId}`, { every: ms }).catch(() => {});
        }
      } else {
        const dealInterval = dealSchedule === "realtime" ? 600_000 : dealSchedule === "daily" ? 86_400_000 : 3_600_000;
        await syncDealsQueue.add(
          `scheduled-deals-${wsId}`,
          { workspaceId: wsId, connectorName: conn.connectorName, trigger: "scheduled" },
          { repeat: { every: dealInterval }, jobId: `scheduled-deals-${wsId}`, removeOnComplete: { age: 300 }, removeOnFail: { age: 300 } },
        ).catch(() => {});
      }
    }
    
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
      enqueueLogsFlush({ force: false }).catch((err) => {
        logger.error({ err }, "[Queue] Failed to schedule logs flush on startup");
      });
    });

    // Handle shutdown
    const shutdownHandler = (signal: string) => {
      logger.info({ signal }, "Shutdown signal received — closing gracefully");
      server.close(async () => {
        try {
          const { closeWorkers } = await import("@workspace/queue/worker");
          await closeWorkers();

          // Close sync workers
          const { syncRepsWorker } = await import("./workers/sync-reps-worker");
          const { syncDealsWorker } = await import("./workers/sync-deals-worker");
          const { webhookIngressWorker } = await import("./workers/webhook-ingress-worker");
          await syncRepsWorker.close();
          await syncDealsWorker.close();
          await webhookIngressWorker.close();

          // Close calc + logs workers
          const { calcWorker } = await import("./workers/calc-worker");
          const { logsWorker } = await import("./workers/logs-worker");
          await calcWorker.close();
          await logsWorker.close();

          // Destroy all plugin connections
          for (const plugin of pluginRegistry.list()) {
            const connections = await IntegrationConnection.find({
              connectorName: plugin.name,
              status: "connected",
            });
            for (const conn of connections) {
              await plugin.destroy(conn.workspaceId.toString()).catch(() => {});
            }
          }

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
