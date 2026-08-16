import { Router } from "express";
import { 
  CommissionRun, 
  CommissionResult, 
  Deal, 
  Rep, 
  Plan, 
  PlanTier,
  WorkspaceMember,
  Payout,
  Workspace,
} from "@workspace/db";
import { Types } from "mongoose";
import { CreateRunBody, GetRunParams } from "@workspace/api-zod";
import { requirePermission, type AuthenticatedRequest } from "../../middleware/auth";
import { sendMediumPriorityEmail, enqueueCommissionCalc } from "@workspace/queue";
import { commissionRunTemplate } from "@workspace/email-templates";
import { createNotification } from "../../lib/notify";
import { logger } from "../../lib/logger";
import { logAudit } from "../../lib/audit";

const router = Router();

async function formatRun(run: any) {
  const results = await CommissionResult.find({ runId: run._id })
    .populate("repId")
    .populate("dealId");

  return {
    id: run._id,
    period: run.period,
    totalCommission: Number(run.totalCommission),
    totalDeals: run.totalDeals,
    repsCount: run.repsCount,
    status: run.status,
    error: run.error,
    createdAt: run.createdAt.toISOString(),
    results: results.map((r) => {
      const rep = r.repId as any;
      const deal = r.dealId as any;
      const dealCurrency = (r as any).currency || deal?.currency || "USD";
      const wsCurrency = (r as any).wsCurrency || null;
      return {
        id: r._id,
        repId: rep?._id,
        repName: rep?.name ?? "Unknown",
        dealId: deal?._id,
        dealName: deal?.name ?? "Unknown",
        dealAmount: deal?.amount ? Number(deal.amount) : 0,
        dealCurrency,
        commissionAmount: Number(r.commissionAmount),
        rateApplied: Number(r.rateApplied),
        calculationNote: r.calculationNote,
        wsCurrency,
        convertedDealAmount: (r as any).convertedDealAmount ?? null,
        convertedCommission: (r as any).convertedCommission ?? null,
        exchangeRateSnapshot: (r as any).exchangeRateSnapshot ?? null,
        rateSnapshotDate: (r as any).rateSnapshotDate ?? null,
        meta: (r as any).meta ?? null,
      };
    }),
  };
}

