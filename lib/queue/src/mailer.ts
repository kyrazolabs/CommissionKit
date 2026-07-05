import nodemailer, { type Transporter, type SentMessageInfo } from "nodemailer";
import type { MailSendPayload } from "./schemas.js";

let _transporter: Transporter | null = null;

/**
 * Lazily creates and caches a single nodemailer SMTP transporter.
 * Environment variables:
 *   SMTP_HOST   — e.g. "smtp.postmarkapp.com"
 *   SMTP_PORT   — e.g. 587 (default) or 465
 *   SMTP_SECURE — "true" for port 465 (TLS), false uses STARTTLS
 *   SMTP_USER   — SMTP auth username
 *   SMTP_PASS   — SMTP auth password
 *   MAIL_FROM   — sender address, e.g. "CommissionKit <noreply@commissionkit.io>"
 */
export function getTransporter(): Transporter {
  if (_transporter) return _transporter;

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT ?? "587", 10);
  const secure = process.env.SMTP_SECURE === "true";
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP config. Ensure SMTP_HOST, SMTP_USER, and SMTP_PASS are set.",
    );
  }

  _transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
    pool: true,         // reuse connections (better throughput)
    maxConnections: 5,
  });

  return _transporter;
}

/** Default from address read from env */
export function getMailFrom(): string {
  return process.env.MAIL_FROM ?? "CommissionKit <noreply@commissionkit.io>";
}

/**
 * Send a single email directly (bypasses the queue).
 * Used inside the BullMQ worker — do not call from request handlers.
 */
export async function sendMail(payload: MailSendPayload): Promise<SentMessageInfo> {
  const transporter = getTransporter();

  // Auto-generate plain-text if not provided
  const text =
    payload.text ??
    payload.html
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

  return transporter.sendMail({
    from: getMailFrom(),
    to: payload.toName
      ? `"${payload.toName}" <${payload.to}>`
      : payload.to,
    bcc: payload.bcc,
    replyTo: payload.replyTo,
    subject: payload.subject,
    html: payload.html,
    text,
  });
}

/** Verify SMTP connectivity (use on startup). Throws on failure. */
export async function verifySmtp(): Promise<void> {
  await getTransporter().verify();
  console.info("[Mailer] SMTP connection verified ✓");
}
