/**
 * Centralized plan limits configuration.
 */
export const PLAN_LIMITS = {
  free: {
    maxMembers: 1,
    maxReps: 3,
    maxPlans: 1,
  },
  lite: {
    maxMembers: 3,
    maxReps: 5,
    maxPlans: 2,
  },
  starter: {
    maxMembers: 3,
    maxReps: 10,
    maxPlans: 3,
  },
  growth: {
    maxMembers: 15,
    maxReps: 50,
    maxPlans: 1_000_000, // Unlimited
  },
  annual: {
    maxMembers: 15,
    maxReps: 50,
    maxPlans: 1_000_000, // Unlimited
  },
  flex: {
    maxMembers: 1000,
    maxReps: 1_000_000,
    maxPlans: 1000,
  },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

/**
 * Utility to get limits for a plan.
 */
export function getPlanLimits(plan: string = "free") {
  const p = (plan.toLowerCase() as PlanType) || "free";
  return PLAN_LIMITS[p] || PLAN_LIMITS.free;
}
