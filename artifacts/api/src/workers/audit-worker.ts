import { Worker } from "bullmq";
import { getRedisClient, AUDIT_LOG_QUEUE } from "@workspace/queue";
import { AuditEvent } from "@workspace/db";
import { logger } from "../lib/logger";

const WORKER_OPTS = {
  connection: getRedisClient(),
  prefix: "ck",
  defaultJobOptions: {
    attempts: 5,
    backoff: {
      type: "exponential",
      delay: 2_000,
    },
    removeOnComplete: { count: 1_000 },
    removeOnFail: { count: 10_000 },
  },
};

export const auditWorker = new Worker(
  AUDIT_LOG_QUEUE,
  async (job) => {
    const payload = job.data;

    logger.debug({ jobId: job.id }, "[Worker:Audit] Processing audit log job");

    await AuditEvent.create({
      workspaceId: payload.workspaceId,
      userId: payload.userId,
      userName: payload.userName,
      userEmail: payload.userEmail,
      action: payload.action,
      resourceType: payload.resourceType,
      resourceId: payload.resourceId,
      resourceName: payload.resourceName,
      changes: payload.changes,
      metadata: payload.metadata,
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      timestamp: payload.timestamp ? new Date(payload.timestamp) : new Date(),
    });

    logger.debug({ jobId: job.id }, "[Worker:Audit] Audit event persisted");
  },
  { ...WORKER_OPTS, concurrency: 20 },
);

auditWorker.on("completed", (job) => {
  logger.debug({ jobId: job.id }, "[Worker:Audit] Job completed");
});

auditWorker.on("failed", (job, err) => {
  if (!job) return;
  logger.error(
    { err, jobId: job.id, payload: job.data },
    "[Worker:Audit] Job failed",
  );
});
