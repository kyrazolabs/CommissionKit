import { Router } from "express";
import { Workspace, WorkspaceMember } from "@workspace/db";
import { Types } from "mongoose";
import { requireAuth, requirePermission, type AuthenticatedRequest } from "../middleware/auth";
import { sendHighPriorityEmail } from "@workspace/queue";
import { invitationTemplate } from "@workspace/email-templates";
import { checkLimits } from "../lib/limits";
import { seedWorkspaceRoles } from "../lib/seeds/roles";
import { getUserPermissions } from "../lib/rbac";

const router = Router();

const ADMIN_ROLES = ["owner", "admin"];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function getMembership(workspaceId: string, userId: string) {
  return await WorkspaceMember.findOne({
    workspaceId: new Types.ObjectId(workspaceId),
    userId,
  });
}

router.get("/workspaces", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const userEmail = req.userEmail ?? "";

  // Auto-accept pending invites for this email
  if (userEmail) {
    await WorkspaceMember.updateMany(
      { userId: null, email: userEmail },
      { userId }
    );
  }

  const memberships = await WorkspaceMember.find({ userId }).populate("workspaceId").sort({ "workspaceId.name": 1 });

  res.json(
    memberships.map((m) => ({
      id: (m.workspaceId as any)._id,
      slug: (m.workspaceId as any).slug,
      name: (m.workspaceId as any).name,
      currency: (m.workspaceId as any).currency || "USD",
      fiscalYearStart: (m.workspaceId as any).fiscalYearStart || "January",
      role: m.role,
      createdAt: (m.workspaceId as any).createdAt.toISOString(),
    }))
  );
});

router.post("/workspaces", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const { name } = req.body as { name?: string };
  if (!name?.trim()) {
    res.status(400).json({ error: "Workspace name is required" });
    return;
  }

  const userId = req.userId!;
  const userEmail = req.userEmail ?? "";
  const baseSlug = slugify(name.trim()) || "workspace";

  let slug = baseSlug;
  for (let i = 1; ; i++) {
    const existing = await Workspace.findOne({ slug });
    if (!existing) break;
    slug = `${baseSlug}-${i}`;
  }

  const workspace = await Workspace.create({ slug, name: name.trim(), ownerId: userId });

  const { ownerRole } = await seedWorkspaceRoles(workspace._id);

  await WorkspaceMember.create({
    workspaceId: workspace._id,
    userId,
    email: userEmail,
    role: "owner",
    roleIds: [ownerRole._id],
  });

  res.status(201).json({
    id: workspace._id,
    slug: workspace.slug,
    name: workspace.name,
    currency: workspace.currency || "USD",
    fiscalYearStart: workspace.fiscalYearStart || "January",
    role: "owner",
    createdAt: workspace.createdAt.toISOString(),
  });
});

