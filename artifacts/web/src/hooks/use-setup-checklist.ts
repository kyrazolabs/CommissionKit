import { useState, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useListReps, useListPlans, useListDeals } from "@workspace/api-client-react";
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

export function useSetupChecklist(): UseSetupChecklistReturn {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const workspaceId = activeWorkspace?.id;

  // Query data for step completion
  const { data: repsData } = useListReps();
  const { data: plansData } = useListPlans();
  const { data: dealsData } = useListDeals();

  // Step completion status - derived from live data
  const steps = useMemo(() => ({
    reps: Array.isArray(repsData) && repsData.length > 0,
    plans: Array.isArray(plansData) && plansData.length > 0,
    deals: Array.isArray(dealsData) && dealsData.length > 0,
  }), [repsData, plansData, dealsData]);

  const completedCount = useMemo(() =>
    Object.values(steps).filter(Boolean).length
  , [steps]);

  const allComplete = completedCount === 3;

  // Onboarding state from database - source of truth
  const { checklistDismissed, checklistCompletedAt } = getOnboardingState(activeWorkspace);

  const isDismissed = checklistDismissed;
  const isCompleted = checklistCompletedAt !== null;

  // isVisible = NOT completed, NOT dismissed, NOT all complete
  const isVisible = !isCompleted && !isDismissed && !allComplete;

  const [isSeeding, setIsSeeding] = useState(false);

  const dismiss = useCallback(async () => {
    if (!workspaceId) return;
    await apiFetch(`/api/workspaces/${workspaceId}/onboarding`, {
      method: "PATCH",
      body: JSON.stringify({ action: "dismiss" }),
    });
    await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  }, [workspaceId, queryClient]);

  const complete = useCallback(async () => {
    if (!workspaceId) return;
    await apiFetch(`/api/workspaces/${workspaceId}/onboarding`, {
      method: "PATCH",
      body: JSON.stringify({ action: "complete" }),
    });
    await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  }, [workspaceId, queryClient]);

  const show = useCallback(async () => {
    if (!workspaceId) return;
    await apiFetch(`/api/workspaces/${workspaceId}/onboarding`, {
      method: "PATCH",
      body: JSON.stringify({ action: "show" }),
    });
    await queryClient.invalidateQueries({ queryKey: ["workspaces"] });
  }, [workspaceId, queryClient]);

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
    } finally {
      setIsSeeding(false);
    }
  }, [queryClient]);

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