router.get("/runs", ...requirePermission("calculations", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const conditions = { workspaceId: new Types.ObjectId(workspaceId) };
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(500, Math.max(1, Number(req.query.limit) || 50));

  const [runs, total] = await Promise.all([
    CommissionRun.find(conditions).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    CommissionRun.countDocuments(conditions),
  ]);

  res.json({
    data: runs.map((r) => ({
      id: r._id,
      period: r.period,
      totalCommission: Number(r.totalCommission),
      totalDeals: r.totalDeals,
      repsCount: r.repsCount,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    })),
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
});

router.post("/runs", ...requirePermission("calculations", "create"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const body = CreateRunBody.parse(req.body);
  const { period } = body;

  const staleThreshold = new Date(Date.now() - 10 * 60 * 1000);
  const existingRun = await CommissionRun.findOne({
    workspaceId: new Types.ObjectId(workspaceId),
    period,
    status: { $in: ["pending", "processing"] },
    updatedAt: { $gt: staleThreshold }
  });

  if (existingRun) {
    res.status(409).json({ error: `A calculation for ${period} is already in progress. Please wait a few minutes.` });
    return;
  }

  const run = await CommissionRun.create({ 
    workspaceId: new Types.ObjectId(workspaceId), 
    period, 
    totalCommission: 0, 
    totalDeals: 0, 
    repsCount: 0,
    status: "pending"
  });

  const payload: any = {
    workspaceId,
    runId: run._id.toString(),
    period,
    userId: req.userId
  };
  if (body.paymentStatuses) payload.paymentStatuses = body.paymentStatuses;

  await enqueueCommissionCalc(payload);

  res.status(201).json({
    id: run._id,
    period: run.period,
    status: run.status,
    createdAt: run.createdAt.toISOString()
  });
});

router.get("/runs/:id", ...requirePermission("calculations", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = GetRunParams.parse(req.params);
  const run = await CommissionRun.findOne({ 
    _id: new Types.ObjectId(id), 
    workspaceId: new Types.ObjectId(workspaceId) 
  });
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  const result = await formatRun(run);
  res.json(result);
});

// ─── Helpers for generate-payouts ──────────────────────────────────────────────

function formatPayoutForRun(payout: any, rep: any) {
  return {
    id: payout._id.toString(),
    repId: rep._id ? rep._id.toString() : (payout.repId?.toString?.() ?? null),
    repName: rep?.name ?? "Unknown",
    periodStart: payout.periodStart instanceof Date ? payout.periodStart.toISOString() : payout.periodStart,
    periodEnd: payout.periodEnd instanceof Date ? payout.periodEnd.toISOString() : payout.periodEnd,
    commissionAmount: payout.commissionAmount,
    adjustments: payout.adjustments ?? 0,
    finalAmount: payout.finalAmount,
    currency: payout.currency ?? "USD",
    status: payout.status,
    notes: payout.notes ?? null,
    runIds: (payout.runIds ?? []).map((id: any) => id.toString()),
    statusHistory: payout.statusHistory ?? [],
    createdAt: payout.createdAt?.toISOString?.(),
    updatedAt: payout.updatedAt?.toISOString?.(),
  };
}

/**
 * Status behavior when a payout already exists for a rep+period:
 *
 * | Existing Status | Δ Direction | Action                        |
 * |----------------|-------------|-------------------------------|
 * | None           | —           | Create new pending payout     |
 * | Pending        | Increase    | Update commissionAmount       |
 * | Pending        | Decrease    | Update + flag for review      |
 * | Pending        | Same        | Skip (add runId to runIds)    |
 * | Approved       | Increase    | Update + flag                 |
 * | Approved       | Decrease    | Skip (needs human review)     |
 * | Approved       | Same        | Skip                          |
 * | Paid           | Increase    | Create new delta payout       |
 * | Paid           | Decrease    | Skip (can't auto-clawback)    |
 * | Paid           | Same        | Skip                          |
 * | Disputed       | Any         | Skip                          |
 * | On Hold        | Increase    | Update + flag                 |
 * | On Hold        | Decrease    | Skip (needs human resolution) |
 * | On Hold        | Same        | Skip                          |
 *
 * Rules:
 * - Never overwrite existing manual adjustments (preserve payout.adjustments)
 * - finalAmount = newCommissionAmount + existingAdjustments
 * - runIds array tracks every contributing run
 * - $0 commission amounts are skipped entirely
 */

type RepAggregate = { repId: string; repName: string; totalCommission: number };

interface PayoutActionResult {
  created: any[];
  updated: any[];
  skipped: any[];
  flagged: any[];
}

async function processRepPayout(
  agg: RepAggregate,
  run: any,
  workspaceId: Types.ObjectId,
  periodStart: Date,
  periodEnd: Date,
  wsCurrency: string,
  userId: string,
): Promise<PayoutActionResult> {
  const result: PayoutActionResult = { created: [], updated: [], skipped: [], flagged: [] };

  // Skip $0 commissions
  if (agg.totalCommission <= 0) {
    result.skipped.push({ repId: agg.repId, repName: agg.repName, reason: "zero commission" });
    return result;
  }

  // Find existing payout for this rep + period (cross-run dedup)
  const existing = await Payout.findOne({
    workspaceId,
    repId: new Types.ObjectId(agg.repId),
    periodStart,
    periodEnd,
  }).populate("repId");

  if (!existing) {
    // Scenario 1: No existing payout — create new
    const payout = await Payout.create({
      workspaceId,
      repId: new Types.ObjectId(agg.repId),
      runIds: [run._id],
      periodStart,
      periodEnd,
      commissionAmount: agg.totalCommission,
      adjustments: 0,
      finalAmount: agg.totalCommission,
      currency: wsCurrency,
      status: "pending",
      statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: userId }],
    });

    const rep = (existing as any)?.repId ?? null;
    result.created.push(formatPayoutForRun(payout.toObject(), rep || { _id: agg.repId, name: agg.repName }));
    return result;
  }

  // Add this runId to the existing payout's runIds if not already present
  const runIdStr = run._id.toString();
  const hasRunId = existing.runIds.some((id: any) => id.toString() === runIdStr);

  if (!hasRunId) {
    // Append runId even if we skip the update (audit trail)
    await Payout.findByIdAndUpdate(existing._id, {
      $addToSet: { runIds: run._id },
    });
  }

  const newAmount = agg.totalCommission;
  const existingAmount = existing.commissionAmount;
  const delta = newAmount - existingAmount;

  // Determine action based on existing status
  switch (existing.status) {
    case "pending":
    case "approved":
    case "on_hold": {
      if (delta === 0) {
        // Same amount — skip
        result.skipped.push({ repId: agg.repId, repName: agg.repName, reason: "no change" });
        return result;
      }

      if (delta < 0) {
        // Decrease — flag, don't auto-update
        result.flagged.push({
          repId: agg.repId,
          repName: agg.repName,
          reason: `commission decreased from ${existingAmount.toFixed(2)} to ${newAmount.toFixed(2)} — needs manual review`,
          existingPayoutId: existing._id.toString(),
        });
        return result;
      }

      // Increase — update the payout
      const newFinal = newAmount + (existing.adjustments ?? 0);
      await Payout.findByIdAndUpdate(existing._id, {
        commissionAmount: newAmount,
        finalAmount: newFinal,
        $push: {
          statusHistory: {
            status: existing.status,
            changedAt: new Date(),
            changedBy: userId,
            note: `Updated from run ${run.period}: ${existingAmount.toFixed(2)} → ${newAmount.toFixed(2)} (+${delta.toFixed(2)})`,
          },
        },
      });

      if (existing.status !== "pending") {
        result.flagged.push({
          repId: agg.repId,
          repName: agg.repName,
          reason: `updated approved payout — was ${existingAmount.toFixed(2)}, now ${newAmount.toFixed(2)}`,
          existingPayoutId: existing._id.toString(),
        });
      }

      const updated = await Payout.findById(existing._id).populate("repId");
      result.updated.push(formatPayoutForRun(updated!, (updated as any)?.repId));
      return result;
    }

    case "paid": {
      if (delta <= 0) {
        // No increase or decrease — skip
        result.skipped.push({ repId: agg.repId, repName: agg.repName, reason: delta === 0 ? "no change (paid)" : "decrease after paid — cannot auto-clawback" });
        return result;
      }

      // Paid + increase → create delta payout
      const deltaPayout = await Payout.create({
        workspaceId,
        repId: new Types.ObjectId(agg.repId),
        runIds: [run._id],
        periodStart,
        periodEnd,
        commissionAmount: delta,
        adjustments: 0,
        finalAmount: delta,
        currency: wsCurrency,
        status: "pending",
        notes: `Delta from run ${run.period}: additional ${delta.toFixed(2)} on top of paid payout #${existing._id}`,
        statusHistory: [{ status: "pending", changedAt: new Date(), changedBy: userId }],
      });

      result.created.push(formatPayoutForRun(deltaPayout.toObject(), { _id: agg.repId, name: agg.repName }));
      return result;
    }

    case "disputed": {
      // Never touch a disputed payout
      result.skipped.push({ repId: agg.repId, repName: agg.repName, reason: "payout is disputed" });
      return result;
    }

    default:
      result.skipped.push({ repId: agg.repId, repName: agg.repName, reason: "unknown status" });
      return result;
  }
}

