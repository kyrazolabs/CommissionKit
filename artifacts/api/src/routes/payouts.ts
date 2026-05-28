import { Router } from "express";
import { Types } from "mongoose";
import {
  Payout,
  Rep,
  Workspace,
  WorkspaceSubscription,
  Notification,
  createPayoutSchema,
} from "@workspace/db";
import {
  requirePermission,
  type AuthenticatedRequest,
} from "../middleware/auth";
import { logger } from "../lib/logger";
import { createNotification } from "../lib/notify";
import { payoutUpdateTemplate } from "@workspace/email-templates";
import { format } from "date-fns";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

type PlanName = "free" | "lite" | "starter" | "growth" | "annual" | "flex" | "pro";
const GROWTH_PLANS = new Set<PlanName>(["growth", "annual", "flex", "pro"]);

async function getPlan(workspaceId: string): Promise<PlanName> {
  const sub = await WorkspaceSubscription.findOne({
    workspaceId: new Types.ObjectId(workspaceId),
  });
  const isActive = sub?.isLifetime || (sub?.status && ["active", "trialing", "past_due", "paused"].includes(sub.status));
  return (isActive ? (sub?.plan ?? "free") : "free") as PlanName;
}

async function requireGrowthPlan(workspaceId: string, res: any): Promise<boolean> {
  const plan = await getPlan(workspaceId);
  if (!GROWTH_PLANS.has(plan)) {
    res.status(403).json({ error: "This feature requires a Growth plan or higher.", upgradeRequired: true });
    return false;
  }
  return true;
}

function formatPayout(payout: any) {
  return {
    id: payout._id.toString(),
    repId: (payout.repId?._id ?? payout.repId).toString(),
    repName: payout.repId?.name ?? "Unknown",
    periodStart: payout.periodStart.toISOString(),
    periodEnd: payout.periodEnd.toISOString(),
    commissionAmount: payout.commissionAmount,
    adjustments: payout.adjustments,
    finalAmount: payout.finalAmount,
    currency: payout.currency ?? "USD",
    status: payout.status,
    paymentMethod: payout.paymentMethod ?? null,
    scheduledPaymentDate: payout.scheduledPaymentDate?.toISOString() ?? null,
    actualPaymentDate: payout.actualPaymentDate?.toISOString() ?? null,
    notes: payout.notes ?? null,
    statusHistory: payout.statusHistory ?? [],
    createdAt: payout.createdAt.toISOString(),
    updatedAt: payout.updatedAt.toISOString(),
  };
}

async function sendPayoutNotification(
  workspaceId: string,
  rep: any,
  payout: any,
  status: string,
  notes?: string,
) {
  try {
    const ws = await Workspace.findById(workspaceId);
    const wsName = ws?.name ?? "CommissionKit";
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const portalUrl = `${frontendUrl}/portal/${rep.accessCode}`;
    const period = `${format(payout.periodStart, "MMM d")}–${format(payout.periodEnd, "MMM d, yyyy")}`;

    const title = status === "approved" ? "Payout Approved" : "Commission Paid";
    const message = status === "approved" 
      ? `Your payout of ${payout.finalAmount.toFixed(2)} ${payout.currency} has been approved.`
      : `Your commission of ${payout.finalAmount.toFixed(2)} ${payout.currency} was paid.`;

    const emailHtml = payoutUpdateTemplate({
      repName: rep.name,
      workspaceName: wsName,
      status,
      amount: payout.finalAmount.toFixed(2),
      currency: payout.currency,
      period,
      portalUrl,
      notes,
    });

    await createNotification({
      workspaceId,
      userId: rep.userId,
      type: status === "approved" ? "payout_approved" : "payout_paid",
      title,
      message,
      href: "/my-payouts",
      emailHtml,
      emailTo: rep.email,
    });
  } catch (err) {
    logger.warn({ err }, "Failed to send payout notification email");
  }
}

// ─── NOTE: Static paths (/export, /bulk-approve) MUST come before /:id ────────

