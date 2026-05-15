import { Router } from "express";
import { Types } from "mongoose";
import {
  Dispute, Payout, Rep, WorkspaceSubscription, Notification, WorkspaceMember,
  createDisputeSchema, updateDisputeSchema,
} from "@workspace/db";
import { requirePermission, type AuthenticatedRequest } from "../middleware/auth";
import { logger } from "../lib/logger";
import { createNotification } from "../lib/notify";
import { disputeUpdateTemplate } from "@workspace/email-templates";
import { Workspace } from "@workspace/db";
import { format } from "date-fns";
import { getUsersWithPermission } from "../lib/rbac";

const router = Router();

type PlanName = "free" | "lite" | "starter" | "growth" | "annual" | "flex";
const GROWTH_PLANS = new Set<PlanName>(["growth", "annual", "flex"]);

async function getPlan(workspaceId: string): Promise<PlanName> {
  const sub = await WorkspaceSubscription.findOne({ workspaceId: new Types.ObjectId(workspaceId) });
  return (sub?.plan ?? "free") as PlanName;
}

function formatDispute(dispute: any) {
  return {
    id: dispute._id.toString(),
    payoutId: (dispute.payoutId?._id ?? dispute.payoutId).toString(),
    repId: (dispute.repId?._id ?? dispute.repId).toString(),
    repName: dispute.repId?.name ?? "Unknown",
    reason: dispute.reason,
    status: dispute.status,
    adminNotes: dispute.adminNotes ?? null,
    resolvedAt: dispute.resolvedAt?.toISOString() ?? null,
    createdAt: dispute.createdAt.toISOString(),
    updatedAt: dispute.updatedAt.toISOString(),
    payout: dispute.payoutId && typeof dispute.payoutId === "object" ? {
      id: dispute.payoutId._id?.toString(),
      finalAmount: dispute.payoutId.finalAmount,
      currency: dispute.payoutId.currency,
      periodStart: dispute.payoutId.periodStart?.toISOString(),
      periodEnd: dispute.payoutId.periodEnd?.toISOString(),
      status: dispute.payoutId.status,
    } : null,
  };
}

