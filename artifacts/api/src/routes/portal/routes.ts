import { Router } from "express";
import { Types } from "mongoose";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { hashPassword, verifyPassword } from "better-auth/crypto";
import {
  Rep,
  Plan,
  CommissionRun,
  CommissionResult,
  Workspace,
  Payout,
  Dispute,
  WorkspaceMember,
  WorkspaceSubscription,
  Notification,
} from "@workspace/db";
import { GetPortalByCodeParams, GetPortalByCodeQueryParams } from "@workspace/api-zod";
import { logger } from "../../lib/logger";
import { getUsersWithPermission } from "../../lib/rbac";

const router = Router();

// ─── JWT Config ───────────────────────────────────────────────────────────────

const PORTAL_JWT_SECRET = process.env.PORTAL_JWT_SECRET || process.env.BETTER_AUTH_SECRET || "portal-fallback-secret-change-in-prod";
const PORTAL_TOKEN_TTL = "24h";

interface PortalTokenPayload {
  repId: string;
  accessCode: string;
  mustChangePassword: boolean;
  commissionEngine?: string;
}

function signPortalToken(payload: PortalTokenPayload): string {
  return jwt.sign(payload, PORTAL_JWT_SECRET, { expiresIn: PORTAL_TOKEN_TTL });
}

