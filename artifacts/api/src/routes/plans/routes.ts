import {
  CreatePlanBody,
  DeletePlanParams,
  GetPlanParams,
  UpdatePlanBody,
  UpdatePlanParams,
} from "@workspace/api-zod";
import { Plan, PlanTier } from "@workspace/db";
import { Router } from "express";
import { Types } from "mongoose";
import { checkLimits } from "../../lib/limits";
import { type AuthenticatedRequest, requirePermission } from "../../middleware/auth";

const router = Router();

async function getPlanWithTiers(id: string, workspaceId: string) {
  const plan = await Plan.findOne({
    _id: new Types.ObjectId(id),
    workspaceId: new Types.ObjectId(workspaceId),
  });
  if (!plan) return null;
  const tiers = await PlanTier.find({ planId: new Types.ObjectId(id) }).sort({ fromAmount: 1 });
  return {
    id: plan._id,
    name: plan.name,
    type: plan.type,
    flatRate: plan.flatRate ?? null,
    acceleratorThreshold: plan.acceleratorThreshold ?? null,
    acceleratorRate: plan.acceleratorRate ?? null,
    clawbackDays: plan.clawbackDays ?? null,
    createdAt: plan.createdAt.toISOString(),
    tiers: tiers.map((t) => ({
      id: t._id,
      fromAmount: t.fromAmount,
      toAmount: t.toAmount ?? null,
      rate: t.rate,
    })),
  };
}

router.get(
  "/plans",
  ...requirePermission("plans", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const plans = await Plan.find({ workspaceId: new Types.ObjectId(workspaceId) }).sort({
      name: 1,
    });
    const withTiers = await Promise.all(
      plans.map((p) => getPlanWithTiers(p._id.toString(), workspaceId)),
    );
    res.json(withTiers.filter(Boolean));
  },
);

router.post(
  "/plans",
  ...requirePermission("plans", "create"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;

    const limits = await checkLimits(workspaceId, "plans");
    if (!limits.allowed) {
      res.status(403).json({
        error: `You have reached the limit of ${limits.limit} commission plans for your current subscription.`,
      });
      return;
    }

    const body = CreatePlanBody.parse(req.body);
    const plan = await Plan.create({
      workspaceId: new Types.ObjectId(workspaceId),
      name: body.name,
      type: body.type,
      flatRate: body.flatRate ?? null,
      acceleratorThreshold: body.acceleratorThreshold ?? null,
      acceleratorRate: body.acceleratorRate ?? null,
      clawbackDays: body.clawbackDays ?? null,
    });

    if (body.tiers && body.tiers.length > 0) {
      await PlanTier.insertMany(
        body.tiers.map((t: { fromAmount: number; toAmount?: number | null; rate: number }) => ({
          planId: plan._id,
          fromAmount: t.fromAmount,
          toAmount: t.toAmount ?? null,
          rate: t.rate,
        })),
      );
    }

    const result = await getPlanWithTiers(plan._id.toString(), workspaceId);
    res.status(201).json(result);
  },
);

router.get(
  "/plans/:id",
  ...requirePermission("plans", "read"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { id } = GetPlanParams.parse(req.params);
    const plan = await getPlanWithTiers(id, workspaceId);
    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    res.json(plan);
  },
);

router.put(
  "/plans/:id",
  ...requirePermission("plans", "edit"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { id } = UpdatePlanParams.parse(req.params);
    const body = UpdatePlanBody.parse(req.body);

    const plan = await Plan.findOneAndUpdate(
      { _id: new Types.ObjectId(id), workspaceId: new Types.ObjectId(workspaceId) },
      {
        name: body.name,
        type: body.type,
        flatRate: body.flatRate ?? null,
        acceleratorThreshold: body.acceleratorThreshold ?? null,
        acceleratorRate: body.acceleratorRate ?? null,
        clawbackDays: body.clawbackDays ?? null,
      },
      { new: true },
    );

    if (!plan) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }

    if (body.tiers !== undefined) {
      await PlanTier.deleteMany({ planId: new Types.ObjectId(id) });
      if (body.tiers.length > 0) {
        await PlanTier.insertMany(
          body.tiers.map((t: { fromAmount: number; toAmount?: number | null; rate: number }) => ({
            planId: new Types.ObjectId(id),
            fromAmount: t.fromAmount,
            toAmount: t.toAmount ?? null,
            rate: t.rate,
          })),
        );
      }
    }

    const result = await getPlanWithTiers(id, workspaceId);
    res.json(result);
  },
);

router.delete(
  "/plans/:id",
  ...requirePermission("plans", "delete"),
  async (req: AuthenticatedRequest, res): Promise<void> => {
    const workspaceId = req.workspaceId!;
    const { id } = DeletePlanParams.parse(req.params);
    const existing = await Plan.findOne({
      _id: new Types.ObjectId(id),
      workspaceId: new Types.ObjectId(workspaceId),
    });
    if (!existing) {
      res.status(404).json({ error: "Plan not found" });
      return;
    }
    await PlanTier.deleteMany({ planId: new Types.ObjectId(id) });
    await Plan.deleteOne({ _id: new Types.ObjectId(id) });
    res.status(204).send();
  },
);

export default router;