// ─── GET / — list payouts (admin = all, member = own) ────────────────────────
router.get(
  "/",
  ...requirePermission("payouts", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const hasEditPermission = req.permissions?.has("payouts:edit") || req.permissions?.has("payouts:*") || req.permissions?.has("*");
    const query: any = { workspaceId: new Types.ObjectId(workspaceId) };

    if (!hasEditPermission) {
      const rep = await Rep.findOne({ workspaceId: new Types.ObjectId(workspaceId), email: req.userEmail });
      if (!rep) { res.json([]); return; }
      query.repId = rep._id;
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.repId && hasEditPermission) query.repId = new Types.ObjectId(String(req.query.repId));
    if (req.query.periodStart) query.periodStart = { $gte: new Date(String(req.query.periodStart)) };
    if (req.query.periodEnd) query.periodEnd = { $lte: new Date(String(req.query.periodEnd)) };

    const payouts = await Payout.find(query).populate("repId").sort({ periodStart: -1 });
    res.json(payouts.map(formatPayout));
  },
);

// ─── GET /export — CSV export (admin, Growth+) ────────────────────────────────
router.get(
  "/export",
  ...requirePermission("payouts", "export_csv"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    if (!(await requireGrowthPlan(workspaceId, res))) return;

    const query: any = { workspaceId: new Types.ObjectId(workspaceId) };
    if (req.query.status) query.status = req.query.status;
    if (req.query.repId) query.repId = new Types.ObjectId(String(req.query.repId));

    const payouts = await Payout.find(query).populate("repId").sort({ periodStart: -1 });

    const rows = [
      ["Rep Name","Period Start","Period End","Commission","Adjustments","Final Amount","Currency","Status","Payment Date"].join(","),
      ...payouts.map((p) => {
        const repName = (p.repId as any)?.name ?? "Unknown";
        return [
          `"${repName}"`,
          p.periodStart.toISOString().slice(0, 10),
          p.periodEnd.toISOString().slice(0, 10),
          p.commissionAmount.toFixed(2),
          p.adjustments.toFixed(2),
          p.finalAmount.toFixed(2),
          p.currency,
          p.status,
          p.actualPaymentDate?.toISOString().slice(0, 10) ?? "",
        ].join(",");
      }),
    ];

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=\"payouts.csv\"");
    res.send(rows.join("\n"));
  },
);

// ─── POST /bulk-approve — bulk approve (admin, Growth+) ───────────────────────
router.post(
  "/bulk-approve",
  ...requirePermission("payouts", "approve"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    if (!(await requireGrowthPlan(workspaceId, res))) return;

    const { ids } = req.body as { ids?: string[] };
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: "ids array is required" }); return;
    }

    const result = await Payout.updateMany(
      { _id: { $in: ids.map(id => new Types.ObjectId(id)) }, workspaceId: new Types.ObjectId(workspaceId), status: "pending" },
      { status: "approved", $push: { statusHistory: { status: "approved", changedAt: new Date(), changedBy: req.userId, note: "Bulk approved" } } },
    );

    res.json({ approved: result.modifiedCount });
  },
);

// ─── POST / — create payout(s) ────────────────────────────────────────────────
router.post(
  "/",
  ...requirePermission("payouts", "write"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const items = Array.isArray(req.body) ? req.body : [req.body];
    const created: any[] = [];
    const errors: string[] = [];

    for (const item of items) {
      try {
        const body = createPayoutSchema.parse(item);
        const rep = await Rep.findOne({ _id: new Types.ObjectId(body.repId), workspaceId: new Types.ObjectId(workspaceId) });
        if (!rep) { errors.push(`Rep ${body.repId} not found`); continue; }

        const ws = await Workspace.findById(workspaceId);
        const currency = body.currency ?? (ws as any)?.currency ?? "USD";
        const finalAmount = body.commissionAmount + (body.adjustments ?? 0);

        const payout = await Payout.create({
          workspaceId: new Types.ObjectId(workspaceId),
          repId: new Types.ObjectId(body.repId),
          periodStart: new Date(body.periodStart),
          periodEnd: new Date(body.periodEnd),
          commissionAmount: body.commissionAmount,
          adjustments: body.adjustments ?? 0,
          finalAmount,
          currency,
          paymentMethod: body.paymentMethod,
          scheduledPaymentDate: body.scheduledPaymentDate ? new Date(body.scheduledPaymentDate) : undefined,
          notes: body.notes,
          status: "pending",
          statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: req.userId }],
        });

        created.push(formatPayout({ ...payout.toObject(), repId: rep }));
      } catch (err: any) {
        errors.push(err.message ?? "Unknown error");
      }
    }

    res.status(created.length > 0 ? 201 : 400).json({ created, errors });
  },
);

