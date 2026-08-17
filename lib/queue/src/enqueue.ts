import {
  auditLogQueue,
  commissionCalcQueue,
  exchangeRateQueue,
  logsFlushQueue,
  PRIORITY_QUEUE_MAP,
} from "./queues.js";
import {
  type AuditLogJob,
  AuditLogJobSchema,
  type CommissionCalcPayload,
  type ExchangeRatePayload,
  type MailJob,
  MailJobSchema,
} from "./schemas.js";

/**
 * Enqueue an email job on the appropriate priority queue.
 *
 * @example
 * await enqueueEmail({
 *   to: "jane@example.com",
 *   subject: "You're invited!",
 *   html: invitationTemplate({ ... }),
 *   priority: "high",
 * });
 */
export async function enqueueEmail(job: MailJob): Promise<void> {
  const parsed = MailJobSchema.parse(job);
  const { priority, ...payload } = parsed;

  const queue = PRIORITY_QUEUE_MAP[priority];
  await queue.add("email", payload, {
    // Use a deduplication key if same email was already queued in last 5 minutes
    jobId: `${payload.to.replace(/:/g, "-")}-${Buffer.from(payload.subject).toString("base64url").slice(0, 16)}-${Math.floor(Date.now() / 300_000)}`,
  });

  console.info(`[Queue] Enqueued ${priority} email → ${payload.to} "${payload.subject}"`);
}

/**
 * Convenience wrapper — high-priority email.
 * Use for: invitations, password resets, magic links.
 */
export const sendHighPriorityEmail = (job: Omit<MailJob, "priority">) =>
  enqueueEmail({ ...job, priority: "high" });

/**
 * Convenience wrapper — medium-priority email.
 * Use for: commission run completed, new rep alerts.
 */
export const sendMediumPriorityEmail = (job: Omit<MailJob, "priority">) =>
  enqueueEmail({ ...job, priority: "medium" });

/**
 * Convenience wrapper — low-priority email.
 * Use for: weekly digests, summary reports.
 */
export const sendLowPriorityEmail = (job: Omit<MailJob, "priority">) =>
  enqueueEmail({ ...job, priority: "low" });

/**
 * Enqueue a commission calculation run.
 */
export async function enqueueCommissionCalc(payload: CommissionCalcPayload): Promise<void> {
  await commissionCalcQueue.add("calculate", payload, {
    // Unique jobId per run to prevent duplicate processing if re-submitted
    jobId: `calc-${payload.runId}`,
    removeOnComplete: true,
  });

  console.info(`[Queue] Enqueued commission calc → runId: ${payload.runId} (${payload.period})`);
}

/**
 * Enqueue an exchange rate synchronization job.
 */
export async function enqueueExchangeRateSync(
  payload: ExchangeRatePayload = { force: false },
): Promise<void> {
  // 1. Add the repeatable job (hourly)
  await exchangeRateQueue.add(
    "sync-periodic",
    { force: false },
    {
      jobId: "exchange-rate-periodic", // Fixed ID for the template
      removeOnComplete: true,
      repeat: { pattern: "0 * * * *" }, // Cron: every hour on the hour
    },
  );

  // 2. If force is true, add a one-off job to run IMMEDIATELY
  if (payload.force) {
    await exchangeRateQueue.add("sync-immediate", payload, {
      removeOnComplete: true,
    });
    console.info("[Queue] Enqueued immediate exchange rate sync");
  }

  console.info("[Queue] Exchange rate periodic sync scheduled (hourly)");
}

/**
 * Enqueue a logs flush and S3 upload job.
 */
export async function enqueueLogsFlush(
  payload: { force?: boolean } = { force: false },
): Promise<void> {
  // 1. Add the repeatable job
  const cronPattern = process.env.LOGS_FLUSH_CRON ?? "0 0 * * *";
  await logsFlushQueue.add(
    "flush-periodic",
    { force: false },
    {
      jobId: "logs-flush-periodic", // Fixed ID for repeatable template
      removeOnComplete: true,
      repeat: { pattern: cronPattern },
    },
  );

  // 2. If force is true, add a one-off job to run IMMEDIATELY
  if (payload.force) {
    await logsFlushQueue.add("flush-immediate", payload, {
      removeOnComplete: true,
    });
    console.info("[Queue] Enqueued immediate logs flush");
  }

  console.info(`[Queue] Logs flush periodic sync scheduled (cron: ${cronPattern})`);
}

/**
 * Enqueue an audit log event.
 */
export async function enqueueAuditEvent(job: AuditLogJob): Promise<void> {
  const withTimestamp = {
    ...job,
    timestamp: job.timestamp ?? new Date().toISOString(),
  };
  const parsed = AuditLogJobSchema.parse(withTimestamp);
  await auditLogQueue.add("audit-event", parsed, {
    jobId: `audit-${parsed.workspaceId}-${parsed.resourceType}-${parsed.resourceId ?? "none"}-${Date.now()}`,
  });
}
