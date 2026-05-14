import type { Request, Response, NextFunction, RequestHandler } from "express";
import { auth } from "../lib/auth";
import { WorkspaceMember } from "@workspace/db";
import { Types } from "mongoose";

export interface AuthenticatedRequest extends Request {
  userId?: string;
  userEmail?: string;
  workspaceId?: string;
  workspaceRole?: "owner" | "admin" | "member";
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const session = await auth.api.getSession({
    headers: req.headers,
  });

  if (!session || !session.user) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  req.userId = session.user.id;
  req.userEmail = session.user.email;
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
    const workspaceId = Array.isArray(raw) ? raw[0] : (raw ?? "");
    if (!workspaceId) {
      res.status(400).json({ error: "X-Workspace-ID header is required" });
      return;
    }

    const userId = req.userId!;
    const userEmail = req.userEmail ?? "";

    // Try to find the membership by userId
    let member = await WorkspaceMember.findOne({
      workspaceId: new Types.ObjectId(workspaceId),
      userId,
    });

    // If not found, check for a pending invite matching their email
    if (!member && userEmail) {
      const pending = await WorkspaceMember.findOne({
        workspaceId: new Types.ObjectId(workspaceId),
        userId: null,
        email: userEmail,
      });

      if (pending) {
        // Auto-accept: link the pending invite to this user
        pending.userId = userId;
        await pending.save();
        member = pending;
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

/**
 * Middleware to ensure the workspace has a Growth plan or higher.
 * Exporting data is a premium feature.
 */
export async function requireGrowthPlan(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> {
  const { WorkspaceSubscription } = await import("@workspace/db");
  const workspaceId = req.workspaceId;

  if (!workspaceId) {
    res.status(400).json({ error: "X-Workspace-ID header is required" });
    return;
  }

  const sub = await WorkspaceSubscription.findOne({
    workspaceId: new Types.ObjectId(workspaceId),
  });

  const plan = sub?.plan || "free";
  const isGrowth = plan === "growth" || plan === "annual";
  const isLifetime = sub?.isLifetime || false;

  if (!isGrowth && !isLifetime) {
    res.status(403).json({
      error: "This feature requires a Growth subscription.",
      code: "SUBSCRIPTION_REQUIRED",
    });
    return;
  }

  next();
}
