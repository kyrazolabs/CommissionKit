import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useWorkspace } from "./use-workspace";

export const PLAN_LIMITS = {
  free: { reps: 3, plans: 1, members: 1 },
  starter: { reps: 10, plans: 3, members: 3 },
  growth: { reps: 30, plans: -1, members: 15 },
  pro: { reps: 100, plans: -1, members: 50 },
  flex: { reps: -1, plans: -1, members: -1 }, // Flex is effectively unlimited
};

export interface SubscriptionStatus {
  plan: "starter" | "growth" | "pro" | "flex" | "free";
  status: string;
  isLifetime: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  /** Add-on rep seats from Stripe (included in effective `limits.reps`). */
  extraRepSeats?: number;
  trialUsed: boolean;
}

export function useBillingStatus() {
  const { activeWorkspace } = useWorkspace();
  const [sub, setSub] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!activeWorkspace?.id) {
      setSub(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    apiFetch(`/api/billing/status`)
      .then((d) => setSub(d))
      .catch(() =>
        setSub({
          plan: "free",
          status: "active",
          isLifetime: false,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          extraRepSeats: 0,
          trialUsed: false,
        }),
      )
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id]);

  const isActive =
    sub?.isLifetime || ["active", "trialing", "past_due", "paused"].includes(sub?.status ?? "");
  const planType = isActive ? sub?.plan || "free" : "free";
  const planBaseLimits = PLAN_LIMITS[planType] || PLAN_LIMITS.free;
  const extra = isActive ? (sub?.extraRepSeats ?? 0) : 0;
  const limits = {
    ...planBaseLimits,
    reps: planBaseLimits.reps === -1 ? -1 : planBaseLimits.reps + extra,
  };

  const effectiveSub = sub
    ? {
        ...sub,
        plan: isActive ? sub.plan : "free",
        extraRepSeats: isActive ? (sub.extraRepSeats ?? 0) : 0,
      }
    : null;

  const refetch = useCallback(() => {
    if (!activeWorkspace?.id) return;
    setLoading(true);
    apiFetch(`/api/billing/status`)
      .then((d) => setSub(d))
      .catch(() =>
        setSub({
          plan: "free",
          status: "active",
          isLifetime: false,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          extraRepSeats: 0,
          trialUsed: false,
        }),
      )
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id]);

  return { sub: effectiveSub, loading, limits, planBaseLimits, refetch };
}
