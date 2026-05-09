import { Router } from "express";
import { Rep, Plan, CommissionRun, CommissionResult } from "@workspace/db";
import { GetPortalByCodeParams, GetPortalByCodeQueryParams } from "@workspace/api-zod";

const router = Router();

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

/**
 * GET /portal/:accessCode
 * Public endpoint — no auth required.
 * Returns commission summary data for a rep identified by their portal access code.
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

  const workspaceId = rep.workspaceId;

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
    calculationNote: string;
  }[] = [];

  if (latestRun) {
    const results = await CommissionResult.find({ runId: latestRun._id, repId: rep._id }).populate("dealId");

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

  // Monthly history (last 6 runs for this workspace)
  const allRuns = await CommissionRun.find({ workspaceId }).sort({ createdAt: -1 }).limit(6);
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
