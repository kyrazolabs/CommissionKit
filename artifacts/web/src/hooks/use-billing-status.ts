import { useEffect, useState } from "react";
import { useWorkspace } from "./use-workspace";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

export const PLAN_LIMITS = {
  free: { reps: 3, plans: 1, members: 1 },
  starter: { reps: 10, plans: 3, members: 3 },
  growth: { reps: 50, plans: -1, members: 15 },
  annual: { reps: 50, plans: -1, members: 15 },
  flex: { reps: -1, plans: -1, members: -1 }, // Flex is per-rep, effectively unlimited
};

export interface SubscriptionStatus {
  plan: "starter" | "growth" | "flex" | "annual" | "free";
  status: string;
  isLifetime: boolean;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
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
    fetch(`${API_URL}/api/billing/status`, {
      credentials: "include",
      headers: { "x-workspace-id": activeWorkspace.id },
    })
      .then((r) => r.json())
      .then((d) => setSub(d))
      .catch(() =>
        setSub({
          plan: "free",
          status: "active",
          isLifetime: false,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        })
      )
      .finally(() => setLoading(false));
  }, [activeWorkspace?.id]);

  const planType = sub?.plan || "free";
  const limits = PLAN_LIMITS[planType] || PLAN_LIMITS.free;

  return { sub, loading, limits };
}
