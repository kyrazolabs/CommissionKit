import { Router } from "express";
import { db, commissionRunsTable, commissionResultsTable, dealsTable, repsTable, plansTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { GetRepSummaryParams } from "@workspace/api-zod";

const router = Router();

function currentPeriod() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

router.get("/dashboard/summary", async (req, res): Promise<void> => {
  const period = currentPeriod();

  const allReps = await db.select({ id: repsTable.id }).from(repsTable);
  const totalReps = allReps.length;

  const runs = await db
    .select()
    .from(commissionRunsTable)
    .where(eq(commissionRunsTable.period, period))
    .orderBy(desc(commissionRunsTable.createdAt))
    .limit(1);

  const recentRuns = await db
    .select()
    .from(commissionRunsTable)
    .orderBy(desc(commissionRunsTable.createdAt))
    .limit(5);

  let totalCommission = 0;
  let totalDeals = 0;
  let totalRevenue = 0;
  const repEarningsMap = new Map<number, { repId: number; repName: string; totalCommission: number; totalDeals: number; totalRevenue: number }>();

  if (runs.length > 0) {
    const latestRun = runs[0];
    const results = await db
      .select({
        repId: commissionResultsTable.repId,
        repName: repsTable.name,
        commissionAmount: commissionResultsTable.commissionAmount,
        dealAmount: dealsTable.amount,
      })
      .from(commissionResultsTable)
      .leftJoin(repsTable, eq(commissionResultsTable.repId, repsTable.id))
      .leftJoin(dealsTable, eq(commissionResultsTable.dealId, dealsTable.id))
      .where(eq(commissionResultsTable.runId, latestRun.id));

    for (const r of results) {
      const commission = Number(r.commissionAmount);
      const dealAmt = r.dealAmount !== null ? Number(r.dealAmount) : 0;
      totalCommission += commission;
      totalDeals++;
      totalRevenue += dealAmt;

      if (!repEarningsMap.has(r.repId)) {
        repEarningsMap.set(r.repId, { repId: r.repId, repName: r.repName ?? "Unknown", totalCommission: 0, totalDeals: 0, totalRevenue: 0 });
      }
      const entry = repEarningsMap.get(r.repId)!;
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
    repEarnings: Array.from(repEarningsMap.values()),
    recentRuns: recentRuns.map((r) => ({
      id: r.id,
      period: r.period,
      totalCommission: Number(r.totalCommission),
      totalDeals: r.totalDeals,
      repsCount: r.repsCount,
      createdAt: r.createdAt.toISOString(),
    })),
  });
});

router.get("/dashboard/rep-summary/:repId", async (req, res): Promise<void> => {
  const { repId } = GetRepSummaryParams.parse(req.params);
  const period = (req.query.period as string | undefined) || currentPeriod();

  const [rep] = await db
    .select({ id: repsTable.id, name: repsTable.name, email: repsTable.email, planId: repsTable.planId })
    .from(repsTable)
    .where(eq(repsTable.id, repId));

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }

  let planName: string | null = null;
  if (rep.planId) {
    const [plan] = await db.select({ name: plansTable.name }).from(plansTable).where(eq(plansTable.id, rep.planId));
    planName = plan?.name ?? null;
  }

  const latestRun = await db
    .select()
    .from(commissionRunsTable)
    .where(eq(commissionRunsTable.period, period))
    .orderBy(desc(commissionRunsTable.createdAt))
    .limit(1);

  let totalCommission = 0;
  let totalRevenue = 0;
  let totalDeals = 0;
  let dealBreakdown: {
    dealId: number;
    dealName: string;
    dealAmount: number;
    closeDate: string;
    rateApplied: number;
    commissionAmount: number;
    calculationNote: string;
  }[] = [];

  if (latestRun.length > 0) {
    const results = await db
      .select({
        result: commissionResultsTable,
        dealName: dealsTable.name,
        dealAmount: dealsTable.amount,
        closeDate: dealsTable.closeDate,
      })
      .from(commissionResultsTable)
      .leftJoin(dealsTable, eq(commissionResultsTable.dealId, dealsTable.id))
      .where(eq(commissionResultsTable.runId, latestRun[0].id));

    const repResults = results.filter((r) => r.result.repId === repId);
    for (const r of repResults) {
      const commission = Number(r.result.commissionAmount);
      const dealAmt = r.dealAmount !== null ? Number(r.dealAmount) : 0;
      totalCommission += commission;
      totalRevenue += dealAmt;
      totalDeals++;
      dealBreakdown.push({
        dealId: r.result.dealId,
        dealName: r.dealName ?? "Unknown",
        dealAmount: dealAmt,
        closeDate: r.closeDate ?? "",
        rateApplied: Number(r.result.rateApplied),
        commissionAmount: commission,
        calculationNote: r.result.calculationNote,
      });
    }
  }

  const allRuns = await db
    .select()
    .from(commissionRunsTable)
    .orderBy(desc(commissionRunsTable.createdAt))
    .limit(12);

  const monthlyHistory = await Promise.all(
    allRuns.map(async (run) => {
      const results = await db
        .select({ commissionAmount: commissionResultsTable.commissionAmount })
        .from(commissionResultsTable)
        .where(eq(commissionResultsTable.runId, run.id));

      const repResults = (
        await db
          .select({ commissionAmount: commissionResultsTable.commissionAmount })
          .from(commissionResultsTable)
          .where(eq(commissionResultsTable.runId, run.id))
      ).filter((_, i) => {
        return true;
      });

      const fullResults = await db
        .select()
        .from(commissionResultsTable)
        .where(eq(commissionResultsTable.runId, run.id));

      const repRunResults = fullResults.filter((r) => r.repId === repId);
      const commission = repRunResults.reduce((sum, r) => sum + Number(r.commissionAmount), 0);
      return {
        period: run.period,
        totalCommission: commission,
        totalDeals: repRunResults.length,
      };
    })
  );

  res.json({
    repId,
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
