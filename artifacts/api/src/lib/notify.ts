import {
  NOTIFICATION_TYPES,
  Notification,
  type NotificationType,
  UserNotificationPrefs,
} from "@workspace/db";
import { sendMediumPriorityEmail } from "@workspace/queue";
import { Types } from "mongoose";

export interface CreateNotificationInput {
  workspaceId: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  href?: string;
  meta?: Record<string, unknown>;
  /** Email body HTML — if provided and user has email pref enabled, sends email */
  emailHtml?: string;
  /** Email subject override (defaults to title) */
  emailSubject?: string;
  /** Recipient email address */
  emailTo?: string;
}

/**
 * Creates an in-app notification and optionally sends an email,
 * both gated by the user's notification preference for this type.
 */
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const {
    workspaceId,
    userId,
    type,
    title,
    message,
    href,
    meta,
    emailHtml,
    emailSubject,
    emailTo,
  } = input;

  // Load user prefs (fall back to defaults if no record exists)
  const prefsDoc = await UserNotificationPrefs.findOne({ userId });
  const prefs = prefsDoc?.prefs ?? {};
  const typePref = prefs[type] ?? { email: true, inApp: true };

  // Create in-app notification
  if (typePref.inApp !== false) {
    await Notification.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId,
      type,
      title,
      message,
      href,
      meta,
    });
  }

  // Send email if configured
  if (typePref.email !== false && emailHtml && emailTo) {
    try {
      await sendMediumPriorityEmail({
        to: emailTo,
        subject: emailSubject ?? title,
        html: emailHtml,
        meta: { notificationType: type, workspaceId, userId },
      });
    } catch (err) {
      console.error(`[Notify] Failed to enqueue email for ${type}:`, err);
    }
  }
}
