import { 
  WorkspaceSubscription, 
  WorkspaceMember, 
  Rep, 
  Plan, 
  getPlanLimits 
} from "@workspace/db";
import { Types } from "mongoose";

/**
 * Checks if the workspace can add more of a specific resource based on its plan.
 */
export async function checkLimits(
  workspaceId: string,
  resource: "members" | "reps" | "plans"
): Promise<{ allowed: boolean; limit: number; current: number }> {
  // 1. Get current plan
  const sub = await WorkspaceSubscription.findOne({ 
    workspaceId: new Types.ObjectId(workspaceId),
    status: { $in: ["active", "trialing", "past_due"] } // Allow past_due to keep current data but maybe block additions? 
                                                      // Usually SaaS allows past_due to have access but not add new stuff.
  });
  
  const plan = sub?.plan || "free";
  const limits = getPlanLimits(plan);

  let current = 0;
  let limit = 0;

  switch (resource) {
    case "members":
      current = await WorkspaceMember.countDocuments({ workspaceId: new Types.ObjectId(workspaceId) });
      limit = limits.maxMembers;
      break;
    case "reps":
      current = await Rep.countDocuments({ workspaceId: new Types.ObjectId(workspaceId) });
      limit = limits.maxReps;
      break;
    case "plans":
      current = await Plan.countDocuments({ workspaceId: new Types.ObjectId(workspaceId) });
      limit = limits.maxPlans;
      break;
  }

  // Large numbers (e.g. 1000) are treated as unlimited for practical purposes in this UI
  const allowed = current < limit;

  return { allowed, limit, current };
}
