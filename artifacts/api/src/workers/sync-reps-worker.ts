import { Worker } from "bullmq";
import { IntegrationConnection, IntegrationSync } from "@workspace/db";
import { getRedisClient, SYNC_REPS_QUEUE } from "@workspace/queue";
import type { SyncRepsPayload } from "@workspace/queue";
import { pluginRegistry } from "@workspace/plugins-core";
import { logger } from "../lib/logger";
import * as Sentry from "@sentry/bun";
import { acquireWorkspaceLock } from "../lib/sync/lock";
import { upsertReps } from "../lib/sync/upsert-engine";

const WORKER_OPTS = {
  connection: getRedisClient(),
  prefix: "ck",
  defaultJobOptions: {
    removeOnComplete: { age: 86400, count: 10000 },
    removeOnFail: { age: 604800, count: 5000 },
  },
};

export const syncRepsWorker = new Worker<SyncRepsPayload>(
  SYNC_REPS_QUEUE,
  async (job) => {
    const { workspaceId, connectorName, trigger } = job.data;

    const release = await acquireWorkspaceLock(workspaceId);
    try {
      const conn = await IntegrationConnection.findOne({ workspaceId, connectorName });
      if (!conn || conn.status !== "connected") {
        logger.warn({ workspaceId, connectorName }, "[SyncRepsWorker] Not connected, skipping");
        return;
      }

      const plugin = pluginRegistry.get(connectorName);
      if (!plugin) {
        logger.warn({ connectorName }, "[SyncRepsWorker] Unknown connector");
        return;
      }

      const syncRecord = await IntegrationSync.create({
        workspaceId,
        connectorName,
        entityType: "reps",
        direction: "ingress",
        trigger,
        status: "running",
        startedAt: new Date(),
      });

      try {
        await job.updateProgress(10);

        const pluginConfig = {
          ...(conn.config as Record<string, unknown> || {}),
          _metadata: conn.metadata || {},
        };

        const reps = await plugin.fetchReps(
          workspaceId,
          pluginConfig,
          {},
        );

        await job.updateProgress(50);

        const stats = await upsertReps(
          workspaceId,
          connectorName,
          reps,
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
        { workspaceId, connectorName, configKeys: Object.keys(conn.config || {}).slice(0, 10) },
        "[SyncRepsWorker] Config keys",
      );

        await job.updateProgress(100);
      } catch (err: any) {
        logger.error({ err, workspaceId, connectorName }, "[SyncRepsWorker] Rep sync failed");
        Sentry.captureException(err, {
          tags: { worker: "sync-reps", connectorName },
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