router.get("/workspaces/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = String(req.params.id);
  const membership = await getMembership(workspaceId, req.userId!);
  if (!membership) { res.status(403).json({ error: "Not a member of this workspace" }); return; }

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) { res.status(404).json({ error: "Workspace not found" }); return; }

  const members = await WorkspaceMember.find({ workspaceId: new Types.ObjectId(workspaceId) }).sort({ createdAt: 1 });

  res.json({
    id: workspace._id,
    slug: workspace.slug,
    name: workspace.name,
    currency: (workspace as any).currency || "USD",
    fiscalYearStart: (workspace as any).fiscalYearStart || "January",
    role: membership.role,
    createdAt: workspace.createdAt.toISOString(),
    members: members.map((m) => ({
      id: m._id,
      userId: m.userId,
      email: m.email,
      role: m.role,
      roleIds: m.roleIds,
      status: m.userId ? "active" : "pending",
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

router.get("/workspaces/:id/permissions", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = String(req.params.id);
  const permissions = await getUserPermissions(workspaceId, req.userId!);
  res.json({ permissions: Array.from(permissions) });
});

router.put("/workspaces/:id", ...requirePermission("workspace", "edit"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = String(req.params.id);

  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name is required" }); return; }

  const updated = await Workspace.findByIdAndUpdate(
    workspaceId,
    { name: name.trim() },
    { new: true }
  );

  res.json({
    id: updated!._id,
    slug: updated!.slug,
    name: updated!.name,
    currency: (updated as any).currency || "USD",
    fiscalYearStart: (updated as any).fiscalYearStart || "January",
    role: req.workspaceRole,
  });
});

router.delete("/workspaces/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = String(req.params.id);
  const membership = await getMembership(workspaceId, req.userId!);
  if (membership?.role !== "owner") {
    res.status(403).json({ error: "Only the owner can delete a workspace" }); return;
  }

  await WorkspaceMember.deleteMany({ workspaceId: new Types.ObjectId(workspaceId) });
  await Workspace.findByIdAndDelete(workspaceId);
  res.status(204).send();
});

router.get("/workspaces/:id/members", ...requirePermission("team", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = String(req.params.id);
  const members = await WorkspaceMember.find({ workspaceId: new Types.ObjectId(workspaceId) }).sort({ createdAt: 1 });

  res.json(
    members.map((m) => ({
      id: m._id,
      userId: m.userId,
      email: m.email,
      role: m.role,
      roleIds: m.roleIds,
      status: m.userId ? "active" : "pending",
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/workspaces/:id/members/invite", ...requirePermission("team", "create"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.params.id;

  const { email, roleIds = [] } = req.body as { email?: string; roleIds?: string[] };
  if (!email?.trim()) { res.status(400).json({ error: "Email is required" }); return; }

  const limits = await checkLimits(workspaceId as string, "members");
  if (!limits.allowed) {
    res.status(403).json({ 
      error: `You have reached the limit of ${limits.limit} members for your current plan.` 
    });
    return;
  }
  // Allow empty roleIds (defaults to basic member permissions via fallback)

  const normalizedEmail = email.toLowerCase().trim();
  const existing = await WorkspaceMember.findOne({
    workspaceId: new Types.ObjectId(workspaceId as string),
    email: normalizedEmail,
  });
  if (existing) { res.status(409).json({ error: "This person is already a member or has a pending invite" }); return; }

  const member = await WorkspaceMember.create({
    workspaceId: new Types.ObjectId(workspaceId as string),
    email: normalizedEmail,
    role: "member", // legacy fallback
    roleIds: roleIds.map(id => new Types.ObjectId(id)),
  });

  // Fire-and-forget invitation email
  const workspace = await Workspace.findById(workspaceId);
  const inviterEmail = req.userEmail ?? "someone";
  const inviterName = inviterEmail.split("@")[0];
  const APP_URL = process.env.APP_URL || "http://localhost:3000";

  setImmediate(async () => {
    try {
      await sendHighPriorityEmail({
        to: normalizedEmail,
        subject: `${inviterName} invited you to join ${workspace?.name ?? "a workspace"} on CommissionKit`,
        html: invitationTemplate({
          inviterName,
          workspaceName: workspace?.name ?? "CommissionKit Workspace",
          role: "member", // Display purpose only for email
          acceptUrl: `${APP_URL}/accept-invite?workspaceId=${workspaceId}&email=${encodeURIComponent(normalizedEmail)}`,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        }),
        meta: { workspaceId, memberId: String(member._id), event: "workspace_invitation" },
      });
    } catch (err) {
      console.error("[Invite] Failed to enqueue invitation email:", err);
    }
  });

  res.status(201).json({ id: member._id, email: member.email, roleIds: member.roleIds, status: "pending" });
});

router.patch("/workspaces/:id/members/:memberId", ...requirePermission("team", "edit"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.params.id;
  const memberId = req.params.memberId;

  const { roleIds } = req.body as { roleIds?: string[] };
  if (!Array.isArray(roleIds)) {
    res.status(400).json({ error: "roleIds array is required" }); return;
  }

  const target = await WorkspaceMember.findOne({
    _id: new Types.ObjectId(memberId as string),
    workspaceId: new Types.ObjectId(workspaceId as string),
  });
  if (!target || target.role === "owner") {
    res.status(400).json({ error: "Cannot change the owner role" }); return;
  }

  target.roleIds = roleIds.map(id => new Types.ObjectId(id));
  await target.save();

  res.json({ id: target._id, email: target.email, roleIds: target.roleIds });
});

router.delete("/workspaces/:id/members/:memberId", ...requirePermission("team", "delete"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.params.id;
  const memberId = req.params.memberId;

  const target = await WorkspaceMember.findOne({
    _id: new Types.ObjectId(memberId as string),
    workspaceId: new Types.ObjectId(workspaceId as string),
  });
  if (!target) { res.status(404).json({ error: "Member not found" }); return; }

  const isSelf = target.userId === req.userId;
  // requirePermission handles the "owner/admin" check via the team:delete permission
  // but we still allow self-removal if the user is not the owner
  if (!isSelf && !req.permissions?.has("team:delete") && !req.permissions?.has("team:*") && !req.permissions?.has("*")) {
     res.status(403).json({ error: "Access denied" }); return;
  }
  
  if (target.role === "owner") { res.status(400).json({ error: "Cannot remove the workspace owner" }); return; }

  await WorkspaceMember.deleteOne({ _id: new Types.ObjectId(memberId as string) });
  res.status(204).send();
});

export default router;