function verifyPortalToken(token: string): PortalTokenPayload | null {
  try {
    return jwt.verify(token, PORTAL_JWT_SECRET) as PortalTokenPayload;
  } catch {
    return null;
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * Extracts and verifies the portal JWT from the Authorization header.
 * This is completely isolated from Better Auth sessions — no cookies involved.
 * Dashboard admin sessions are NEVER checked here, preventing any cross-contamination.
 */
function verifyPortalAuth(
  req: any,
  rep: any,
): { authorized: boolean; mustChangePassword?: boolean; passwordRequired?: boolean } {
  const authHeader = req.headers["authorization"] as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) {
    return { authorized: false, passwordRequired: true };
  }

  const token = authHeader.slice(7);
  const payload = verifyPortalToken(token);

  if (!payload) {
    return { authorized: false, passwordRequired: true };
  }

  // Ensure this token was issued for THIS specific rep portal
  if (payload.accessCode !== rep.portalAccessCode) {
    return { authorized: false, passwordRequired: true };
  }

  return { authorized: true, mustChangePassword: payload.mustChangePassword };
}

async function getPlan(workspaceId: string): Promise<string> {
  const sub = await WorkspaceSubscription.findOne({ workspaceId: new Types.ObjectId(workspaceId) });
  const isActive = sub?.isLifetime || (sub?.status && ["active", "trialing", "past_due", "paused"].includes(sub.status));
  return (isActive ? (sub?.plan ?? "free") : "free") as string;
}

const GROWTH_PLANS = new Set(["growth", "annual", "flex", "pro"]);

async function sendNotification(workspaceId: string, userId: string, type: string, title: string, message: string, href?: string) {
  try {
    await Notification.create({
      workspaceId: new Types.ObjectId(workspaceId),
      userId,
      type,
      title,
      message,
      href,
      read: false,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to create portal dispute notification");
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

/**
 * POST /portal/:accessCode/login
 *
 * Verifies the rep's credentials against the hashed password stored in Better Auth.
 * On success, returns a signed portal JWT in the response body.
 *
 * NOTE: This does NOT create a Better Auth session. The JWT is stored by the
 * frontend in localStorage and passed as a Bearer token on every subsequent
 * request. This completely isolates portal auth from the dashboard auth.
 */
router.post("/portal/:accessCode/login", async (req, res): Promise<void> => {
  const { accessCode } = req.params;
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ error: "username and password are required." });
    return;
  }

  const rep = await Rep.findOne({ portalAccessCode: accessCode });
  if (!rep) {
    res.status(404).json({ error: "Invalid access code. Portal not found." });
    return;
  }

  // Build the portal's virtual email from the username or accessCode
  const expectedEmailPrefix = rep.portalUsername || rep.portalAccessCode;
  const expectedEmail = `${expectedEmailPrefix}@portal.commissionkit.io`;
  const providedEmail = `${username.trim().toLowerCase()}@portal.commissionkit.io`;

  if (providedEmail !== expectedEmail) {
    res.status(401).json({ error: "Invalid username or password." });
    return;
  }

  // Verify the password against Better Auth's stored hash by attempting a sign-in
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("DB not connected");

    // Find the user in Better Auth's user collection
    const authUser = await db.collection("user").findOne({ email: expectedEmail });
    if (!authUser) {
      logger.warn({ accessCode, email: expectedEmail }, "Portal login: no auth user found");
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    // Find the credential (account) record which holds the hashed password
    const accountRecord = await db.collection("account").findOne({
      userId: { $in: [authUser._id, authUser._id.toString()] },
      providerId: "credential",
    });

    if (!accountRecord?.password) {
      logger.warn({ accessCode }, "Portal login: no credential account found");
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    // Use Better Auth's verifyPassword to compare against the stored hash
    const isValid = await verifyPassword({ password, hash: accountRecord.password });

    if (!isValid) {
      res.status(401).json({ error: "Invalid username or password." });
      return;
    }

    const mustChangePassword = Boolean(authUser.mustChangePassword);

    // Get workspace engine type
    const workspace = await Workspace.findById(rep.workspaceId);
    const commissionEngine = (workspace as any)?.commissionEngine || "standard";

    // Sign a portal-scoped JWT
    const token = signPortalToken({
      repId: rep._id.toString(),
      accessCode: rep.portalAccessCode!,
      mustChangePassword,
      commissionEngine,
    });

    logger.info({ repId: rep._id, accessCode }, "Portal login successful");
    res.json({ token, mustChangePassword, repName: rep.name, workspaceName: workspace?.name || "Workspace" });
  } catch (err: any) {
    logger.error({ err: err.message, accessCode }, "Portal login error");
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

/**
 * POST /portal/:accessCode/change-password
 *
 * Allows a rep to change their portal password using the current password for verification.
 * Returns a new token with mustChangePassword: false on success.
 * Does NOT touch dashboard auth sessions.
 */
router.post("/portal/:accessCode/change-password", async (req, res): Promise<void> => {
  const { accessCode } = req.params;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "currentPassword and newPassword are required." });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters." });
    return;
  }

  // Verify the portal token first
  const authHeader = req.headers["authorization"] as string | undefined;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyPortalToken(token);
  if (!payload || payload.accessCode !== accessCode) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const rep = await Rep.findOne({ portalAccessCode: accessCode });
  if (!rep) {
    res.status(404).json({ error: "Portal not found." });
    return;
  }

  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("DB not connected");

    const expectedEmailPrefix = rep.portalUsername || rep.portalAccessCode;
    const portalEmail = `${expectedEmailPrefix}@portal.commissionkit.io`;

    const authUser = await db.collection("user").findOne({ email: portalEmail });
    if (!authUser) {
      res.status(404).json({ error: "Auth record not found." });
      return;
    }

    const accountRecord = await db.collection("account").findOne({
      userId: { $in: [authUser._id, authUser._id.toString()] },
      providerId: "credential",
    });

    if (!accountRecord?.password) {
      res.status(400).json({ error: "No credential found." });
      return;
    }

    // Verify current password
    const isValid = await verifyPassword({ password: currentPassword, hash: accountRecord.password });

    if (!isValid) {
      res.status(401).json({ error: "Current password is incorrect." });
      return;
    }

    // Hash and update the new password
    const newHash = await hashPassword(newPassword);
    await db.collection("account").updateOne(
      { _id: accountRecord._id },
      { $set: { password: newHash, updatedAt: new Date() } }
    );

    // Clear the mustChangePassword flag on the user record
    await db.collection("user").updateOne(
      { _id: authUser._id },
      { $set: { mustChangePassword: false, updatedAt: new Date() } }
    );

    // Return a fresh token with mustChangePassword: false
    const newToken = signPortalToken({
      repId: rep._id.toString(),
      accessCode: rep.portalAccessCode!,
      mustChangePassword: false,
    });

    logger.info({ repId: rep._id }, "Portal password changed successfully");
    res.json({ token: newToken, success: true });
  } catch (err: any) {
    logger.error({ err: err.message, accessCode }, "Portal change-password error");
    res.status(500).json({ error: "Failed to update password. Please try again." });
  }
});

/**
 * GET /portal/:accessCode
 * Returns commission summary data for the authenticated rep.
 */
router.get("/portal/:accessCode", async (req, res): Promise<void> => {
  const { accessCode } = GetPortalByCodeParams.parse(req.params);
  const { period: rawPeriod } = GetPortalByCodeQueryParams.parse(req.query);
  const period = rawPeriod || currentPeriod();

  const rep = await Rep.findOne({ portalAccessCode: accessCode });
  if (!rep) {
    res.status(404).json({ error: "Invalid access code. Portal not found." });
    return;
  }

  const portalAuth = verifyPortalAuth(req, rep);
  if (!portalAuth.authorized) {
    res.status(401).json({ error: "Unauthorized", passwordRequired: true });
    return;
  }

  if (portalAuth.mustChangePassword) {
    res.status(403).json({ error: "Password change required", mustChangePassword: true });
    return;
  }

  const workspaceId = rep.workspaceId;
  const workspace = await Workspace.findById(workspaceId);
  const currency = (workspace as any)?.currency || "USD";

  let planName: string | null = null;
  if (rep.planId) {
    const plan = await Plan.findOne({ _id: rep.planId, workspaceId });
    planName = plan?.name ?? null;
  }

  const latestRun = await CommissionRun.findOne({ workspaceId, period }).sort({
    createdAt: -1,
  });

  let totalCommission = 0;
  let totalRevenue = 0;
  let totalDeals = 0;
  const dealBreakdown: any[] = [];
  const currencySummariesMap = new Map<string, any>();

  if (latestRun) {
    const results = await CommissionResult.find({
      runId: latestRun._id,
      repId: rep._id,
    }).populate("dealId");

    for (const r of results) {
      const commission = Number(r.commissionAmount);
      const deal = r.dealId as any;
      const dealAmt = deal && deal.amount ? Number(deal.amount) : 0;

      totalCommission += commission;
      totalRevenue += dealAmt;
      totalDeals++;

      dealBreakdown.push({
        dealId: deal?._id?.toString() || "unknown",
        dealName: deal?.name || "Unknown",
        dealAmount: dealAmt,
        closeDate: deal?.closeDate || "",
        rateApplied: Number(r.rateApplied),
        commissionAmount: commission,
        currency: (r as any).currency || deal?.currency || "USD",
        calculationNote: r.calculationNote,
        wsCurrency: (r as any).wsCurrency,
        convertedDealAmount: (r as any).convertedDealAmount,
        convertedCommission: (r as any).convertedCommission,
        exchangeRateSnapshot: (r as any).exchangeRateSnapshot,
        rateSnapshotDate: (r as any).rateSnapshotDate,
      });

      const resCurrency = (r as any).currency || deal?.currency || "USD";
      if (!currencySummariesMap.has(resCurrency)) {
        currencySummariesMap.set(resCurrency, {
          currency: resCurrency,
          totalCommission: 0,
          totalRevenue: 0,
          totalDeals: 0,
        });
      }
      const cSummary = currencySummariesMap.get(resCurrency)!;
      cSummary.totalCommission += commission;
      cSummary.totalRevenue += dealAmt;
      cSummary.totalDeals++;
    }
  }

  const allRuns = await CommissionRun.find({ workspaceId }).sort({ createdAt: -1 }).limit(6);
  const monthlyHistory = await Promise.all(
    allRuns.map(async (run) => {
      const repRunResults = await CommissionResult.find({ runId: run._id, repId: rep._id });
      const commission = repRunResults.reduce((sum, r) => sum + Number(r.commissionAmount), 0);
      return { period: run.period, totalCommission: commission, totalDeals: repRunResults.length };
    })
  );

  res.json({
    repId: rep._id,
    repName: rep.name,
    email: rep.email,
    workspaceName: workspace?.name || null,
    planName,
    period,
    totalCommission,
    totalRevenue,
    totalDeals,
    dealBreakdown,
    monthlyHistory,
    currencySummaries: Array.from(currencySummariesMap.values()),
    currency,
  });
});

/**
 * GET /portal/:accessCode/payouts
 */
router.get("/portal/:accessCode/payouts", async (req, res): Promise<void> => {
  const { accessCode } = req.params;
  const rep = await Rep.findOne({ portalAccessCode: accessCode });
  if (!rep) { res.status(404).json({ error: "Invalid access code." }); return; }

  const portalAuth = verifyPortalAuth(req, rep);
  if (!portalAuth.authorized) {
    res.status(401).json({ error: "Unauthorized", passwordRequired: true });
    return;
  }

  const payouts = await Payout.find({ repId: rep._id, workspaceId: rep.workspaceId })
    .sort({ periodStart: -1 })
    .lean();

  res.json(payouts.map((p: any) => ({
    id: p._id.toString(),
    periodStart: p.periodStart.toISOString(),
    periodEnd: p.periodEnd.toISOString(),
    commissionAmount: p.commissionAmount,
    adjustments: p.adjustments,
    finalAmount: p.finalAmount,
    currency: p.currency ?? "USD",
    status: p.status,
    scheduledPaymentDate: p.scheduledPaymentDate?.toISOString() ?? null,
    actualPaymentDate: p.actualPaymentDate?.toISOString() ?? null,
    notes: p.notes ?? null,
    createdAt: p.createdAt.toISOString(),
  })));
});

/**
 * POST /portal/:accessCode/disputes
 * Rep submits a dispute from the public portal.
 */
router.post("/portal/:accessCode/disputes", async (req, res): Promise<void> => {
  const { accessCode } = req.params;
  const { payoutId, reason } = req.body;

  const rep = await Rep.findOne({ portalAccessCode: accessCode });
  if (!rep) { res.status(404).json({ error: "Invalid access code." }); return; }

  const portalAuth = verifyPortalAuth(req, rep);
  if (!portalAuth.authorized) {
    res.status(401).json({ error: "Unauthorized", passwordRequired: true });
    return;
  }

  const workspaceId = rep.workspaceId;
  const plan = await getPlan(workspaceId.toString());
  if (!GROWTH_PLANS.has(plan)) {
    res.status(403).json({ error: "Disputes require a Growth plan or higher.", upgradeRequired: true });
    return;
  }

  if (!payoutId || !reason) {
    res.status(400).json({ error: "payoutId and reason are required." }); return;
  }

  const payout = await Payout.findOne({ _id: new Types.ObjectId(payoutId), workspaceId, repId: rep._id });
  if (!payout) { res.status(404).json({ error: "Payout not found or not accessible." }); return; }

  if (!["pending", "approved"].includes(payout.status)) {
    res.status(400).json({ error: `Only pending or approved payouts can be disputed. Status: ${payout.status}` }); return;
  }

  const existing = await Dispute.findOne({ payoutId: payout._id });
  if (existing) { res.status(409).json({ error: "A dispute already exists for this payout." }); return; }

  const dispute = await Dispute.create({
    workspaceId,
    payoutId: payout._id,
    repId: rep._id,
    reason,
    status: "open",
  });

  await Payout.findByIdAndUpdate(payout._id, {
    status: "disputed",
    $push: { statusHistory: { status: "disputed", changedAt: new Date(), note: `Dispute from portal: ${reason.slice(0, 80)}` } },
  });

  const notifyUserIds = await getUsersWithPermission(workspaceId.toString(), "disputes", "edit");
  for (const userId of notifyUserIds) {
    await sendNotification(
      workspaceId.toString(),
      userId,
      "dispute_submitted",
      "Payout Dispute Submitted (Portal)",
      `${rep.name} has disputed their payout from the public portal. Reason: ${reason.slice(0, 80)}`,
      "/disputes"
    );
  }

  res.status(201).json({ id: dispute._id, status: dispute.status });
});

export default router;
