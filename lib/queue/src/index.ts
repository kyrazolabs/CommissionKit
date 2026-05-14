// Connection
export { getRedisClient, closeRedis } from "./connection.js";

// Constants
export * from "./constants.js";

// Schemas & types
export { MailJobSchema, CommissionCalcJobSchema } from "./schemas.js";
export type { MailJob, MailSendPayload, CommissionCalcPayload } from "./schemas.js";

// Queue instances
export {
  mailHighQueue,
  mailMediumQueue,
  mailLowQueue,
  mailSendQueue,
  commissionCalcQueue,
  PRIORITY_QUEUE_MAP,
} from "./queues.js";

// Mailer (SMTP)
export { sendMail, verifySmtp, getMailFrom } from "./mailer.js";

// Enqueue helpers
export {
  enqueueEmail,
  sendHighPriorityEmail,
  sendMediumPriorityEmail,
  sendLowPriorityEmail,
  enqueueCommissionCalc,
  enqueueExchangeRateSync,
} from "./enqueue.js";

// Services
export { fetchAndSaveRates } from "./exchangeRateService.js";
