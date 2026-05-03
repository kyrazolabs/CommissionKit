import type { Request, Response, NextFunction, RequestHandler } from "express";
import { supabase } from "../lib/supabase";
import { db, workspaceMembersTable } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  workspaceId?: number;
  workspaceRole?: "owner" | "admin" | "member";
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const authHeader = req.headers["authorization"];
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid Authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = data.user.id;
  req.userEmail = data.user.email;
  next();
}

const ROLE_LEVELS: Record<string, number> = { member: 0, admin: 1, owner: 2 };

/**
 * Returns an array of [requireAuth, workspaceMemberCheck] middleware.
 * Spread into route definitions: router.get('/path', ...requireWorkspaceMember('admin'), handler)
 *
 * Reads the active workspace from the X-Workspace-ID request header.
 * Validates that the authenticated user is a member with at least minRole.
 * Auto-accepts pending email invites on first access.
 * Sets req.workspaceId and req.workspaceRole on success.
 */
export function requireWorkspaceMember(
  minRole: "member" | "admin" | "owner" = "member",
): RequestHandler[] {
  const memberCheck: RequestHandler = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const raw = req.headers["x-workspace-id"];
    const workspaceId = parseInt(Array.isArray(raw) ? raw[0] : (raw ?? ""), 10);
    if (!workspaceId || isNaN(workspaceId)) {
      res.status(400).json({ error: "X-Workspace-ID header is required" });
      return;
    }

    const userId = req.userId!;
    const userEmail = req.userEmail ?? "";

    // Try to find the membership by userId
    let [member] = await db
      .select()
      .from(workspaceMembersTable)
      .where(
        and(
          eq(workspaceMembersTable.workspaceId, workspaceId),
          eq(workspaceMembersTable.userId, userId),
        ),
      )
      .limit(1);

    // If not found, check for a pending invite matching their email
    if (!member && userEmail) {
      const [pending] = await db
        .select()
        .from(workspaceMembersTable)
        .where(
          and(
            eq(workspaceMembersTable.workspaceId, workspaceId),
            isNull(workspaceMembersTable.userId),
            eq(workspaceMembersTable.email, userEmail),
          ),
        )
        .limit(1);

      if (pending) {
        // Auto-accept: link the pending invite to this user
        await db
          .update(workspaceMembersTable)
          .set({ userId })
          .where(eq(workspaceMembersTable.id, pending.id));
        member = { ...pending, userId };
      }
    }

    if (!member) {
      res.status(403).json({ error: "Access denied: not a member of this workspace" });
      return;
    }

    const role = member.role as "owner" | "admin" | "member";
    if ((ROLE_LEVELS[role] ?? -1) < ROLE_LEVELS[minRole]) {
      res.status(403).json({
        error: `This action requires ${minRole} role or higher (your role: ${role})`,
      });
      return;
    }

    req.workspaceId = workspaceId;
    req.workspaceRole = role;
    next();
  };

  return [requireAuth as RequestHandler, memberCheck];
}
