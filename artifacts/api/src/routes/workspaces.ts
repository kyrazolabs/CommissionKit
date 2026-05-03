import { Router } from "express";
import { db, workspacesTable, workspaceMembersTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";

const router = Router();

const ADMIN_ROLES = ["owner", "admin"];

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

async function getMembership(workspaceId: number, userId: string) {
  const [m] = await db
    .select()
    .from(workspaceMembersTable)
    .where(
      and(
        eq(workspaceMembersTable.workspaceId, workspaceId),
        eq(workspaceMembersTable.userId, userId)
      )
    );
  return m ?? null;
}

router.get("/workspaces", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const userId = req.userId!;
  const userEmail = req.userEmail ?? "";

  // Auto-accept pending invites for this email
  if (userEmail) {
    await db
      .update(workspaceMembersTable)
      .set({ userId })
      .where(
        and(isNull(workspaceMembersTable.userId), eq(workspaceMembersTable.email, userEmail))
      );
  }

  const memberships = await db
    .select({
      id: workspacesTable.id,
      slug: workspacesTable.slug,
      name: workspacesTable.name,
      createdAt: workspacesTable.createdAt,
      role: workspaceMembersTable.role,
    })
    .from(workspaceMembersTable)
    .innerJoin(workspacesTable, eq(workspaceMembersTable.workspaceId, workspacesTable.id))
    .where(eq(workspaceMembersTable.userId, userId))
    .orderBy(workspacesTable.name);

  res.json(
    memberships.map((m) => ({
      id: m.id,
      slug: m.slug,
      name: m.name,
      role: m.role,
      createdAt: m.createdAt.toISOString(),
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
    const [existing] = await db
      .select({ id: workspacesTable.id })
      .from(workspacesTable)
      .where(eq(workspacesTable.slug, slug));
    if (!existing) break;
    slug = `${baseSlug}-${i}`;
  }

  const [workspace] = await db
    .insert(workspacesTable)
    .values({ slug, name: name.trim(), ownerId: userId })
    .returning();

  await db.insert(workspaceMembersTable).values({
    workspaceId: workspace.id,
    userId,
    email: userEmail,
    role: "owner",
  });

  res.status(201).json({
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    role: "owner",
    createdAt: workspace.createdAt.toISOString(),
  });
});

router.get("/workspaces/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = parseInt(req.params.id, 10);
  const membership = await getMembership(workspaceId, req.userId!);
  if (!membership) { res.status(403).json({ error: "Not a member of this workspace" }); return; }

  const [workspace] = await db.select().from(workspacesTable).where(eq(workspacesTable.id, workspaceId));
  if (!workspace) { res.status(404).json({ error: "Workspace not found" }); return; }

  const members = await db
    .select()
    .from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.workspaceId, workspaceId))
    .orderBy(workspaceMembersTable.createdAt);

  res.json({
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    role: membership.role,
    createdAt: workspace.createdAt.toISOString(),
    members: members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.email,
      role: m.role,
      status: m.userId ? "active" : "pending",
      createdAt: m.createdAt.toISOString(),
    })),
  });
});

router.put("/workspaces/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = parseInt(req.params.id, 10);
  const membership = await getMembership(workspaceId, req.userId!);
  if (!membership || !ADMIN_ROLES.includes(membership.role)) {
    res.status(403).json({ error: "Requires admin role or higher" }); return;
  }

  const { name } = req.body as { name?: string };
  if (!name?.trim()) { res.status(400).json({ error: "Name is required" }); return; }

  const [updated] = await db
    .update(workspacesTable)
    .set({ name: name.trim() })
    .where(eq(workspacesTable.id, workspaceId))
    .returning();

  res.json({ id: updated.id, slug: updated.slug, name: updated.name, role: membership.role });
});

router.delete("/workspaces/:id", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = parseInt(req.params.id, 10);
  const membership = await getMembership(workspaceId, req.userId!);
  if (membership?.role !== "owner") {
    res.status(403).json({ error: "Only the owner can delete a workspace" }); return;
  }

  await db.delete(workspaceMembersTable).where(eq(workspaceMembersTable.workspaceId, workspaceId));
  await db.delete(workspacesTable).where(eq(workspacesTable.id, workspaceId));
  res.status(204).send();
});

