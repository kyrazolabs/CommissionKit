/**
 * Centralised BullMQ queue name constants.
 * Curly-braced names ensure Redis Cluster routes all related keys to the
 * same hash slot (required for MULTI/EXEC atomicity inside BullMQ).
 */

// ─── Email queues ─────────────────────────────────────────────────────────────
/** Critical path: team invitations, password resets, magic links */
export const MAIL_HIGH_QUEUE = "{ck-mail-high}";

/** Standard: commission run reports, workspace notifications */
export const MAIL_MEDIUM_QUEUE = "{ck-mail-medium}";

/** Bulk / marketing: digest summaries, weekly reports */
export const MAIL_LOW_QUEUE = "{ck-mail-low}";

/** Internal execution queue — workers pull from here to call SMTP */
export const MAIL_SEND_QUEUE = "{ck-mail-send}";

// ─── Future queues (stubs) ────────────────────────────────────────────────────
export const COMMISSION_CALC_QUEUE = "{ck-commission-calc}";
export const EXCHANGE_RATE_QUEUE = "{ck-exchange-rate}";
export const WEBHOOK_QUEUE = "{ck-webhook}";
export const LOGS_FLUSH_QUEUE = "{ck-logs-flush}";

// ─── Sync queues (plugin integration) ─────────────────────────────────────────
export const SYNC_REPS_QUEUE = "{ck-sync-reps}";
export const SYNC_DEALS_QUEUE = "{ck-sync-deals}";
export const WEBHOOK_INGRESS_QUEUE = "{ck-webhook-ingress}";
export const SYNC_EGRESS_QUEUE = "{ck-sync-egress}";

// ─── Audit log queue ─────────────────────────────────────────────────────────
export const AUDIT_LOG_QUEUE = "{ck-audit-log}";

