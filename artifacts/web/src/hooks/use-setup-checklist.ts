import { useQueryClient } from "@tanstack/react-query";
import { useListDeals, useListPlans, useListReps } from "@workspace/api-client-react";
import { useCallback, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useWorkspace } from "./use-workspace";

interface UseSetupChecklistReturn {
  isVisible: boolean;
  isDismissed: boolean;
  isCompleted: boolean;
  steps: {
    reps: boolean;
    plans: boolean;
    deals: boolean;
  };
  completedCount: number;
  allComplete: boolean;
  dismiss: () => Promise<void>;
  complete: () => Promise<void>;
  loadSampleData: () => Promise<void>;
  show: () => Promise<void>;
  isSeeding: boolean;
}

function getOnboardingState(workspace: ReturnType<typeof useWorkspace>["activeWorkspace"]) {
  if (!workspace) {
    return { checklistDismissed: false, checklistCompletedAt: null as string | null };
  }
  return {
    checklistDismissed: workspace.onboarding?.checklistDismissed ?? false,
    checklistCompletedAt: workspace.onboarding?.checklistCompletedAt ?? null,
  };
}

function countItems(data: unknown): number {
  if (Array.isArray(data)) {
    return data.length;
  }
  if (data && typeof data === "object" && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: unknown[] }).data.length;
  }
  return 0;
}

export function useSetupChecklist(): UseSetupChecklistReturn {
  const { activeWorkspace, refreshWorkspaces } = useWorkspace();
  const queryClient = useQueryClient();
  const workspaceId = activeWorkspace?.id;
  // The checklist is only relevant for the standard commission engine. AISSOL
  // (and any future enterprise engines) have their own project/invoice flows
  // that don't map to "Add Reps / Create Plan / Import Deals".
  const isStandardEngine =
    !activeWorkspace?.commissionEngine || activeWorkspace.commissionEngine === "standard";

  // Query data for step completion
  const { data: repsData } = useListReps();
  const { data: plansData } = useListPlans();
  const { data: dealsData } = useListDeals();

  // Step completion status - derived from live data
  const steps = useMemo(
    () => ({
      reps: countItems(repsData) > 0,
      plans: countItems(plansData) > 0,
      deals: countItems(dealsData) > 0,
    }),
    [repsData, plansData, dealsData],
  );

  const completedCount = useMemo(() => Object.values(steps).filter(Boolean).length, [steps]);

  const allComplete = completedCount === 3;

  // Onboarding state from database - source of truth
  const { checklistDismissed, checklistCompletedAt } = getOnboardingState(activeWorkspace);

  const isDismissed = checklistDismissed;
  const isCompleted = checklistCompletedAt !== null;

  // isVisible: standard engine AND not finished AND not dismissed AND not all data done
  const isVisible = isStandardEngine && !isCompleted && !isDismissed && !allComplete;

  const [isSeeding, setIsSeeding] = useState(false);

  // After any onboarding state mutation, refetch the active workspace so the
  // in-memory `activeWorkspace.onboarding` reflects the DB. `useWorkspace` does
  // not use React Query, so `invalidateQueries(["workspaces"])` was a no-op.
  const syncWorkspace = useCallback(async () => {
    await refreshWorkspaces();
  }, [refreshWorkspaces]);

  const dismiss = useCallback(async () => {
    if (!workspaceId) return;
    await apiFetch(`/api/workspaces/${workspaceId}/onboarding`, {
      method: "PATCH",
      body: JSON.stringify({ action: "dismiss" }),
    });
    await syncWorkspace();
  }, [workspaceId, syncWorkspace]);

  const complete = useCallback(async () => {
    if (!workspaceId) return;
    await apiFetch(`/api/workspaces/${workspaceId}/onboarding`, {
      method: "PATCH",
      body: JSON.stringify({ action: "complete" }),
    });
    await syncWorkspace();
  }, [workspaceId, syncWorkspace]);

  const show = useCallback(async () => {
    if (!workspaceId) return;
    await apiFetch(`/api/workspaces/${workspaceId}/onboarding`, {
      method: "PATCH",
      body: JSON.stringify({ action: "show" }),
    });
    await syncWorkspace();
  }, [workspaceId, syncWorkspace]);

  const loadSampleData = useCallback(async () => {
    setIsSeeding(true);
    try {
      await apiFetch("/api/workspace/sample-data", { method: "POST" });
      // Invalidate all relevant query caches using the generated TanStack Query keys
      await queryClient.invalidateQueries({ queryKey: ["/api/reps"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/plans"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/deals"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/runs"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/dashboard/summary"] });
      // The sample-data route also stamps onboarding.checklistCompletedAt
      // server-side, so refetch the workspace to pick it up.
      await syncWorkspace();
    } finally {
      setIsSeeding(false);
    }
  }, [queryClient, syncWorkspace]);

  return {
    isVisible,
    isDismissed,
    isCompleted,
    steps,
    completedCount,
    allComplete,
    dismiss,
    complete,
    loadSampleData,
    show,
    isSeeding,
  };
}