router.get("/workspaces/:id/members", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = parseInt(req.params.id, 10);
  const membership = await getMembership(workspaceId, req.userId!);
  if (!membership) { res.status(403).json({ error: "Not a member" }); return; }

  const members = await db
    .select()
    .from(workspaceMembersTable)
    .where(eq(workspaceMembersTable.workspaceId, workspaceId))
    .orderBy(workspaceMembersTable.createdAt);

  res.json(
    members.map((m) => ({
      id: m.id,
      userId: m.userId,
      email: m.email,
      role: m.role,
      status: m.userId ? "active" : "pending",
      createdAt: m.createdAt.toISOString(),
    }))
  );
});

router.post("/workspaces/:id/members/invite", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = parseInt(req.params.id, 10);
  const membership = await getMembership(workspaceId, req.userId!);
  if (!membership || !ADMIN_ROLES.includes(membership.role)) {
    res.status(403).json({ error: "Requires admin role or higher" }); return;
  }

  const { email, role = "member" } = req.body as { email?: string; role?: string };
  if (!email?.trim()) { res.status(400).json({ error: "Email is required" }); return; }
  if (!["admin", "member"].includes(role)) { res.status(400).json({ error: "Role must be admin or member" }); return; }

  const normalizedEmail = email.toLowerCase().trim();
  const [existing] = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.workspaceId, workspaceId), eq(workspaceMembersTable.email, normalizedEmail)));
  if (existing) { res.status(409).json({ error: "This person is already a member or has a pending invite" }); return; }

  const [member] = await db
    .insert(workspaceMembersTable)
    .values({ workspaceId, userId: null, email: normalizedEmail, role })
    .returning();

  res.status(201).json({ id: member.id, email: member.email, role: member.role, status: "pending" });
});

router.patch("/workspaces/:id/members/:memberId", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = parseInt(req.params.id, 10);
  const memberId = parseInt(req.params.memberId, 10);
  const callerMembership = await getMembership(workspaceId, req.userId!);
  if (callerMembership?.role !== "owner") {
    res.status(403).json({ error: "Only the owner can change member roles" }); return;
  }

  const { role } = req.body as { role?: string };
  if (!["admin", "member"].includes(role ?? "")) {
    res.status(400).json({ error: "Role must be admin or member" }); return;
  }

  const [target] = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.id, memberId), eq(workspaceMembersTable.workspaceId, workspaceId)));
  if (!target || target.role === "owner") {
    res.status(400).json({ error: "Cannot change the owner role" }); return;
  }

  const [updated] = await db
    .update(workspaceMembersTable)
    .set({ role: role! })
    .where(eq(workspaceMembersTable.id, memberId))
    .returning();

  res.json({ id: updated.id, email: updated.email, role: updated.role });
});

router.delete("/workspaces/:id/members/:memberId", requireAuth, async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = parseInt(req.params.id, 10);
  const memberId = parseInt(req.params.memberId, 10);
  const callerMembership = await getMembership(workspaceId, req.userId!);

  const [target] = await db
    .select()
    .from(workspaceMembersTable)
    .where(and(eq(workspaceMembersTable.id, memberId), eq(workspaceMembersTable.workspaceId, workspaceId)));
  if (!target) { res.status(404).json({ error: "Member not found" }); return; }

  const isSelf = target.userId === req.userId;
  const isAdminOrOwner = callerMembership && ADMIN_ROLES.includes(callerMembership.role);
  if (!isSelf && !isAdminOrOwner) { res.status(403).json({ error: "Access denied" }); return; }
  if (target.role === "owner") { res.status(400).json({ error: "Cannot remove the workspace owner" }); return; }

  await db.delete(workspaceMembersTable).where(eq(workspaceMembersTable.id, memberId));
  res.status(204).send();
});

export default router;
