import { GetRepSummaryParams } from "@workspace/api-zod";
import { CommissionResult, CommissionRun, Deal, Payout, Plan, Rep, Workspace } from "@workspace/db";
import { Router } from "express";
import { convertCurrency } from "../../lib/exchange";
import { type AuthenticatedRequest, requirePermission } from "../../middleware/auth";

const router = Router();

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

router.get(
  "/dashboard/summary",
  ...requirePermission("reports", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const period = currentPeriod();

    // Run independent queries in parallel
    const [workspace, totalReps, latestRun, recentRuns, plans] = await Promise.all([
      Workspace.findById(workspaceId).select("currency").lean(),
      Rep.countDocuments({ workspaceId }),
      CommissionRun.findOne({ workspaceId, period }).sort({ createdAt: -1 }).lean(),
      CommissionRun.find({ workspaceId }).sort({ createdAt: -1 }).limit(5).lean(),
      Plan.find({ workspaceId }).select("_id name").lean(),
    ]);
    const wsCurrency = (workspace as any)?.currency || "USD";

    const planMap = new Map(plans.map((p) => [p._id.toString(), p.name]));

    let totalCommission = 0;
    let totalDeals = 0;
    let totalRevenue = 0;
    const repEarningsMap = new Map<
      string,
      {
        repId: string;
        repName: string;
        planName: string;
        totalCommission: number;
        totalDeals: number;
        totalRevenue: number;
      }
    >();

    if (latestRun) {
      const results = await CommissionResult.find({ runId: latestRun._id })
        .populate("repId")
        .populate("dealId");

      for (const r of results) {
        const commission = Number(r.commissionAmount);
        const rep = r.repId as any;
        const deal = r.dealId as any;
        const dealAmt = deal && deal.amount ? Number(deal.amount) : 0;
        const dealCurrency = (deal && deal.currency) || "USD";
        const resCurrency = (r as any).currency || dealCurrency;

        // Convert to workspace currency for summary cards
        const convertedCommission = await convertCurrency(commission, resCurrency, wsCurrency);
        const convertedRevenue = await convertCurrency(dealAmt, dealCurrency, wsCurrency);

        totalCommission += convertedCommission;
        totalDeals++;
        totalRevenue += convertedRevenue;

        const repIdStr = rep?._id?.toString() || "unknown";
        if (!repEarningsMap.has(repIdStr)) {
          repEarningsMap.set(repIdStr, {
            repId: repIdStr,
            repName: rep?.name || "Unknown",
            planName: rep?.planId ? planMap.get(rep.planId.toString()) || "None" : "None",
            totalCommission: 0,
            totalDeals: 0,
            totalRevenue: 0,
          });
        }
        const entry = repEarningsMap.get(repIdStr)!;
        // For the top earners table, we also show converted values to rank them fairly
        entry.totalCommission += convertedCommission;
        entry.totalDeals++;
        entry.totalRevenue += convertedRevenue;
      }
    }

    let payoutsGenerated = 0;
    let payoutsNeeded = 0;
    if (latestRun) {
      // Count payouts that include this run in their runIds array (cross-run dedup)
      payoutsGenerated = await Payout.countDocuments({ workspaceId, runIds: latestRun._id });
      payoutsNeeded = Math.max(0, (latestRun.repsCount ?? 0) - payoutsGenerated);
    }

    res.json({
      period,
      totalCommission,
      totalRevenue,
      totalDeals,
      totalReps,
      payoutsGenerated,
      payoutsNeeded,
      repEarnings: Array.from(repEarningsMap.values()).sort(
        (a, b) => b.totalCommission - a.totalCommission,
      ),
      recentRuns: recentRuns.map((r) => ({
        id: r._id,
        period: r.period,
        totalCommission: Number(r.totalCommission),
        totalDeals: r.totalDeals,
        repsCount: r.repsCount,
        createdAt: r.createdAt.toISOString(),
      })),
    });
  },
);

router.get(
  "/dashboard/rep-summary/:repId",
  ...requirePermission("reports", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
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

    const latestRun = await CommissionRun.findOne({ workspaceId, period }).sort({ createdAt: -1 });

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
      currency: string;
      calculationNote: string;
      wsCurrency?: string | null;
      convertedDealAmount?: number | null;
      convertedCommission?: number | null;
      exchangeRateSnapshot?: number | null;
      rateSnapshotDate?: Date | null;
    }[] = [];
    const currencySummariesMap = new Map<
      string,
      {
        currency: string;
        totalCommission: number;
        totalRevenue: number;
        totalDeals: number;
      }
    >();

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
          // Snapshot fields
          wsCurrency: (r as any).wsCurrency ?? null,
          convertedDealAmount: (r as any).convertedDealAmount ?? null,
          convertedCommission: (r as any).convertedCommission ?? null,
          exchangeRateSnapshot: (r as any).exchangeRateSnapshot ?? null,
          rateSnapshotDate: (r as any).rateSnapshotDate ?? null,
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

    const allRunsRaw = await CommissionRun.find({ workspaceId, status: "completed" }).sort({
      createdAt: -1,
    });

    const latestRunsByPeriod = new Map<string, any>();
    for (const run of allRunsRaw) {
      if (!latestRunsByPeriod.has(run.period) && latestRunsByPeriod.size < 12) {
        latestRunsByPeriod.set(run.period, run);
      }
    }

    const monthlyHistory = await Promise.all(
      Array.from(latestRunsByPeriod.values()).map(async (run) => {
        const repRunResults = await CommissionResult.find({
          runId: run._id,
          repId: rep._id,
        });
        const commission = repRunResults.reduce((sum, r) => sum + Number(r.commissionAmount), 0);
        return {
          period: run.period,
          totalCommission: commission,
          totalDeals: repRunResults.length,
        };
      }),
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
      currencySummaries: Array.from(currencySummariesMap.values()),
    });
  },
);

export default router;
