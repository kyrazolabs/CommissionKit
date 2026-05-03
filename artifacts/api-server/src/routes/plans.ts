import { Router } from "express";
import { db, plansTable, planTiersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreatePlanBody,
  UpdatePlanBody,
  GetPlanParams,
  UpdatePlanParams,
  DeletePlanParams,
} from "@workspace/api-zod";

const router = Router();

async function getPlanWithTiers(id: number) {
  const [plan] = await db.select().from(plansTable).where(eq(plansTable.id, id));
  if (!plan) return null;
  const tiers = await db.select().from(planTiersTable).where(eq(planTiersTable.planId, id)).orderBy(planTiersTable.fromAmount);
  return {
    ...plan,
    flatRate: plan.flatRate !== null ? Number(plan.flatRate) : null,
    acceleratorThreshold: plan.acceleratorThreshold !== null ? Number(plan.acceleratorThreshold) : null,
    acceleratorRate: plan.acceleratorRate !== null ? Number(plan.acceleratorRate) : null,
    createdAt: plan.createdAt.toISOString(),
    tiers: tiers.map((t) => ({
      id: t.id,
      fromAmount: Number(t.fromAmount),
      toAmount: t.toAmount !== null ? Number(t.toAmount) : null,
      rate: Number(t.rate),
    })),
  };
}

router.get("/plans", async (req, res): Promise<void> => {
  const plans = await db.select().from(plansTable).orderBy(plansTable.name);
  const withTiers = await Promise.all(plans.map((p) => getPlanWithTiers(p.id)));
  res.json(withTiers.filter(Boolean));
});

router.post("/plans", async (req, res): Promise<void> => {
  const body = CreatePlanBody.parse(req.body);
  const [plan] = await db
    .insert(plansTable)
    .values({
      name: body.name,
      type: body.type,
      flatRate: body.flatRate?.toString() ?? null,
      acceleratorThreshold: body.acceleratorThreshold?.toString() ?? null,
      acceleratorRate: body.acceleratorRate?.toString() ?? null,
      clawbackDays: body.clawbackDays ?? null,
    })
    .returning();

  if (body.tiers && body.tiers.length > 0) {
    await db.insert(planTiersTable).values(
      body.tiers.map((t) => ({
        planId: plan.id,
        fromAmount: t.fromAmount.toString(),
        toAmount: t.toAmount?.toString() ?? null,
        rate: t.rate.toString(),
      }))
    );
  }

  const result = await getPlanWithTiers(plan.id);
  res.status(201).json(result);
});

router.get("/plans/:id", async (req, res): Promise<void> => {
  const { id } = GetPlanParams.parse(req.params);
  const plan = await getPlanWithTiers(id);
  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }
  res.json(plan);
});

router.put("/plans/:id", async (req, res): Promise<void> => {
  const { id } = UpdatePlanParams.parse(req.params);
  const body = UpdatePlanBody.parse(req.body);

  await db
    .update(plansTable)
    .set({
      name: body.name,
      type: body.type,
      flatRate: body.flatRate?.toString() ?? null,
      acceleratorThreshold: body.acceleratorThreshold?.toString() ?? null,
      acceleratorRate: body.acceleratorRate?.toString() ?? null,
      clawbackDays: body.clawbackDays ?? null,
    })
    .where(eq(plansTable.id, id));

  if (body.tiers !== undefined) {
    await db.delete(planTiersTable).where(eq(planTiersTable.planId, id));
    if (body.tiers.length > 0) {
      await db.insert(planTiersTable).values(
        body.tiers.map((t) => ({
          planId: id,
          fromAmount: t.fromAmount.toString(),
          toAmount: t.toAmount?.toString() ?? null,
          rate: t.rate.toString(),
        }))
      );
    }
  }

  const result = await getPlanWithTiers(id);
  if (!result) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }
  res.json(result);
});

router.delete("/plans/:id", async (req, res): Promise<void> => {
  const { id } = DeletePlanParams.parse(req.params);
  await db.delete(planTiersTable).where(eq(planTiersTable.planId, id));
  await db.delete(plansTable).where(eq(plansTable.id, id));
  res.status(204).send();
});

export default router;
