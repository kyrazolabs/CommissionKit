import { Router } from "express";
import { Rep, Plan, Workspace } from "@workspace/db";
import { Types } from "mongoose";
import { randomBytes } from "crypto";
import { CreateRepBody, UpdateRepBody, GetRepParams, UpdateRepParams, DeleteRepParams, SendPortalLinkParams } from "@workspace/api-zod";
import { requireWorkspaceMember, type AuthenticatedRequest } from "../middleware/auth";
import { checkLimits } from "../lib/limits";
import { sendMediumPriorityEmail } from "@workspace/queue";
import { repPortalTemplate } from "@workspace/email-templates";

const router = Router();

/** Generates a unique 24-char hex portal access code */
function generateAccessCode(): string {
  return randomBytes(12).toString("hex");
}

/** Builds the public portal URL for a given access code */
function portalUrl(accessCode: string): string {
  const base = process.env.APP_URL ?? "http://localhost:3000";
  return `${base}/portal/${accessCode}`;
}

/** Sends the portal invite email to a rep (fire-and-forget) */
async function sendPortalLinkEmail(rep: { name: string; email: string; portalAccessCode: string }, workspaceName: string): Promise<void> {
  try {
    const html = repPortalTemplate({
      repName: rep.name,
      workspaceName,
      portalUrl: portalUrl(rep.portalAccessCode),
      accessCode: rep.portalAccessCode,
    });
    await sendMediumPriorityEmail({
      to: rep.email,
      subject: `${workspaceName} has shared your commission portal`,
      html,
      meta: { type: "rep_portal_link", repEmail: rep.email },
    });
  } catch (err) {
    console.error("[Reps] Failed to send portal link email:", err);
  }
}

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
    portalAccessCode: r.portalAccessCode ?? null,
    createdAt: r.createdAt.toISOString(),
  })));
});

router.post("/reps", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  
  const limits = await checkLimits(workspaceId, "reps");
  if (!limits.allowed) {
    res.status(403).json({ 
      error: `You have reached the limit of ${limits.limit} sales reps for your current plan.` 
    });
    return;
  }

  const body = CreateRepBody.parse(req.body);

  // Generate a unique portal access code
  const accessCode = generateAccessCode();

  const rep = await Rep.create({
    workspaceId: new Types.ObjectId(workspaceId),
    name: body.name,
    email: body.email,
    role: body.role,
    planId: body.planId ? new Types.ObjectId(body.planId) : null,
    portalAccessCode: accessCode,
  });

  let planName: string | null = null;
  if (rep.planId) {
    const plan = await Plan.findById(rep.planId);
    planName = plan?.name ?? null;
  }

  // Send the portal link email (non-blocking)
  const workspace = await Workspace.findById(workspaceId);
  const workspaceName = workspace?.name ?? "Your team";
  sendPortalLinkEmail(
    { name: rep.name, email: rep.email, portalAccessCode: accessCode },
    workspaceName
  );

  res.status(201).json({
    id: rep._id,
    name: rep.name,
    email: rep.email,
    role: rep.role,
    planId: rep.planId,
    planName,
    portalAccessCode: accessCode,
    createdAt: rep.createdAt.toISOString(),
  });
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
    portalAccessCode: rep.portalAccessCode ?? null,
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

  res.json({
    id: rep._id,
    name: rep.name,
    email: rep.email,
    role: rep.role,
    planId: rep.planId,
    planName,
    portalAccessCode: rep.portalAccessCode ?? null,
    createdAt: rep.createdAt.toISOString(),
  });
});

router.delete("/reps/:id", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = DeleteRepParams.parse(req.params);
  await Rep.deleteOne({ _id: new Types.ObjectId(id), workspaceId: new Types.ObjectId(workspaceId) });
  res.status(204).send();
});

/**
 * POST /reps/:id/send-portal-link
 * (Re)sends the portal link email to the rep. Rotates the access code on resend.
 * Admin only.
 */
router.post("/reps/:id/send-portal-link", ...requireWorkspaceMember("admin"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const { id } = SendPortalLinkParams.parse(req.params);

  // Rotate access code on every send/resend
  const newCode = generateAccessCode();
  const rep = await Rep.findOneAndUpdate(
    { _id: new Types.ObjectId(id), workspaceId: new Types.ObjectId(workspaceId) },
    { portalAccessCode: newCode },
    { new: true }
  );

  if (!rep) {
    res.status(404).json({ error: "Rep not found" });
    return;
  }

  const workspace = await Workspace.findById(workspaceId);
  const workspaceName = workspace?.name ?? "Your team";

  await sendPortalLinkEmail(
    { name: rep.name, email: rep.email, portalAccessCode: newCode },
    workspaceName
  );

  res.json({ ok: true, portalAccessCode: newCode });
});

export default router;
