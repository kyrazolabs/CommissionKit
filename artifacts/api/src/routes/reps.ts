import { Router } from "express";
import { Rep, Plan } from "@workspace/db";
import { Types } from "mongoose";
import { CreateRepBody, UpdateRepBody, GetRepParams, UpdateRepParams, DeleteRepParams } from "@workspace/api-zod";
import { requireWorkspaceMember, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

router.get("/reps", ...requireWorkspaceMember("member"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const reps = await Rep.find({ workspaceId: new Types.ObjectId(workspaceId) }).populate('planId').sort({ name: 1 });

  res.json(reps.map((r) => ({
    id: r._id,
    name: r.name,
    email: r.email,
    role: r.role,
    planId: r.planId ? (r.planId as any)._id ?? r.planId : null,
    planName: r.planId ? (r.planId as any).name ?? null : null,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/reps", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const body = CreateRepBody.parse(req.body);
  const rep = await Rep.create({
    workspaceId: new Types.ObjectId(workspaceId),
    name: body.name,
    email: body.email,
    role: body.role,
    planId: body.planId ? new Types.ObjectId(body.planId) : null,
  });

  let planName: string | null = null;
  if (rep.planId) {
    const plan = await Plan.findById(rep.planId);
    planName = plan?.name ?? null;
  }

  res.status(201).json({ id: rep._id, name: rep.name, email: rep.email, role: rep.role, planId: rep.planId, planName, createdAt: rep.createdAt.toISOString() });
});

router.get("/reps/:id", ...requireWorkspaceMember("member"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = GetRepParams.parse(req.params);
  const rep = await Rep.findOne({
    _id: new Types.ObjectId(id),
    workspaceId: new Types.ObjectId(workspaceId),
  }).populate('planId');

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }
  res.json({
    id: rep._id,
    name: rep.name,
    email: rep.email,
    role: rep.role,
    planId: rep.planId ? (rep.planId as any)._id ?? rep.planId : null,
    planName: rep.planId ? (rep.planId as any).name ?? null : null,
    createdAt: rep.createdAt.toISOString(),
  });
});

router.put("/reps/:id", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = UpdateRepParams.parse(req.params);
  const body = UpdateRepBody.parse(req.body);
  const rep = await Rep.findOneAndUpdate(
    { _id: new Types.ObjectId(id), workspaceId: new Types.ObjectId(workspaceId) },
    { name: body.name, email: body.email, role: body.role, planId: body.planId ? new Types.ObjectId(body.planId) : null },
    { new: true }
  );

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }

  let planName: string | null = null;
  if (rep.planId) {
    const plan = await Plan.findById(rep.planId);
    planName = plan?.name ?? null;
  }

  res.json({ id: rep._id, name: rep.name, email: rep.email, role: rep.role, planId: rep.planId, planName, createdAt: rep.createdAt.toISOString() });
});

router.delete("/reps/:id", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = DeleteRepParams.parse(req.params);
  await Rep.deleteOne({ _id: new Types.ObjectId(id), workspaceId: new Types.ObjectId(workspaceId) });
  res.status(204).send();
});

export default router;
