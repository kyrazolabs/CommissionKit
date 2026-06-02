import { Router } from "express";
import { Types } from "mongoose";
import {
  Notification,
  UserNotificationPrefs,
  Workspace,
  NOTIFICATION_TYPES,
  type NotificationType,
} from "@workspace/db";
import { requireAuth, requireWorkspaceMember, requirePermission, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

// ─── In-app notifications ─────────────────────────────────────────────────────

/**
 * GET /notifications
 * Returns the current user's notifications for the active workspace.
 * Supports ?unreadOnly=true and ?limit=N
 */
router.get("/notifications", ...requirePermission("notifications", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const workspaceId = req.workspaceId!;
  const unreadOnly = req.query.unreadOnly === "true";
  const limit = Math.min(Number(req.query.limit ?? 50), 100);

  const query: any = {
    userId,
    workspaceId: new Types.ObjectId(workspaceId),
  };
  if (unreadOnly) query.read = false;

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(limit);

  const unreadCount = await Notification.countDocuments({
    userId,
    workspaceId: new Types.ObjectId(workspaceId),
    read: false,
  });

  res.json({
    notifications: notifications.map((n) => ({
      id: n._id,
      type: n.type,
      title: n.title,
      message: n.message,
      read: n.read,
      href: n.href,
      meta: n.meta,
      createdAt: n.createdAt.toISOString(),
    })),
    unreadCount,
  });
});

/**
 * PATCH /notifications/:id/read
 * Mark a single notification as read.
 */
router.patch("/notifications/:id/read", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const id = String(req.params.id);

  const n = await Notification.findOneAndUpdate(
    { _id: new Types.ObjectId(id), userId },
    { read: true },
    { new: true },
  );

  if (!n) { res.status(404).json({ error: "Notification not found" }); return; }
  res.json({ id: n._id, read: n.read });
});

/**
 * PATCH /notifications/read-all
 * Mark all of the user's notifications in this workspace as read.
 */
router.patch("/notifications/read-all", ...requirePermission("notifications", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  await Notification.updateMany(
    { userId: req.userId!, workspaceId: new Types.ObjectId(req.workspaceId!), read: false },
    { read: true },
  );
  res.json({ ok: true });
});

/**
 * DELETE /notifications/:id
 * Dismiss (delete) a single notification.
 */
router.delete("/notifications/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const id = String(req.params.id);
  await Notification.deleteOne({ _id: new Types.ObjectId(id), userId: req.userId! });
  res.status(204).send();
});

// ─── User notification preferences ───────────────────────────────────────────

/**
 * GET /users/me/notification-prefs
 * Returns the user's notification preference settings.
 */
router.get("/users/me/notification-prefs", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  let prefsDoc = await UserNotificationPrefs.findOne({ userId });

  if (!prefsDoc) {
    // Return defaults without persisting
    const defaults = Object.fromEntries(
      NOTIFICATION_TYPES.map((t) => [t, { email: true, inApp: true }]),
    );
    res.json({ prefs: defaults });
    return;
  }

  // Ensure all types are present (fill in any new types added since doc was created)
  const merged: Record<string, { email: boolean; inApp: boolean }> = {};
  for (const t of NOTIFICATION_TYPES) {
    merged[t] = prefsDoc.prefs?.[t] ?? { email: true, inApp: true };
  }

  res.json({ prefs: merged });
});

/**
 * PATCH /users/me/notification-prefs
 * Save user's notification preferences.
 * Body: { prefs: { [type]: { email: boolean; inApp: boolean } } }
 */
router.patch("/users/me/notification-prefs", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const { prefs } = req.body as { prefs?: Record<string, { email: boolean; inApp: boolean }> };

  if (!prefs || typeof prefs !== "object") {
    res.status(400).json({ error: "prefs object is required" }); return;
  }

  // Validate only known notification types are included
  const sanitized: Record<string, { email: boolean; inApp: boolean }> = {};
  for (const t of NOTIFICATION_TYPES) {
    if (prefs[t]) {
      sanitized[t] = {
        email: Boolean(prefs[t].email),
        inApp: Boolean(prefs[t].inApp),
      };
    }
  }

  const doc = await UserNotificationPrefs.findOneAndUpdate(
    { userId },
    { $set: { prefs: sanitized, userId } },
    { upsert: true, new: true },
  );

  res.json({ prefs: doc?.prefs ?? sanitized });
});

