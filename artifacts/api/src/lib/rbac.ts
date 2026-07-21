import { getRedisClient } from "@workspace/queue";
import { Role, WorkspaceMember } from "@workspace/db";
import { Types } from "mongoose";

const CACHE_TTL = 300; // 5 minutes

export async function getUserPermissions(workspaceId: string, userId: string): Promise<Set<string>> {
  const redis = getRedisClient();
  const cacheKey = `rbac:${workspaceId}:${userId}`;

  // 1. Check Redis Cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    try {
      const perms = JSON.parse(cached) as string[];
      return new Set(perms);
    } catch (e) {
      // ignore invalid cache
    }
  }

  // 2. Fetch from DB
  const member = await WorkspaceMember.findOne({
    workspaceId: new Types.ObjectId(workspaceId),
    userId,
  });

  if (!member) {
    return new Set<string>();
  }

  const permissions = new Set<string>();

  // Legacy fallback: if they only have the old `role` string, give them default permissions
  if (!member.roleIds || member.roleIds.length === 0) {
    const legacyRole = member.role || "member";
    if (legacyRole === "owner") {
      permissions.add("*");
    } else if (legacyRole === "admin") {
      const adminPerms = [
        "deals:*", "reps:*", "plans:*", "payouts:*", "reports:*", "analytics:*",
        "disputes:*", "team:*", "teams:*", "roles:*", "workspace:*", "workspaces:*",
        "calculations:*", "audit_log:*"
      ];
      adminPerms.forEach(p => permissions.add(p));
    } else {
      // member
      ["deals:read", "reports:read", "analytics:read", "reps:read"].forEach(p => permissions.add(p));
    }
  } else {
    // 3. Aggregate custom roles
    const roles = await Role.find({ _id: { $in: member.roleIds } });
    for (const role of roles) {
      if (role.permissions) {
        for (const p of role.permissions) {
          permissions.add(p);
        }
      }
    }
  }

  // 4. Cache and return
  const permsArray = Array.from(permissions);
  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(permsArray));

  return permissions;
}

export async function invalidateUserPermissions(workspaceId: string, userId: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`rbac:${workspaceId}:${userId}`);
}

export async function invalidateWorkspaceRoles(workspaceId: string): Promise<void> {
  const redis = getRedisClient();
  // We need to delete all cached RBAC for this workspace
  // Redis SCAN is best, but since workspaces usually have limited members, we can use a wildcard keys command
  // Warning: KEYS is slow on massive databases, but safe for standard SaaS sizes. 
  // Alternatively, we could store a namespace version key, but let's use SCAN for safety.
  
  const pattern = `rbac:${workspaceId}:*`;
  let cursor = "0";
  
  do {
    const [nextCursor, keys] = await redis.scan(cursor, "MATCH", pattern, "COUNT", 100);
    cursor = nextCursor;
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  } while (cursor !== "0");
}

/**
 * Validates if the given user permissions set satisfies the required resource and action.
 * Supports wildcard '*'.
 * Examples:
 * - hasPermission(['*'], 'deals', 'write') => true
 * - hasPermission(['deals:*'], 'deals', 'write') => true
 * - hasPermission(['deals:write'], 'deals', 'write') => true
 * - hasPermission(['deals:read'], 'deals', 'write') => false
 */
export function hasPermission(permissions: Set<string>, resource: string, action: string): boolean {
  if (permissions.has("*")) return true;
  if (permissions.has(`${resource}:*`)) return true;
  return permissions.has(`${resource}:${action}`);
}

/**
 * Finds all user IDs in a workspace who have a specific permission.
 * Useful for targeting notifications to "anyone who can manage disputes".
 */
export async function getUsersWithPermission(workspaceId: string, resource: string, action: string): Promise<string[]> {
  const members = await WorkspaceMember.find({ workspaceId: new Types.ObjectId(workspaceId) });
  const userIds: string[] = [];

  for (const member of members) {
    if (!member.userId) continue;

    const perms = await getUserPermissions(workspaceId, member.userId);
    if (hasPermission(perms, resource, action)) {
      userIds.push(member.userId);
    }
  }

  return userIds;
}
