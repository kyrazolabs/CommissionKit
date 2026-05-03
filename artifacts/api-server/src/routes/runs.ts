import { Router } from "express";
import { db, commissionRunsTable, commissionResultsTable, dealsTable, repsTable, plansTable, planTiersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateRunBody, GetRunParams } from "@workspace/api-zod";

const router = Router();

function calculateCommission(
  amount: number,
  planType: string,
  flatRate: number | null,
  acceleratorThreshold: number | null,
  acceleratorRate: number | null,
  tiers: { fromAmount: number; toAmount: number | null; rate: number }[]
): { rate: number; commission: number; note: string } {
  if (planType === "flat" && flatRate !== null) {
    const commission = amount * flatRate;
    return { rate: flatRate, commission, note: `Flat rate ${(flatRate * 100).toFixed(2)}% on $${amount.toFixed(2)}` };
  }

  if (planType === "accelerator" && flatRate !== null) {
    if (acceleratorThreshold !== null && acceleratorRate !== null && amount > acceleratorThreshold) {
      const baseCommission = acceleratorThreshold * flatRate;
      const accelCommission = (amount - acceleratorThreshold) * acceleratorRate;
      const total = baseCommission + accelCommission;
      const effectiveRate = total / amount;
      return {
        rate: effectiveRate,
        commission: total,
        note: `Base ${(flatRate * 100).toFixed(2)}% up to $${acceleratorThreshold}, then ${(acceleratorRate * 100).toFixed(2)}% above`,
      };
    }
    const commission = amount * flatRate;
    return { rate: flatRate, commission, note: `Base rate ${(flatRate * 100).toFixed(2)}% (below threshold of $${acceleratorThreshold})` };
  }

  if (planType === "tiered" && tiers.length > 0) {
    let remaining = amount;
    let totalCommission = 0;
    let notes: string[] = [];
    let lastRate = 0;

    for (const tier of tiers) {
      if (remaining <= 0) break;
      const tierTop = tier.toAmount !== null ? tier.toAmount : Infinity;
      const tierBottom = tier.fromAmount;
      const applicable = Math.min(remaining, tierTop - tierBottom);
      if (applicable <= 0) continue;
      const commission = applicable * tier.rate;
      totalCommission += commission;
      notes.push(`${(tier.rate * 100).toFixed(2)}% on $${applicable.toFixed(2)}`);
      lastRate = tier.rate;
      remaining -= applicable;
    }

    const effectiveRate = amount > 0 ? totalCommission / amount : lastRate;
    return { rate: effectiveRate, commission: totalCommission, note: `Tiered: ${notes.join(", ")}` };
  }

  return { rate: 0, commission: 0, note: "No plan or rate configured" };
}

async function formatRun(run: typeof commissionRunsTable.$inferSelect) {
  const results = await db
    .select({
      result: commissionResultsTable,
      repName: repsTable.name,
      dealName: dealsTable.name,
      dealAmount: dealsTable.amount,
    })
    .from(commissionResultsTable)
    .leftJoin(repsTable, eq(commissionResultsTable.repId, repsTable.id))
    .leftJoin(dealsTable, eq(commissionResultsTable.dealId, dealsTable.id))
    .where(eq(commissionResultsTable.runId, run.id));

  return {
    id: run.id,
    period: run.period,
    totalCommission: Number(run.totalCommission),
    totalDeals: run.totalDeals,
    repsCount: run.repsCount,
    createdAt: run.createdAt.toISOString(),
    results: results.map((r) => ({
      id: r.result.id,
      repId: r.result.repId,
      repName: r.repName ?? "Unknown",
      dealId: r.result.dealId,
      dealName: r.dealName ?? "Unknown",
      dealAmount: r.dealAmount !== null ? Number(r.dealAmount) : 0,
      rateApplied: Number(r.result.rateApplied),
      commissionAmount: Number(r.result.commissionAmount),
      calculationNote: r.result.calculationNote,
    })),
  };
}

router.get("/runs", async (req, res): Promise<void> => {
  const runs = await db.select().from(commissionRunsTable).orderBy(commissionRunsTable.createdAt);
  res.json(
    runs.map((r) => ({
      id: r.id,
      period: r.period,
      totalCommission: Number(r.totalCommission),
      totalDeals: r.totalDeals,
      repsCount: r.repsCount,
      createdAt: r.createdAt.toISOString(),
    }))
  );
});

router.post("/runs", async (req, res): Promise<void> => {
  const body = CreateRunBody.parse(req.body);
  const { period } = body;

  const deals = await db
    .select()
    .from(dealsTable)
    .where(and(eq(dealsTable.period, period), eq(dealsTable.stage, "closed_won")));

  const reps = await db.select().from(repsTable);
  const plans = await db.select().from(plansTable);
  const tiers = await db.select().from(planTiersTable).orderBy(planTiersTable.fromAmount);

  const planMap = new Map(plans.map((p) => [p.id, p]));
  const tierMap = new Map<number, { fromAmount: number; toAmount: number | null; rate: number }[]>();
  for (const t of tiers) {
    if (!tierMap.has(t.planId)) tierMap.set(t.planId, []);
    tierMap.get(t.planId)!.push({ fromAmount: Number(t.fromAmount), toAmount: t.toAmount !== null ? Number(t.toAmount) : null, rate: Number(t.rate) });
  }

  const repMap = new Map(reps.map((r) => [r.id, r]));

  const [run] = await db
    .insert(commissionRunsTable)
    .values({ period, totalCommission: "0", totalDeals: 0, repsCount: 0 })
    .returning();

  let totalCommission = 0;
  const resultRows: typeof commissionResultsTable.$inferInsert[] = [];
  const involvedReps = new Set<number>();

  for (const deal of deals) {
    const rep = repMap.get(deal.repId);
    if (!rep || !rep.planId) continue;

    const plan = planMap.get(rep.planId);
    if (!plan) continue;

    const { rate, commission, note } = calculateCommission(
      Number(deal.amount),
      plan.type,
      plan.flatRate !== null ? Number(plan.flatRate) : null,
      plan.acceleratorThreshold !== null ? Number(plan.acceleratorThreshold) : null,
      plan.acceleratorRate !== null ? Number(plan.acceleratorRate) : null,
      tierMap.get(plan.id) ?? []
    );

    totalCommission += commission;
    involvedReps.add(rep.id);
    resultRows.push({
      runId: run.id,
      repId: rep.id,
      dealId: deal.id,
      rateApplied: rate.toString(),
      commissionAmount: commission.toString(),
      calculationNote: note,
    });
  }

  if (resultRows.length > 0) {
    await db.insert(commissionResultsTable).values(resultRows);
  }

  await db
    .update(commissionRunsTable)
    .set({
      totalCommission: totalCommission.toString(),
      totalDeals: resultRows.length,
      repsCount: involvedReps.size,
    })
    .where(eq(commissionRunsTable.id, run.id));

  const updated = await db.select().from(commissionRunsTable).where(eq(commissionRunsTable.id, run.id));
  const result = await formatRun(updated[0]);
  res.status(201).json(result);
});

router.get("/runs/:id", async (req, res): Promise<void> => {
  const { id } = GetRunParams.parse(req.params);
  const [run] = await db.select().from(commissionRunsTable).where(eq(commissionRunsTable.id, id));
  if (!run) {
    res.status(404).json({ error: "Run not found" });
    return;
  }
  const result = await formatRun(run);
  res.json(result);
});

export default router;