// ─── Workspace settings ───────────────────────────────────────────────────────

const VALID_CURRENCIES = [
  "AED","AFN","ALL","AMD","ANG","AOA","ARS","AUD","AWG","AZN",
  "BAM","BBD","BDT","BGN","BHD","BIF","BMD","BND","BOB","BRL",
  "BSD","BTC","BTN","BWP","BYN","BZD","CAD","CDF","CHF","CLF",
  "CLP","CNH","CNY","COP","CRC","CUC","CUP","CVE","CZK","DJF",
  "DKK","DOP","DZD","EGP","ERN","ETB","EUR","FJD","FKP","GBP",
  "GEL","GGP","GHS","GIP","GMD","GNF","GTQ","GYD","HKD","HNL",
  "HRK","HTG","HUF","IDR","ILS","IMP","INR","IQD","IRR","ISK",
  "JEP","JMD","JOD","JPY","KES","KGS","KHR","KMF","KPW","KRW",
  "KWD","KYD","KZT","LAK","LBP","LKR","LRD","LSL","LYD","MAD",
  "MDL","MGA","MKD","MMK","MNT","MOP","MRU","MUR","MVR","MWK",
  "MXN","MYR","MZN","NAD","NGN","NIO","NOK","NPR","NZD","OMR",
  "PAB","PEN","PGK","PHP","PKR","PLN","PYG","QAR","RON","RSD",
  "RUB","RWF","SAR","SBD","SCR","SDG","SEK","SGD","SHP","SLE",
  "SLL","SOS","SRD","SSP","STD","STN","SVC","SYP","SZL","THB",
  "TJS","TMT","TND","TOP","TRY","TTD","TWD","TZS","UAH","UGX",
  "USD","UYU","UZS","VES","VND","VUV","WST","XAF","XAG","XAU",
  "XCD","XCG","XDR","XOF","XPD","XPF","XPT","YER","ZAR","ZMW",
  "ZWG","ZWL",
];
const VALID_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * GET /workspaces/:id/settings
 * Returns the workspace's editable settings.
 */
router.get("/workspaces/:id/settings", ...requirePermission("workspace", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = String(req.params.id);
  const ws = await Workspace.findById(workspaceId);
  if (!ws) { res.status(404).json({ error: "Workspace not found" }); return; }

  res.json({
    currency: (ws as any).currency ?? "USD",
    fiscalYearStart: (ws as any).fiscalYearStart ?? "January",
  });
});

/**
 * PATCH /workspaces/:id/settings
 * Update currency and/or fiscalYearStart. Requires admin.
 */
router.patch("/workspaces/:id/settings", ...requirePermission("workspace", "edit"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = String(req.params.id);
  const { fiscalYearStart } = req.body as { fiscalYearStart?: string };

  const update: Record<string, string> = {};

  if (fiscalYearStart !== undefined) {
    if (!VALID_MONTHS.includes(fiscalYearStart)) {
      res.status(400).json({ error: "fiscalYearStart must be a full month name e.g. January" }); return;
    }
    update.fiscalYearStart = fiscalYearStart;
  }

  if (Object.keys(update).length === 0) {
    res.status(400).json({ error: "Nothing to update" }); return;
  }

  const ws = await Workspace.findByIdAndUpdate(workspaceId, { $set: update }, { new: true });
  if (!ws) { res.status(404).json({ error: "Workspace not found" }); return; }

  res.json({
    currency: (ws as any).currency ?? "USD",
    fiscalYearStart: (ws as any).fiscalYearStart ?? "January",
  });
});

export default router;
