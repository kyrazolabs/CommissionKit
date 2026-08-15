import { Worker } from "bullmq";
import { IntegrationConnection, IntegrationSync } from "@workspace/db";
import { getRedisClient, SYNC_DEALS_QUEUE } from "@workspace/queue";
import type { SyncDealsPayload } from "@workspace/queue";
import { pluginRegistry } from "@workspace/plugins-core";
import { logger } from "../lib/logger";
import { ensureFreshConfig } from "../lib/integrations/oauth";
import * as Sentry from "@sentry/bun";
import { acquireWorkspaceLock } from "../lib/sync/lock";
import { upsertDeals } from "../lib/sync/upsert-engine";

const WORKER_OPTS = {
  connection: getRedisClient(),
  prefix: "ck",
  defaultJobOptions: {
    removeOnComplete: { age: 86400, count: 10000 },
    removeOnFail: { age: 604800, count: 5000 },
  },
};

export const syncDealsWorker = new Worker<SyncDealsPayload>(
  SYNC_DEALS_QUEUE,
  async (job) => {
    const { workspaceId, connectorName, trigger } = job.data;

    const release = await acquireWorkspaceLock(workspaceId);
    try {
      const conn = await IntegrationConnection.findOne({ workspaceId, connectorName });
      if (!conn || conn.status !== "connected") {
        logger.warn({ workspaceId, connectorName }, "[SyncDealsWorker] Not connected, skipping");
        return;
      }

      const plugin = pluginRegistry.get(connectorName);
      if (!plugin) {
        logger.warn({ connectorName }, "[SyncDealsWorker] Unknown connector");
        return;
      }

      const syncRecord = await IntegrationSync.create({
        workspaceId,
        connectorName,
        entityType: "deals",
        direction: "ingress",
        trigger,
        status: "running",
        startedAt: new Date(),
      });

      try {
        await job.updateProgress(10);

        const pluginConfig = await ensureFreshConfig(conn, plugin);

        const deals = await plugin.fetchDeals(
          workspaceId,
          pluginConfig,
          {},
        );

        await job.updateProgress(50);

        const stats = await upsertDeals(
          workspaceId,
          connectorName,
          deals,
          syncRecord._id.toString(),
        );

        await IntegrationSync.findByIdAndUpdate(syncRecord._id, {
          status: stats.failed > 0 ? "partial" : "completed",
          stats,
          completedAt: new Date(),
        });

        await IntegrationConnection.findByIdAndUpdate(conn._id, {
          lastSyncedAt: new Date(),
          lastError: undefined,
        });

        logger.info(
          { workspaceId, connectorName, stats },
          "[SyncDealsWorker] Deal sync complete",
        );

        await job.updateProgress(100);
      } catch (err: any) {
        logger.error({ err, workspaceId, connectorName }, "[SyncDealsWorker] Deal sync failed");
        Sentry.captureException(err, {
          tags: { worker: "sync-deals", connectorName },
          extra: { workspaceId, trigger },
        });

        await IntegrationSync.findByIdAndUpdate(syncRecord._id, {
          status: "failed",
          error: err.message,
          completedAt: new Date(),
        });

        await IntegrationConnection.findOneAndUpdate(
          { workspaceId, connectorName },
          { lastError: err.message },
        );

        throw err; // Let BullMQ handle retry
      }
    } finally {
      release();
    }
  },
  WORKER_OPTS,
);
