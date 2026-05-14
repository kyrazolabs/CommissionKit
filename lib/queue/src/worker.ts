import { Worker, type SandboxedJob } from "bullmq";
import { getRedisClient } from "./connection.js";
import { sendMail } from "./mailer.js";
import { mailSendQueue } from "./queues.js";
import type { MailSendPayload } from "./schemas.js";
import {
  MAIL_HIGH_QUEUE,
  MAIL_LOW_QUEUE,
  MAIL_MEDIUM_QUEUE,
  MAIL_SEND_QUEUE,
  COMMISSION_CALC_QUEUE,
  EXCHANGE_RATE_QUEUE,
} from "./constants.js";
import { fetchAndSaveRates } from "./exchangeRateService.js";

const WORKER_OPTS = {
  connection: getRedisClient(),
  prefix: "ck",
};

// ─── Routing workers ──────────────────────────────────────────────────────────
// Each priority queue worker pulls a job and forwards it to the SMTP execution queue.
// This allows per-priority concurrency and rate-limit control.

/**
 * High-priority routing worker.
 * Concurrency 20 — lets critical emails (invites, resets) burst through.
 */
export const highWorker = new Worker<MailSendPayload>(
  MAIL_HIGH_QUEUE,
  async (job) => {
    await mailSendQueue.add("send", job.data, {
      priority: 1, // BullMQ job priority — lower = higher precedence
    });
  },
  { ...WORKER_OPTS, concurrency: 20 },
);

/**
 * Medium-priority routing worker.
 * Concurrency 10 — steady throughput for notifications.
 */
export const mediumWorker = new Worker<MailSendPayload>(
  MAIL_MEDIUM_QUEUE,
  async (job) => {
    await mailSendQueue.add("send", job.data, { priority: 5 });
  },
  { ...WORKER_OPTS, concurrency: 10 },
);

/**
 * Low-priority routing worker.
 * Concurrency 5 — digest / bulk emails don't need to rush.
 */
export const lowWorker = new Worker<MailSendPayload>(
  MAIL_LOW_QUEUE,
  async (job) => {
    await mailSendQueue.add("send", job.data, { priority: 10 });
  },
  { ...WORKER_OPTS, concurrency: 5 },
);

// ─── SMTP execution worker ────────────────────────────────────────────────────

/**
 * Actual SMTP send worker.
 * Concurrency 2 + rate-limit 10/s to stay within provider limits.
 * Adjust these based on your SMTP provider's rate limits.
 */
export const smtpWorker = new Worker<MailSendPayload>(
  MAIL_SEND_QUEUE,
  async (job) => {
    console.info(`[Worker:SMTP] Processing job ${job.id} → ${job.data.to}`);
    const result = await sendMail(job.data);
    console.info(`[Worker:SMTP] Sent job ${job.id} → messageId: ${result.messageId}`);
    return result;
  },
  {
    ...WORKER_OPTS,
    concurrency: 2,
    limiter: { max: 10, duration: 1_000 }, // max 10 emails per second
  },
);

/**
 * Exchange rate sync worker.
 * Concurrency 1 — sequential updates.
 */
export const exchangeRateWorker = new Worker(
  EXCHANGE_RATE_QUEUE,
  async (job) => {
    console.log(`[Worker:ExchangeRate] Processing job ${job.id}`);
    const { connectDB } = await import("@workspace/db");
    await connectDB();
    await fetchAndSaveRates();
  },
  { ...WORKER_OPTS, concurrency: 1 },
);

// ─── Shared event handlers ────────────────────────────────────────────────────

function attachHandlers(worker: Worker, name: string) {
  worker.on("completed", (job) => {
    console.info(`[Worker:${name}] Job ${job.id} completed`);
  });

  worker.on("failed", (job, err) => {
    if (!job) return;
    const maxAttempts = job.opts?.attempts ?? 1;
    // Only log on final failure to avoid noise during retries
    if (job.attemptsMade >= maxAttempts) {
      console.error(
        `[Worker:${name}] Job ${job.id} permanently failed after ${job.attemptsMade} attempts:`,
        err.message,
        "\nPayload:", JSON.stringify(job.data, null, 2),
      );
      // TODO: push to Sentry / DLQ notification here
    }
  });

  worker.on("error", (err) => {
    console.error(`[Worker:${name}] Worker error:`, err);
  });
}

attachHandlers(highWorker,   "High");
attachHandlers(mediumWorker, "Medium");
attachHandlers(lowWorker,    "Low");
attachHandlers(smtpWorker,   "SMTP");
attachHandlers(exchangeRateWorker, "ExchangeRate");

/**
 * Gracefully close all workers.
 * Call this in your SIGTERM / SIGINT handler.
 */
export async function closeWorkers(): Promise<void> {
  await Promise.all([
    highWorker.close(),
    mediumWorker.close(),
    lowWorker.close(),
    smtpWorker.close(),
    exchangeRateWorker.close(),
  ]);
  console.info("[Workers] All workers closed gracefully");
}
