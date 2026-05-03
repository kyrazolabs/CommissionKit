import { Router } from "express";
import { db, plansTable, planTiersTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreatePlanBody,
  UpdatePlanBody,
  GetPlanParams,
  UpdatePlanParams,
  DeletePlanParams,
} from "@workspace/api-zod";
import { requireWorkspaceMember, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

async function getPlanWithTiers(id: number, workspaceId: number) {
  const [plan] = await db.select().from(plansTable)
    .where(and(eq(plansTable.id, id), eq(plansTable.workspaceId, workspaceId)));
  if (!plan) return null;
  const tiers = await db.select().from(planTiersTable)
    .where(eq(planTiersTable.planId, id))
    .orderBy(planTiersTable.fromAmount);
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

router.get("/plans", ...requireWorkspaceMember("member"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const plans = await db.select().from(plansTable)
    .where(eq(plansTable.workspaceId, workspaceId))
    .orderBy(plansTable.name);
  const withTiers = await Promise.all(plans.map((p) => getPlanWithTiers(p.id, workspaceId)));
  res.json(withTiers.filter(Boolean));
});

router.post("/plans", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const body = CreatePlanBody.parse(req.body);
  const [plan] = await db
    .insert(plansTable)
    .values({
      workspaceId,
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

  const result = await getPlanWithTiers(plan.id, workspaceId);
  res.status(201).json(result);
});

router.get("/plans/:id", ...requireWorkspaceMember("member"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = GetPlanParams.parse(req.params);
  const plan = await getPlanWithTiers(id, workspaceId);
  if (!plan) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }
  res.json(plan);
});

router.put("/plans/:id", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
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
    .where(and(eq(plansTable.id, id), eq(plansTable.workspaceId, workspaceId)));

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

  const result = await getPlanWithTiers(id, workspaceId);
  if (!result) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }
  res.json(result);
});

router.delete("/plans/:id", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = DeletePlanParams.parse(req.params);
  const [existing] = await db.select({ id: plansTable.id }).from(plansTable)
    .where(and(eq(plansTable.id, id), eq(plansTable.workspaceId, workspaceId)));
  if (!existing) {
    res.status(404).json({ error: "Plan not found" });
    return;
  }
  await db.delete(planTiersTable).where(eq(planTiersTable.planId, id));
  await db.delete(plansTable).where(and(eq(plansTable.id, id), eq(plansTable.workspaceId, workspaceId)));
  res.status(204).send();
});

export default router;
