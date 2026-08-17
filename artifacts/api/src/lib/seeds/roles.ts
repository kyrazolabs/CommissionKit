import { Role, Workspace, WorkspaceMember } from "@workspace/db";
import { Types } from "mongoose";

export const SYSTEM_ROLES = {
  OWNER: "Owner",
  ADMIN: "Admin",
  MEMBER: "Member",
};

export const DEFAULT_ADMIN_PERMISSIONS = [
  "deals:*",
  "reps:*",
  "plans:*",
  "payouts:*",
  "reports:*",
  "disputes:*",
  "teams:*",
  "roles:*",
  "workspaces:*",
  "runs:*",
  "billing:*",
];

export const DEFAULT_MEMBER_PERMISSIONS = ["deals:read", "reports:read", "reps:read"];

/**
 * Seeds the system roles for a given workspace if they do not exist.
 * Also migrates any legacy WorkspaceMember records to use the new Role IDs.
 */
export async function seedWorkspaceRoles(workspaceId: string | Types.ObjectId) {
  const wsId = typeof workspaceId === "string" ? new Types.ObjectId(workspaceId) : workspaceId;

  // 1. Create or ensure System Roles exist
  const ownerRole = await Role.findOneAndUpdate(
    { workspaceId: wsId, name: SYSTEM_ROLES.OWNER, isSystem: true },
    { $setOnInsert: { description: "Full access to all resources", permissions: ["*"] } },
    { upsert: true, new: true },
  );

  const adminRole = await Role.findOneAndUpdate(
    { workspaceId: wsId, name: SYSTEM_ROLES.ADMIN, isSystem: true },
    {
      $setOnInsert: {
        description: "Administrative access to most resources",
        permissions: DEFAULT_ADMIN_PERMISSIONS,
      },
    },
    { upsert: true, new: true },
  );

  const memberRole = await Role.findOneAndUpdate(
    { workspaceId: wsId, name: SYSTEM_ROLES.MEMBER, isSystem: true },
    {
      $setOnInsert: {
        description: "Standard member access",
        permissions: DEFAULT_MEMBER_PERMISSIONS,
      },
    },
    { upsert: true, new: true },
  );

  // 2. Migrate legacy members who don't have roleIds set yet
  // We match users where `roleIds` does not exist or is empty
  const legacyMembers = await WorkspaceMember.find({
    workspaceId: wsId,
    $or: [{ roleIds: { $exists: false } }, { roleIds: { $size: 0 } }],
  });

  for (const member of legacyMembers) {
    let roleIdToAssign: Types.ObjectId | null = null;

    if (member.role === "owner") {
      roleIdToAssign = ownerRole._id;
    } else if (member.role === "admin") {
      roleIdToAssign = adminRole._id;
    } else {
      roleIdToAssign = memberRole._id;
    }

    if (roleIdToAssign) {
      await WorkspaceMember.updateOne({ _id: member._id }, { $push: { roleIds: roleIdToAssign } });
    }
  }

  return { ownerRole, adminRole, memberRole };
}