async function sendDisputeNotification(
  workspaceId: string,
  rep: any,
  dispute: any,
  status: string,
  adminNotes: string,
) {
  try {
    const ws = await Workspace.findById(workspaceId);
    const wsName = ws?.name ?? "CommissionKit";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const portalUrl = `${frontendUrl}/portal/${rep.accessCode}`;
    const payout = dispute.payoutId as any;
    const period = payout 
      ? `${format(payout.periodStart, "MMM d")}–${format(payout.periodEnd, "MMM d, yyyy")}`
      : "Unknown Period";

    const emailHtml = disputeUpdateTemplate({
      repName: rep.name,
      workspaceName: wsName,
      payoutPeriod: period,
      status,
      adminNotes,
      portalUrl,
    });

    await createNotification({
      workspaceId,
      userId: rep.userId,
      type: status === "resolved" ? "dispute_resolved" : "dispute_updated",
      title: status === "resolved" ? "Dispute Resolved" : "Dispute Under Review",
      message: `Your dispute for ${period} has been updated to ${status.replace("_", " ")}.`,
      href: "/my-payouts",
      emailHtml,
      emailTo: rep.email,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to send dispute notification email");
  }
}

async function sendInAppNotification(workspaceId: string, userId: string, type: string, title: string, message: string, href?: string) {
  try {
    await Notification.create({ workspaceId: new Types.ObjectId(workspaceId), userId, type, title, message, href, read: false });
  } catch (err) {
    logger.warn({ err }, "Failed to create in-app notification");
  }
}

// ─── POST / — rep submits a dispute ──────────────────────────────────────────
router.post("/", ...requirePermission("disputes", "create"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  if (!GROWTH_PLANS.has(await getPlan(workspaceId))) {
    res.status(403).json({ error: "Disputes require a Growth plan or higher.", upgradeRequired: true }); return;
  }

  const body = createDisputeSchema.parse(req.body);
  const rep = await Rep.findOne({ workspaceId: new Types.ObjectId(workspaceId), email: req.userEmail });
  if (!rep) { res.status(403).json({ error: "No rep record found for your account." }); return; }

  const payout = await Payout.findOne({ _id: new Types.ObjectId(body.payoutId), workspaceId: new Types.ObjectId(workspaceId), repId: rep._id });
  if (!payout) { res.status(404).json({ error: "Payout not found or not accessible." }); return; }
  if (!["pending", "approved"].includes(payout.status)) {
    res.status(400).json({ error: `Only pending or approved payouts can be disputed. Status: ${payout.status}` }); return;
  }

  const existing = await Dispute.findOne({ payoutId: payout._id });
  if (existing) { res.status(409).json({ error: "A dispute already exists for this payout." }); return; }

  const dispute = await Dispute.create({
    workspaceId: new Types.ObjectId(workspaceId),
    payoutId: payout._id,
    repId: rep._id,
    reason: body.reason,
    status: "open",
  });

  await Payout.findByIdAndUpdate(payout._id, {
    status: "disputed",
    $push: { statusHistory: { status: "disputed", changedAt: new Date(), changedBy: req.userId, note: `Dispute: ${body.reason.slice(0, 80)}` } },
  });

  const notifyUserIds = await getUsersWithPermission(workspaceId, "disputes", "edit");
  for (const userId of notifyUserIds) {
    await sendInAppNotification(workspaceId, userId, "dispute_submitted", "Payout Dispute Submitted",
      `${rep.name} has disputed their payout. Reason: ${body.reason.slice(0, 80)}`, "/disputes");
  }

  res.status(201).json(formatDispute(dispute));
});

// ─── GET / — list disputes ────────────────────────────────────────────────────
router.get("/", ...requirePermission("disputes", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const hasFullAccess = req.permissions?.has("disputes:edit") || req.permissions?.has("disputes:*") || req.permissions?.has("*");
  const query: any = { workspaceId: new Types.ObjectId(workspaceId) };

  if (!hasFullAccess) {
    const rep = await Rep.findOne({ workspaceId: new Types.ObjectId(workspaceId), email: req.userEmail });
    if (!rep) { res.json([]); return; }
    query.repId = rep._id;
  }
  if (req.query.status) query.status = req.query.status;

  const disputes = await Dispute.find(query).populate("repId").populate("payoutId").sort({ createdAt: -1 });
  res.json(disputes.map(formatDispute));
});

// ─── PATCH /:id — admin updates dispute ──────────────────────────────────────
router.patch("/:id", ...requirePermission("disputes", "edit"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const body = updateDisputeSchema.parse(req.body);

  const dispute = await Dispute.findOne({ _id: new Types.ObjectId(req.params.id), workspaceId: new Types.ObjectId(workspaceId) })
    .populate("repId").populate("payoutId");
  if (!dispute) { res.status(404).json({ error: "Dispute not found" }); return; }

  const update: any = {};
  if (body.status) update.status = body.status;
  if (body.adminNotes) update.adminNotes = body.adminNotes;
  if (body.status === "resolved") update.resolvedAt = new Date();

  const updated = await Dispute.findByIdAndUpdate(dispute._id, { $set: update }, { new: true })
    .populate("repId").populate("payoutId");

    if (body.status === "resolved") {
      const payout = dispute.payoutId as any;
      if (payout) {
        await Payout.findByIdAndUpdate(payout._id, {
          status: "approved",
          $push: { statusHistory: { status: "approved", changedAt: new Date(), changedBy: req.userId, note: `Dispute resolved. ${body.adminNotes ?? ""}` } },
        });
      }
    }

    const rep = dispute.repId as any;
    if (rep?.userId && body.status) {
      await sendDisputeNotification(workspaceId, rep, updated, body.status, body.adminNotes ?? "");
    }

  res.json(formatDispute(updated!));
});

export default router;
