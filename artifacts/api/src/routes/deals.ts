import { Router } from "express";
import { db, dealsTable, repsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import {
  CreateDealBody,
  ImportDealsBody,
  ListDealsQueryParams,
  DeleteDealParams,
} from "@workspace/api-zod";
import { requireWorkspaceMember, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

function formatDeal(deal: typeof dealsTable.$inferSelect, repName: string) {
  return {
    id: deal.id,
    repId: deal.repId,
    repName,
    name: deal.name,
    amount: Number(deal.amount),
    closeDate: deal.closeDate,
    period: deal.period,
    stage: deal.stage,
    notes: deal.notes ?? null,
    createdAt: deal.createdAt.toISOString(),
  };
}

router.get("/deals", ...requireWorkspaceMember("member"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const query = ListDealsQueryParams.parse(req.query);
  const conditions: ReturnType<typeof eq>[] = [eq(dealsTable.workspaceId, workspaceId)];

  if (query.repId !== undefined) conditions.push(eq(dealsTable.repId, query.repId));
  if (query.period !== undefined) conditions.push(eq(dealsTable.period, query.period));

  const deals = await db
    .select({
      deal: dealsTable,
      repName: repsTable.name,
    })
    .from(dealsTable)
    .leftJoin(repsTable, and(eq(dealsTable.repId, repsTable.id), eq(repsTable.workspaceId, workspaceId)))
    .where(and(...conditions))
    .orderBy(dealsTable.closeDate);

  res.json(deals.map((d) => formatDeal(d.deal, d.repName ?? "Unknown")));
});

router.post("/deals", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const body = CreateDealBody.parse(req.body);
  const [deal] = await db
    .insert(dealsTable)
    .values({
      workspaceId,
      repId: body.repId,
      name: body.name,
      amount: body.amount.toString(),
      closeDate: body.closeDate,
      period: body.period,
      stage: body.stage,
      notes: body.notes ?? null,
    })
    .returning();

  const [rep] = await db.select({ name: repsTable.name }).from(repsTable)
    .where(and(eq(repsTable.id, deal.repId), eq(repsTable.workspaceId, workspaceId)));
  res.status(201).json(formatDeal(deal, rep?.name ?? "Unknown"));
});

router.post("/deals/import", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const body = ImportDealsBody.parse(req.body);
  const errors: string[] = [];
  let imported = 0;
  let skipped = 0;

  for (const d of body.deals) {
    try {
      const [rep] = await db.select({ id: repsTable.id }).from(repsTable)
        .where(and(eq(repsTable.id, d.repId), eq(repsTable.workspaceId, workspaceId)));
      if (!rep) {
        errors.push(`Deal "${d.name}": rep ID ${d.repId} not found`);
        skipped++;
        continue;
      }
      await db.insert(dealsTable).values({
        workspaceId,
        repId: d.repId,
        name: d.name,
        amount: d.amount.toString(),
        closeDate: d.closeDate,
        period: body.period,
        stage: d.stage,
        notes: d.notes ?? null,
      });
      imported++;
    } catch (err) {
      errors.push(`Deal "${d.name}": ${err instanceof Error ? err.message : String(err)}`);
      skipped++;
    }
  }

  res.json({ imported, skipped, errors });
});

router.delete("/deals/:id", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = DeleteDealParams.parse(req.params);
  await db.delete(dealsTable).where(and(eq(dealsTable.id, id), eq(dealsTable.workspaceId, workspaceId)));
  res.status(204).send();
});

export default router;