// ─── POST /api/runs/:id/generate-payouts ──────────────────────────────────────

router.post("/runs/:id/generate-payouts", ...requirePermission("payouts", "write"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const runId = req.params.id as string;

  const run = await CommissionRun.findOne({
    _id: new Types.ObjectId(runId),
    workspaceId: new Types.ObjectId(workspaceId),
  });

  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }

  if (run.status !== "completed") {
    res.status(400).json({ error: "Run must be completed before generating payouts" });
    return;
  }

  const workspace = await Workspace.findById(workspaceId).select("currency name").lean();
  const wsCurrency = (workspace as any)?.currency ?? "USD";

  // Derive period dates from run.period or query params
  const [year, month] = run.period.split("-").map(Number);
  const defaultPeriodStart = new Date(Date.UTC(year, month - 1, 1));
  const defaultPeriodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));

  const periodStart = req.query.periodStart
    ? new Date(String(req.query.periodStart))
    : defaultPeriodStart;
  const periodEnd = req.query.periodEnd
    ? new Date(String(req.query.periodEnd))
    : defaultPeriodEnd;

  // Aggregate commission results by rep
  const results = await CommissionResult.find({
    runId: run._id,
  }).populate("repId");

  // Group by repId and compute totals
  const repAggregates = new Map<string, RepAggregate>();
  for (const r of results) {
    const rep = r.repId as any;
    if (!rep) continue;
    const repIdStr = rep._id.toString();
    if (!repAggregates.has(repIdStr)) {
      repAggregates.set(repIdStr, {
        repId: repIdStr,
        repName: rep.name ?? "Unknown",
        totalCommission: 0,
      });
    }
    repAggregates.get(repIdStr)!.totalCommission += Number(r.commissionAmount);
  }

  // Optional: filter to specific repIds from request body (selective generation)
  const requestedRepIds: string[] | undefined = req.body?.repIds;
  const filteredAggregates = requestedRepIds
    ? Array.from(repAggregates.entries()).filter(([id]) => requestedRepIds.includes(id))
    : Array.from(repAggregates.entries());

  // Process each rep
  const allCreated: any[] = [];
  const allUpdated: any[] = [];
  const allSkipped: any[] = [];
  const allFlagged: any[] = [];

  for (const [, agg] of filteredAggregates) {
    const outcome = await processRepPayout(
      agg,
      run,
      new Types.ObjectId(workspaceId),
      periodStart,
      periodEnd,
      wsCurrency,
      req.userId!,
    );
    allCreated.push(...outcome.created);
    allUpdated.push(...outcome.updated);
    allSkipped.push(...outcome.skipped);
    allFlagged.push(...outcome.flagged);
  }

  logger.info(
    {
      runId,
      created: allCreated.length,
      updated: allUpdated.length,
      skipped: allSkipped.length,
      flagged: allFlagged.length,
    },
    "Generated payouts from run",
  );

  await logAudit("create", "payout", {
    workspaceId,
    metadata: {
      runId: run._id.toString(),
      createdCount: allCreated.length,
      updatedCount: allUpdated.length,
      skippedCount: allSkipped.length,
      flaggedCount: allFlagged.length,
      period: run.period,
    },
  });

  res.json({
    created: allCreated,
    updated: allUpdated,
    skipped: allSkipped,
    flagged: allFlagged,
  });
});

export default router;
