import { Router } from "express";
import { 
  CommissionRun, 
  CommissionResult, 
  Deal, 
  Rep, 
  Plan 
} from "@workspace/db";
import { GetRepSummaryParams } from "@workspace/api-zod";
import { requireWorkspaceMember, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

router.get("/dashboard/summary", ...requireWorkspaceMember("member"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const period = currentPeriod();

  const totalReps = await Rep.countDocuments({ workspaceId });

  const latestRun = await CommissionRun.findOne({ workspaceId, period })
    .sort({ createdAt: -1 });

  const recentRuns = await CommissionRun.find({ workspaceId })
    .sort({ createdAt: -1 })
    .limit(5);

  let totalCommission = 0;
  let totalDeals = 0;
  let totalRevenue = 0;
  const repEarningsMap = new Map<string, { repId: string; repName: string; totalCommission: number; totalDeals: number; totalRevenue: number }>();

  if (latestRun) {
    const results = await CommissionResult.find({ runId: latestRun._id })
      .populate("repId")
      .populate("dealId");

    for (const r of results) {
      const commission = Number(r.commissionAmount);
      const rep = r.repId as any;
      const deal = r.dealId as any;
      const dealAmt = deal && deal.amount ? Number(deal.amount) : 0;
      
      totalCommission += commission;
      totalDeals++;
      totalRevenue += dealAmt;

      const repIdStr = rep?._id?.toString() || "unknown";
      if (!repEarningsMap.has(repIdStr)) {
        repEarningsMap.set(repIdStr, { 
          repId: repIdStr, 
          repName: rep?.name || "Unknown", 
          totalCommission: 0, 
          totalDeals: 0, 
          totalRevenue: 0 
        });
      }
      const entry = repEarningsMap.get(repIdStr)!;
      entry.totalCommission += commission;
      entry.totalDeals++;
      entry.totalRevenue += dealAmt;
    }
  }

  res.json({
    period,
    totalCommission,
    totalRevenue,
    totalDeals,
    totalReps,
    repEarnings: Array.from(repEarningsMap.values()).sort((a, b) => b.totalCommission - a.totalCommission),
    recentRuns: recentRuns.map((r) => ({
      id: r._id,
      period: r.period,
      totalCommission: Number(r.totalCommission),
      totalDeals: r.totalDeals,
      repsCount: r.repsCount,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.get("/dashboard/rep-summary/:repId", ...requireWorkspaceMember("member"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { repId } = GetRepSummaryParams.parse(req.params);
  const period = (req.query.period as string | undefined) || currentPeriod();

  const rep = await Rep.findOne({ _id: repId, workspaceId });

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }

  let planName: string | null = null;
  if (rep.planId) {
    const plan = await Plan.findOne({ _id: rep.planId, workspaceId });
    planName = plan?.name ?? null;
  }

  const latestRun = await CommissionRun.findOne({ workspaceId, period })
    .sort({ createdAt: -1 });

  let totalCommission = 0;
  let totalRevenue = 0;
  let totalDeals = 0;
  const dealBreakdown: {
    dealId: string;
    dealName: string;
    dealAmount: number;
    closeDate: string;
    rateApplied: number;
    commissionAmount: number;
    calculationNote: string;
  }[] = [];

  if (latestRun) {
    const results = await CommissionResult.find({ runId: latestRun._id, repId: rep._id })
      .populate("dealId");

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
        calculationNote: r.calculationNote,
      });
    }
  }

  const allRuns = await CommissionRun.find({ workspaceId })
    .sort({ createdAt: -1 })
    .limit(12);

  const monthlyHistory = await Promise.all(
    allRuns.map(async (run) => {
      const repRunResults = await CommissionResult.find({ runId: run._id, repId: rep._id });
      const commission = repRunResults.reduce((sum, r) => sum + Number(r.commissionAmount), 0);
      return {
        period: run.period,
        totalCommission: commission,
        totalDeals: repRunResults.length,
      };
    })
  );

  res.json({
    repId: rep._id,
    repName: rep.name,
    email: rep.email,
    planName,
    period,
    totalCommission,
    totalRevenue,
    totalDeals,
    dealBreakdown,
    monthlyHistory,
  });
});

export default router;
