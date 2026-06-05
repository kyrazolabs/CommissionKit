import { Router } from "express";
import { Role } from "@workspace/db";
import { Types } from "mongoose";
import { requirePermission, type AuthenticatedRequest } from "../../middleware/auth";
import { invalidateWorkspaceRoles } from "../../lib/rbac";
import { seedWorkspaceRoles } from "../../lib/seeds/roles";
import { z } from "zod";

const router = Router();

// Zod schemas for input validation
const CreateRoleBody = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  permissions: z.array(z.string()),
});

const UpdateRoleBody = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional(),
});

// GET all roles for the workspace
router.get("/roles", ...requirePermission("roles", "read"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  
  let roles = await Role.find({ workspaceId: new Types.ObjectId(workspaceId) })
    .sort({ isSystem: -1, name: 1 }); // System roles first
    
  if (roles.length === 0) {
    // Lazy seed for existing workspaces
    await seedWorkspaceRoles(workspaceId);
    roles = await Role.find({ workspaceId: new Types.ObjectId(workspaceId) })
      .sort({ isSystem: -1, name: 1 });
  }
    
  res.json(roles.map(r => ({
    id: r._id,
    name: r.name,
    description: r.description,
    isSystem: r.isSystem,
    permissions: r.permissions,
  })));
});

// POST create a custom role
router.post("/roles", ...requirePermission("roles", "create"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const body = CreateRoleBody.parse(req.body);

  // Check if role name already exists
  const existing = await Role.findOne({ 
    workspaceId: new Types.ObjectId(workspaceId), 
    name: { $regex: new RegExp(`^${body.name}$`, "i") } 
  });
  
  if (existing) {
    res.status(409).json({ error: "A role with this name already exists" });
    return;
  }

  const role = await Role.create({
    workspaceId: new Types.ObjectId(workspaceId),
    name: body.name,
    description: body.description || "",
    isSystem: false, // Custom roles are never system roles
    permissions: body.permissions,
  });

  res.status(201).json({
    id: role._id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.permissions,
  });
});

// PUT update a role
router.put("/roles/:id", ...requirePermission("roles", "edit"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const roleId = req.params.id;
  const body = UpdateRoleBody.parse(req.body);

  const role = await Role.findOne({ 
    _id: new Types.ObjectId(roleId as string),
    workspaceId: new Types.ObjectId(workspaceId) 
  });

  if (!role) {
    res.status(404).json({ error: "Role not found" });
    return;
  }

  if (role.isSystem) {
    // System roles can only have permissions updated if they are NOT the Owner role
    if (role.name === "Owner") {
      res.status(403).json({ error: "The Owner system role cannot be modified" });
      return;
    }
    // For Admin/Member, don't allow renaming
    if (body.name && body.name !== role.name) {
      res.status(403).json({ error: "Cannot rename a system role" });
      return;
    }
  }

  if (body.name && body.name !== role.name) {
    const existing = await Role.findOne({ 
      workspaceId: new Types.ObjectId(workspaceId), 
      name: { $regex: new RegExp(`^${body.name}$`, "i") } 
    });
    if (existing && existing._id.toString() !== role._id.toString()) {
      res.status(409).json({ error: "A role with this name already exists" });
      return;
    }
    role.name = body.name;
  }

  if (body.description !== undefined) role.description = body.description;
  if (body.permissions !== undefined) role.permissions = body.permissions;

  await role.save();

  // Invalidate cache for all members so the changes take effect immediately
  await invalidateWorkspaceRoles(workspaceId);

  res.json({
    id: role._id,
    name: role.name,
    description: role.description,
    isSystem: role.isSystem,
    permissions: role.permissions,
  });
});

// DELETE a custom role
router.delete("/roles/:id", ...requirePermission("roles", "delete"), async (req: AuthenticatedRequest, res): Promise<void> => {
  const workspaceId = req.workspaceId!;
  const roleId = req.params.id;

  const role = await Role.findOne({ 
    _id: new Types.ObjectId(roleId as string),
    workspaceId: new Types.ObjectId(workspaceId) 
  });

  if (!role) {
    res.status(404).json({ error: "Role not found" });
    return;
  }

  if (role.isSystem) {
    res.status(403).json({ error: "System roles cannot be deleted" });
    return;
  }

  await Role.deleteOne({ _id: role._id });
  
  // Note: WorkspaceMembers still referencing this roleId will safely ignore it
  await invalidateWorkspaceRoles(workspaceId);

  res.status(204).send();
});

export default router;
