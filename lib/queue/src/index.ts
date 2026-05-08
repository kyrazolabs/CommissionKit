// Connection
export { getRedisClient, closeRedis } from "./connection.js";

// Constants
export * from "./constants.js";

// Schemas & types
export { MailJobSchema } from "./schemas.js";
export type { MailJob, MailSendPayload } from "./schemas.js";

// Queue instances
export {
  mailHighQueue,
  mailMediumQueue,
  mailLowQueue,
  mailSendQueue,
  PRIORITY_QUEUE_MAP,
} from "./queues.js";

// Mailer (SMTP)
export { sendMail, verifySmtp, getMailFrom } from "./mailer.js";

// Workers
export {
  highWorker,
  mediumWorker,
  lowWorker,
  smtpWorker,
  closeWorkers,
} from "./worker.js";

// Enqueue helpers
export {
  enqueueEmail,
  sendHighPriorityEmail,
  sendMediumPriorityEmail,
  sendLowPriorityEmail,
} from "./enqueue.js";
