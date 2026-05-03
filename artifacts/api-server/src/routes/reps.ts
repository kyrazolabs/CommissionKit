import { Router } from "express";
import { db, repsTable, plansTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { CreateRepBody, UpdateRepBody, GetRepParams, UpdateRepParams, DeleteRepParams } from "@workspace/api-zod";

const router = Router();

router.get("/reps", async (req, res): Promise<void> => {
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
    .leftJoin(plansTable, eq(repsTable.planId, plansTable.id))
    .orderBy(repsTable.name);

  res.json(reps.map((r) => ({ ...r, planName: r.planName ?? null, createdAt: r.createdAt.toISOString() })));
});

router.post("/reps", async (req, res): Promise<void> => {
  const body = CreateRepBody.parse(req.body);
  const [rep] = await db
    .insert(repsTable)
    .values({ name: body.name, email: body.email, role: body.role, planId: body.planId ?? null })
    .returning();

  let planName: string | null = null;
  if (rep.planId) {
    const [plan] = await db.select({ name: plansTable.name }).from(plansTable).where(eq(plansTable.id, rep.planId));
    planName = plan?.name ?? null;
  }

  res.status(201).json({ ...rep, planName, createdAt: rep.createdAt.toISOString() });
});

router.get("/reps/:id", async (req, res): Promise<void> => {
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
    .leftJoin(plansTable, eq(repsTable.planId, plansTable.id))
    .where(eq(repsTable.id, id));

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }
  res.json({ ...rep, planName: rep.planName ?? null, createdAt: rep.createdAt.toISOString() });
});

router.put("/reps/:id", async (req, res): Promise<void> => {
  const { id } = UpdateRepParams.parse(req.params);
  const body = UpdateRepBody.parse(req.body);
  const [rep] = await db
    .update(repsTable)
    .set({ name: body.name, email: body.email, role: body.role, planId: body.planId ?? null })
    .where(eq(repsTable.id, id))
    .returning();

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }

  let planName: string | null = null;
  if (rep.planId) {
    const [plan] = await db.select({ name: plansTable.name }).from(plansTable).where(eq(plansTable.id, rep.planId));
    planName = plan?.name ?? null;
  }

  res.json({ ...rep, planName, createdAt: rep.createdAt.toISOString() });
});

router.delete("/reps/:id", async (req, res): Promise<void> => {
  const { id } = DeleteRepParams.parse(req.params);
  await db.delete(repsTable).where(eq(repsTable.id, id));
  res.status(204).send();
});

export default router;
