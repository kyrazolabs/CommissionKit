import { IntegrationConnection, IntegrationSync } from "@workspace/db";
import { pluginRegistry } from "@workspace/plugins-core";
import type { WebhookIngressPayload } from "@workspace/queue";
import {
  getRedisClient,
  syncDealsQueue,
  syncRepsQueue,
  WEBHOOK_INGRESS_QUEUE,
} from "@workspace/queue";
import { Worker } from "bullmq";
import { logger } from "../lib/logger";

const WORKER_OPTS = {
  connection: getRedisClient(),
  prefix: "ck",
  concurrency: 10,
  defaultJobOptions: {
    removeOnComplete: { age: 86400, count: 10000 },
    removeOnFail: { age: 604800, count: 5000 },
  },
};

export const webhookIngressWorker = new Worker<WebhookIngressPayload>(
  WEBHOOK_INGRESS_QUEUE,
  async (job) => {
    const { workspaceId, connectorName, entityType, eventType, externalId } = job.data;

    logger.info(
      { workspaceId, connectorName, entityType, eventType, externalId },
      "[WebhookIngress] Processing event",
    );

    const conn = await IntegrationConnection.findOne({ workspaceId, connectorName });
    if (!conn || conn.status !== "connected") {
      logger.warn({ workspaceId, connectorName }, "[WebhookIngress] Not connected, skipping");
      return;
    }

    // Route to the appropriate sync queue with just the affected entity
    if (entityType === "reps") {
      await syncRepsQueue.add(
        `webhook-rep-${externalId}`,
        {
          workspaceId,
          connectorName,
          trigger: "webhook",
          options: { externalIds: [externalId] },
        },
        { jobId: `webhook-rep-${connectorName}-${externalId}-${Date.now()}` },
      );
    } else if (entityType === "deals") {
      await syncDealsQueue.add(
        `webhook-deal-${externalId}`,
        {
          workspaceId,
          connectorName,
          trigger: "webhook",
          options: { externalIds: [externalId] },
        },
        { jobId: `webhook-deal-${connectorName}-${externalId}-${Date.now()}` },
      );
    }
  },
  WORKER_OPTS,
);
