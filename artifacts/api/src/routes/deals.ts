import { Router } from "express";
import { Deal, Rep } from "@workspace/db";
import { Types } from "mongoose";
import {
  CreateDealBody,
  ImportDealsBody,
  ListDealsQueryParams,
  DeleteDealParams,
} from "@workspace/api-zod";
import { requireWorkspaceMember, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

function formatDeal(deal: any, repName: string) {
  return {
    id: deal._id,
    repId: deal.repId,
    repName,
    name: deal.name,
    amount: deal.amount,
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
  const conditions: any = { workspaceId: new Types.ObjectId(workspaceId) };

  if (query.repId !== undefined) conditions.repId = new Types.ObjectId(query.repId);
  if (query.period !== undefined) conditions.period = query.period;

  const deals = await Deal.find(conditions).populate('repId').sort({ closeDate: 1 });

  res.json(deals.map((d) => formatDeal(d, d.repId ? (d.repId as any).name ?? "Unknown" : "Unknown")));
});

router.post("/deals", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const body = CreateDealBody.parse(req.body);
  const deal = await Deal.create({
    workspaceId: new Types.ObjectId(workspaceId),
    repId: new Types.ObjectId(body.repId),
    name: body.name,
    amount: body.amount,
    closeDate: body.closeDate,
    period: body.period,
    stage: body.stage,
    notes: body.notes ?? null,
  });

  const rep = await Rep.findById(body.repId);
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
      const rep = await Rep.findOne({ _id: d.repId, workspaceId: new Types.ObjectId(workspaceId) });
      if (!rep) {
        errors.push(`Deal "${d.name}": rep ID ${d.repId} not found`);
        skipped++;
        continue;
      }
      await Deal.create({
        workspaceId: new Types.ObjectId(workspaceId),
        repId: new Types.ObjectId(d.repId),
        name: d.name,
        amount: d.amount,
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
  await Deal.deleteOne({ _id: new Types.ObjectId(id), workspaceId: new Types.ObjectId(workspaceId) });
  res.status(204).send();
});

export default router;
