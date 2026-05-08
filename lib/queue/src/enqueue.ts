import { MailJobSchema, type MailJob } from "./schemas.js";
import { PRIORITY_QUEUE_MAP } from "./queues.js";

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
    jobId: `${payload.to}:${Buffer.from(payload.subject).toString("base64url").slice(0, 16)}:${Math.floor(Date.now() / 300_000)}`,
  });

  console.info(
    `[Queue] Enqueued ${priority} email → ${payload.to} "${payload.subject}"`,
  );
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
