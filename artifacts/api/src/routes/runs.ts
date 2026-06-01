import { Router } from "express";
import { 
  CommissionRun, 
  CommissionResult, 
  Deal, 
  Rep, 
  Plan, 
  PlanTier,
  WorkspaceMember,
} from "@workspace/db";
import { Types } from "mongoose";
import { CreateRunBody, GetRunParams } from "@workspace/api-zod";
import { requirePermission, type AuthenticatedRequest } from "../middleware/auth";
import { sendMediumPriorityEmail, enqueueCommissionCalc } from "@workspace/queue";
import { commissionRunTemplate } from "@workspace/email-templates";
import { createNotification } from "../lib/notify";

const router = Router();

// ... existing calculateCommission function omitted for brevity if you keep it, 
// but it's now in the worker, so I can remove it from here if it's not used.
// Actually, it's better to keep the routes file clean.

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
        // Original currency amounts
        dealAmount: deal?.amount ? Number(deal.amount) : 0,
        dealCurrency,
        commissionAmount: Number(r.commissionAmount),
        rateApplied: Number(r.rateApplied),
        calculationNote: r.calculationNote,
        // Workspace currency + snapshot (present on results after multi-currency update)
        wsCurrency,
        convertedDealAmount: (r as any).convertedDealAmount ?? null,
        convertedCommission: (r as any).convertedCommission ?? null,
        exchangeRateSnapshot: (r as any).exchangeRateSnapshot ?? null,
        rateSnapshotDate: (r as any).rateSnapshotDate ?? null,
      };
    }),
  };
}

router.get("/runs", ...requirePermission("calculations", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const runs = await CommissionRun.find({ workspaceId: new Types.ObjectId(workspaceId) })
    .sort({ createdAt: -1 });
  res.json(
    runs.map((r) => ({
      id: r._id,
      period: r.period,
      totalCommission: Number(r.totalCommission),
      totalDeals: r.totalDeals,
      repsCount: r.repsCount,
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/runs", ...requirePermission("calculations", "create"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const body = CreateRunBody.parse(req.body);
  const { period } = body;

  // Check if there's already a run in progress for this period
  // Ignore stale runs (older than 10 mins) that might be stuck
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

  // Create the run record in 'pending' state
  const run = await CommissionRun.create({ 
    workspaceId: new Types.ObjectId(workspaceId), 
    period, 
    totalCommission: 0, 
    totalDeals: 0, 
    repsCount: 0,
    status: "pending"
  });

  // Enqueue the calculation
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

export default router;