// ─── GET /:id — single payout ─────────────────────────────────────────────────
router.get(
  "/:id",
  ...requirePermission("payouts", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const hasEditPermission = req.permissions?.has("payouts:edit") || req.permissions?.has("payouts:*") || req.permissions?.has("*");

    const payout = await Payout.findOne({ _id: new Types.ObjectId(req.params.id as string), workspaceId: new Types.ObjectId(workspaceId) }).populate("repId");
    if (!payout) { res.status(404).json({ error: "Payout not found" }); return; }

    if (!hasEditPermission) {
      const rep = await Rep.findOne({ workspaceId: new Types.ObjectId(workspaceId), email: req.userEmail });
      if (!rep || payout.repId.toString() !== rep._id.toString()) {
        res.status(403).json({ error: "Access denied" }); return;
      }
    }

    res.json(formatPayout(payout));
  },
);

// ─── PATCH /:id/status — update status (admin only) ──────────────────────────
router.patch(
  "/:id/status",
  ...requirePermission("payouts", "edit"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { status, notes, scheduledPaymentDate, actualPaymentDate, paymentMethod } = req.body as any;

    const validStatuses = ["pending", "approved", "paid", "disputed", "on_hold"];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: `status must be one of: ${validStatuses.join(", ")}` }); return;
    }

    // RBAC: Check for specific permissions based on status
    if (status === "paid" && !req.permissions?.has("payouts:mark_paid") && !req.permissions?.has("payouts:*") && !req.permissions?.has("*")) {
      res.status(403).json({ error: "Insufficient permissions to mark payout as paid" });
      return;
    }
    if (status === "approved" && !req.permissions?.has("payouts:approve") && !req.permissions?.has("payouts:*") && !req.permissions?.has("*")) {
      res.status(403).json({ error: "Insufficient permissions to approve payouts" });
      return;
    }

    const payout = await Payout.findOne({ _id: new Types.ObjectId(req.params.id as string), workspaceId: new Types.ObjectId(workspaceId) }).populate("repId");
    if (!payout) { res.status(404).json({ error: "Payout not found" }); return; }

    if (payout.status === "paid") {
      res.status(400).json({ error: "Payout is already marked as paid and cannot be modified." });
      return;
    }

    const update: any = {
      status,
      $push: { statusHistory: { status, changedAt: new Date(), changedBy: req.userId, note: notes } },
    };
    if (notes) update.notes = notes;
    if (paymentMethod) update.paymentMethod = paymentMethod;
    if (scheduledPaymentDate) update.scheduledPaymentDate = new Date(scheduledPaymentDate);
    if (actualPaymentDate) update.actualPaymentDate = new Date(actualPaymentDate);

    await Payout.findByIdAndUpdate(payout._id, update);
    const updated = await Payout.findById(payout._id).populate("repId");

    const rep = payout.repId as any;
    if (rep?.userId && (status === "approved" || status === "paid")) {
      await sendPayoutNotification(workspaceId, rep, updated, status, notes);
    }

    res.json(formatPayout(updated!));
  },
);

// ─── PATCH /:id/adjust — add adjustment (admin only) ─────────────────────────
router.patch(
  "/:id/adjust",
  ...requirePermission("payouts", "adjust"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { amount, note } = req.body as { amount?: number; note?: string };

    if (typeof amount !== "number" || !Number.isFinite(amount)) {
      res.status(400).json({ error: "amount (number) is required" }); return;
    }

    const payout = await Payout.findOne({ _id: new Types.ObjectId(req.params.id as string), workspaceId: new Types.ObjectId(workspaceId) });
    if (!payout) { res.status(404).json({ error: "Payout not found" }); return; }

    if (payout.status === "paid") {
      res.status(400).json({ error: "Payout is already marked as paid and cannot be adjusted." });
      return;
    }

    const newAdjustments = payout.adjustments + amount;
    const newFinal = payout.commissionAmount + newAdjustments;

    const updated = await Payout.findByIdAndUpdate(
      payout._id,
      {
        adjustments: newAdjustments,
        finalAmount: newFinal,
        $push: { statusHistory: { status: payout.status, changedAt: new Date(), changedBy: req.userId, note: note ?? `Adjustment ${amount >= 0 ? "+" : ""}${amount.toFixed(2)}` } },
      },
      { new: true },
    ).populate("repId");

    res.json(formatPayout(updated!));
  },
);

export default router;
