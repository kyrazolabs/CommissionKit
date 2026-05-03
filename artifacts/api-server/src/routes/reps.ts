import { Router } from "express";
import { db, repsTable, plansTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { CreateRepBody, UpdateRepBody, GetRepParams, UpdateRepParams, DeleteRepParams } from "@workspace/api-zod";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/reps", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const reps = await db
    .select({
      id: repsTable.id,
      name: repsTable.name,
      email: repsTable.email,
      role: repsTable.role,
      planId: repsTable.planId,
      planName: plansTable.name,
      createdAt: repsTable.createdAt,
    })
    .from(repsTable)
    .leftJoin(plansTable, and(eq(repsTable.planId, plansTable.id), eq(plansTable.userId, userId)))
    .where(eq(repsTable.userId, userId))
    .orderBy(repsTable.name);

  res.json(reps.map((r) => ({ ...r, planName: r.planName ?? null, createdAt: r.createdAt.toISOString() })));
});

router.post("/reps", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const body = CreateRepBody.parse(req.body);
  const [rep] = await db
    .insert(repsTable)
    .values({ userId, name: body.name, email: body.email, role: body.role, planId: body.planId ?? null })
    .returning();

  let planName: string | null = null;
  if (rep.planId) {
    const [plan] = await db.select({ name: plansTable.name }).from(plansTable)
      .where(and(eq(plansTable.id, rep.planId), eq(plansTable.userId, userId)));
    planName = plan?.name ?? null;
  }

  res.status(201).json({ ...rep, planName, createdAt: rep.createdAt.toISOString() });
});

router.get("/reps/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const { id } = GetRepParams.parse(req.params);
  const [rep] = await db
    .select({
      id: repsTable.id,
      name: repsTable.name,
      email: repsTable.email,
      role: repsTable.role,
      planId: repsTable.planId,
      planName: plansTable.name,
      createdAt: repsTable.createdAt,
    })
    .from(repsTable)
    .leftJoin(plansTable, and(eq(repsTable.planId, plansTable.id), eq(plansTable.userId, userId)))
    .where(and(eq(repsTable.id, id), eq(repsTable.userId, userId)));

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }
  res.json({ ...rep, planName: rep.planName ?? null, createdAt: rep.createdAt.toISOString() });
});

router.put("/reps/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const { id } = UpdateRepParams.parse(req.params);
  const body = UpdateRepBody.parse(req.body);
  const [rep] = await db
    .update(repsTable)
    .set({ name: body.name, email: body.email, role: body.role, planId: body.planId ?? null })
    .where(and(eq(repsTable.id, id), eq(repsTable.userId, userId)))
    .returning();

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }

  let planName: string | null = null;
  if (rep.planId) {
    const [plan] = await db.select({ name: plansTable.name }).from(plansTable)
      .where(and(eq(plansTable.id, rep.planId), eq(plansTable.userId, userId)));
    planName = plan?.name ?? null;
  }

  res.json({ ...rep, planName, createdAt: rep.createdAt.toISOString() });
});

router.delete("/reps/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const { id } = DeleteRepParams.parse(req.params);
  await db.delete(repsTable).where(and(eq(repsTable.id, id), eq(repsTable.userId, userId)));
  res.status(204).send();
});

export default router;
