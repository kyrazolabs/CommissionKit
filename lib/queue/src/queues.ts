import { Queue, type QueueOptions } from "bullmq";
import { getRedisClient } from "./connection.js";
import {
  MAIL_HIGH_QUEUE,
  MAIL_LOW_QUEUE,
  MAIL_MEDIUM_QUEUE,
  MAIL_SEND_QUEUE,
  COMMISSION_CALC_QUEUE,
  EXCHANGE_RATE_QUEUE,
  LOGS_FLUSH_QUEUE,
  SYNC_REPS_QUEUE,
  SYNC_DEALS_QUEUE,
  WEBHOOK_INGRESS_QUEUE,
  SYNC_EGRESS_QUEUE,
} from "./constants.js";
import type {
  MailSendPayload,
  CommissionCalcPayload,
  ExchangeRatePayload,
  SyncRepsPayload,
  SyncDealsPayload,
  WebhookIngressPayload,
} from "./schemas.js";

/** Shared BullMQ queue options — exponential back-off, 10 retries */
function buildOptions(overrides?: Partial<QueueOptions>): QueueOptions {
  return {
    connection: getRedisClient(),
    prefix: "ck",
    defaultJobOptions: {
      attempts: 10,
      backoff: {
        type: "exponential",
        delay: 5_000, // 5s → 10s → 20s → …
      },
      removeOnComplete: { count: 1_000 }, // keep last 1k completed jobs
      removeOnFail: { count: 5_000 },     // keep last 5k failed jobs for DLQ
    },
    ...overrides,
  };
}

// ─── Routing queues ───────────────────────────────────────────────────────────
// These receive jobs from producers and fan them out to the SMTP execution queue.

/** Critical emails: invitations, password resets, magic links. 3 retries, fast. */
export const mailHighQueue = new Queue<MailSendPayload>(
  MAIL_HIGH_QUEUE,
  buildOptions({ defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 2_000 } } }),
);

/** Standard notifications: commission run reports, workspace alerts. */
export const mailMediumQueue = new Queue<MailSendPayload>(
  MAIL_MEDIUM_QUEUE,
  buildOptions({ defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 5_000 } } }),
);

/** Low-urgency: weekly summaries, digest reports. */
export const mailLowQueue = new Queue<MailSendPayload>(
  MAIL_LOW_QUEUE,
  buildOptions({ defaultJobOptions: { attempts: 3, backoff: { type: "fixed", delay: 30_000 } } }),
);

/** SMTP execution queue — routed to by the priority workers. Concurrency-limited. */
export const mailSendQueue = new Queue<MailSendPayload>(
  MAIL_SEND_QUEUE,
  buildOptions(),
);

/** Asynchronous commission calculation queue. */
export const commissionCalcQueue = new Queue<CommissionCalcPayload>(
  COMMISSION_CALC_QUEUE,
  buildOptions({ defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 10_000 } } }),
);

/** Exchange rate synchronization queue. */
export const exchangeRateQueue = new Queue<ExchangeRatePayload>(
  EXCHANGE_RATE_QUEUE,
  buildOptions({ defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 60_000 } } }),
);

/** Logs flush and S3 upload queue. */
export const logsFlushQueue = new Queue<{ force?: boolean }>(
  LOGS_FLUSH_QUEUE,
  buildOptions({ defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 30_000 } } }),
);

/** Helper map from priority to routing queue */
export const PRIORITY_QUEUE_MAP = {
  high:   mailHighQueue,
  medium: mailMediumQueue,
  low:    mailLowQueue,
} as const;

// ─── Sync queues ────────────────────────────────────────────────────────────

/** Rep sync queue — ingests normalized reps from ERP connectors. */
export const syncRepsQueue = new Queue<SyncRepsPayload>(
  SYNC_REPS_QUEUE,
  buildOptions({ defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 10_000 } } }),
);

/** Deal sync queue — ingests normalized deals from ERP/CRM connectors. */
export const syncDealsQueue = new Queue<SyncDealsPayload>(
  SYNC_DEALS_QUEUE,
  buildOptions({ defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 10_000 } } }),
);

/** Webhook ingress queue — receives and routes webhook events from connectors. */
export const webhookIngressQueue = new Queue<WebhookIngressPayload>(
  WEBHOOK_INGRESS_QUEUE,
  buildOptions({ defaultJobOptions: { attempts: 5, backoff: { type: "exponential", delay: 2_000 } } }),
);

/** Sync egress queue — writes commission results back to ERP. */
export const syncEgressQueue = new Queue<{ workspaceId: string; runId: string }>(
  SYNC_EGRESS_QUEUE,
  buildOptions({ defaultJobOptions: { attempts: 3, backoff: { type: "exponential", delay: 10_000 } } }),
);
