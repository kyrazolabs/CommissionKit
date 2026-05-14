import { z } from "zod";

/**
 * The canonical payload schema for any email job pushed onto the queues.
 * Priority routes the job to the correct queue; the SMTP worker only
 * ever sees the fields below after the routing worker strips `priority`.
 */
export const MailJobSchema = z.object({
  /** Recipient email address */
  to: z.string().email(),

  /** Optional display name: "Jane Doe <jane@example.com>" */
  toName: z.string().optional(),

  /** Email subject line */
  subject: z.string().min(1),

  /** Full HTML body */
  html: z.string().min(1),

  /** Plain-text fallback (auto-generated if omitted) */
  text: z.string().optional(),

  /** Reply-To address override */
  replyTo: z.string().email().optional(),

  /** Routing priority — determines which queue receives the job */
  priority: z.enum(["high", "medium", "low"]).default("medium"),

  /** Arbitrary metadata for logging / DLQ inspection */
  meta: z.record(z.string(), z.unknown()).optional(),
});

export type MailJob = z.infer<typeof MailJobSchema>;

/** What the SMTP send worker receives (priority stripped by routing worker) */
export type MailSendPayload = Omit<MailJob, "priority">;

export const CommissionCalcJobSchema = z.object({
  workspaceId: z.string(),
  runId: z.string(),
  period: z.string(),
  userId: z.string().optional(), // Who triggered it
});

export type CommissionCalcPayload = z.infer<typeof CommissionCalcJobSchema>;

export const ExchangeRateJobSchema = z.object({
  force: z.boolean().optional().default(false),
});

export type ExchangeRatePayload = z.infer<typeof ExchangeRateJobSchema>;
