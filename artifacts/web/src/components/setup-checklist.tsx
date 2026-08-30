import { CheckCircle, ChevronDown, ChevronUp, Circle, Minus, Play, X, Zap } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRole } from "@/hooks/use-role";
import { useSetupChecklist } from "@/hooks/use-setup-checklist";
import { toast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { cn } from "@/lib/utils";

const steps = [
  { key: "plans" as const, title: "Create a Commission Plan", href: "/dash/plans" },
  { key: "reps" as const, title: "Add Your Sales Reps", href: "/dash/reps" },
  { key: "deals" as const, title: "Import Deals", href: "/dash/deals" },
];

function StepRow({
  title,
  href,
  isComplete,
}: {
  title: string;
  href: string;
  isComplete: boolean;
}) {
  const [, setLocation] = useLocation();

  return (
    <button
      onClick={() => setLocation(href)}
      className={cn(
        "w-full flex items-center gap-2.5 py-2 px-1 rounded-md text-left transition-all duration-150",
        "hover:bg-accent/30 cursor-pointer",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
      )}
      role="link"
      aria-label={`Step: ${title} — ${isComplete ? "completed" : "not completed"}`}
    >
      <div className="shrink-0">
        {isComplete ? (
          <CheckCircle className="size-4 text-primary" />
        ) : (
          <Circle className="size-4 text-muted-foreground" />
        )}
      </div>
      <span
        className={cn(
          "flex-1 text-[13px] font-semibold transition-all duration-150",
          isComplete ? "text-muted-foreground line-through" : "text-foreground",
        )}
      >
        {title}
      </span>
      <ChevronDown className="size-3.5 text-muted-foreground shrink-0 -rotate-90" />
    </button>
  );
}

interface SetupChecklistProps {
  onShowGuide?: () => void;
}

export function SetupChecklist({ onShowGuide }: SetupChecklistProps) {
  // ── All hooks always called on every render ──────────────────────────────
  const {
    isVisible,
    isDismissed,
    isCompleted,
    steps: stepStatus,
    completedCount,
    allComplete,
    dismiss,
    complete,
    loadSampleData,
    show,
    isSeeding,
  } = useSetupChecklist();

  const { activeWorkspace } = useWorkspace();
  const { hasPermission } = useRole();
  const workspaceId = activeWorkspace?.id;

  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // ── Effects ──────────────────────────────────────────────────────────────

  // Reset minimize when workspace changes
  useEffect(() => {
    setIsCollapsed(false);
  }, [workspaceId]);

  // Load persisted minimize state
  useEffect(() => {
    if (!workspaceId) return;
    const stored = localStorage.getItem(`ck_checklist_minimized_${workspaceId}`);
    if (stored === "true") setIsCollapsed(true);
  }, [workspaceId]);

  // Persist minimize state
  useEffect(() => {
    if (!workspaceId) return;
    localStorage.setItem(`ck_checklist_minimized_${workspaceId}`, String(isCollapsed));
  }, [isCollapsed, workspaceId]);

  // All-complete: stamp the DB once and trigger exit animation. Fires any time
  // the data shows 3/3 but the DB hasn't been stamped yet — covers both the
  // 0→3 transition AND the case where the user lands on the dashboard with 3/3
  // already done (e.g. after running their first calculation in another tab).
  useEffect(() => {
    if (allComplete && !isCompleted) {
      complete();
      const timer = setTimeout(() => setIsExiting(true), 500);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [allComplete, isCompleted, complete]);

  // Reset exit state when hook re-reports visible state (e.g., user calls show())
  useEffect(() => {
    if (!isDismissed && !isCompleted) {
      setIsExiting(false);
    }
  }, [isDismissed, isCompleted]);

  // ── Derived state ─────────────────────────────────────────────────────────
  // Defense in depth: if the DB-sync ever regresses again, hide the card the
  // moment the data confirms all 3 steps are done. The hook's `isVisible`
  // already accounts for this, but the component should not depend solely on
  // a downstream consumer of the hook return value.
  const shouldRender = !!workspaceId && !isCompleted && !isDismissed && !allComplete;
  const progressPercent = (completedCount / 3) * 100;

  // Clean up stale localStorage minimize state when hidden
  useEffect(() => {
    if (!shouldRender && workspaceId) {
      localStorage.removeItem(`ck_checklist_minimized_${workspaceId}`);
    }
  }, [shouldRender, workspaceId]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleLoadSampleData = useCallback(() => {
    setShowConfirmDialog(true);
  }, []);

  const handleConfirmLoad = useCallback(async () => {
    try {
      await loadSampleData();
      toast({ title: "Sample data loaded", description: "Explore your workspace!" });
      await dismiss();
    } catch (err: any) {
      toast({
        title: "Failed to load sample data",
        description: err.message || "Please try again.",
        variant: "destructive",
      });
    }
  }, [loadSampleData, dismiss]);

  // X icon button: opens the confirmation dialog. The actual dismiss happens
  // in handleConfirmClose after the user confirms.
  const handleDismiss = useCallback(() => {
    setShowCloseConfirm(true);
  }, []);

  // Footer "Skip Onboarding" button: also opens the same dialog (same handler),
  // but the dialog copy makes the action's permanent effect explicit.
  const handleConfirmClose = useCallback(async () => {
    setShowCloseConfirm(false);
    setIsExiting(true);
    setTimeout(async () => {
      await dismiss();
    }, 200);
  }, [dismiss]);

  const handleToggleCollapse = () => setIsCollapsed((p) => !p);
  const [, setLocation] = useLocation();

  // ═══════════════════════════════════════════════════════════════════════════
  // Render — single element, collapsed/expanded transition on border-radius
  // ═══════════════════════════════════════════════════════════════════════════
  if (!shouldRender) return null;

  return (
    <>
      <div
        className={cn(
          "fixed bottom-0 right-0 sm:bottom-6 sm:right-6 z-50 w-full sm:max-w-105 border border-card-border bg-card shadow-lg overflow-hidden",
          "transition-all duration-300 rounded-t-xl sm:rounded-xl",
          isExiting && "animate-[ckExit_200ms_ease-in_forwards]",
        )}
        style={{ boxShadow: "var(--shadow-card)" }}
        role="region"
        aria-label="Setup checklist"
      >
        {/* Header / Pill content */}
        <div
          className={cn(
            "flex items-center justify-between",
            isCollapsed ? "px-3.5 py-2 gap-2" : "px-4 py-2.5",
          )}
        >
          <div className="flex items-center gap-2">
            <CheckCircle
              className={cn(
                "text-primary shrink-0",
                isCollapsed ? "size-3.5" : "size-4",
                allComplete && "text-emerald-500",
              )}
            />
            {isCollapsed ? (
              <>
                <span className="text-[12px] font-semibold tabular-nums text-foreground">
                  {completedCount}/3
                </span>
                {allComplete ? (
                  <span className="text-[12px] font-semibold text-emerald-600 dark:text-emerald-400">
                    All done!
                  </span>
                ) : completedCount === 0 ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowConfirmDialog(true);
                    }}
                    className="flex items-center gap-1 text-[12px] font-semibold text-foreground rounded-full px-2 py-0.5 ring-1 ring-primary/30 hover:bg-accent/30"
                    aria-label="Load sample data"
                  >
                    <Zap className="size-3" />
                    <span>Load Sample Data</span>
                  </button>
                ) : (
                  (() => {
                    const firstIncomplete = steps.find((s) => !stepStatus[s.key]);
                    return firstIncomplete ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setLocation(firstIncomplete.href);
                        }}
                        className="flex items-center gap-1 text-sm font-semibold text-foreground rounded-full px-2 py-0.5 hover:bg-accent/30"
                        aria-label={firstIncomplete.title}
                      >
                        <Zap className="size-3" />
                        {firstIncomplete.title}
                      </button>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowConfirmDialog(true);
                        }}
                        className="flex items-center gap-1 text-[12px] font-semibold text-foreground rounded-full px-2 py-0.5 ring-1 ring-primary/30 hover:bg-accent/30"
                        aria-label="Load sample data"
                      >
                        <Zap className="size-3" />
                        <span>Load Sample Data</span>
                      </button>
                    );
                  })()
                )}
              </>
            ) : (
              <h2 className="text-[15px] font-bold tracking-tight text-foreground">
                {allComplete ? "Setup Complete" : "Get Started"}
              </h2>
            )}
          </div>
          {!isCollapsed && (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleCollapse}
                className="size-7 rounded-md"
                aria-label="Minimize checklist"
              >
                <Minus className="size-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
                className="size-7 rounded-md"
                aria-label="Close checklist"
              >
                <X className="size-3.5" />
              </Button>
            </div>
          )}
          {isCollapsed && (
            <button
              onClick={handleToggleCollapse}
              className="flex items-center gap-1 p-1 rounded-md hover:bg-accent/30 cursor-pointer"
              aria-label={`Setup checklist: ${completedCount} of 3 complete. Click to expand.`}
            >
              <ChevronUp className="size-3.5 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Body — hidden when collapsed */}
        <div
          className={cn(
            "transition-all duration-300 overflow-hidden",
            isCollapsed ? "max-h-0 opacity-0" : "max-h-[500px] opacity-100",
          )}
        >
          {allComplete ? (
            <div className="px-4 py-5 text-center">
              <div className="flex items-center justify-center size-10 rounded-full bg-emerald-100 dark:bg-emerald-900/20 mx-auto mb-3">
                <CheckCircle className="size-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="text-[13px] font-semibold text-foreground mb-2">You are all set!</p>
              <p className="text-[12px] text-muted-foreground">
                Your workspace is ready. Start managing commissions, running calculations, and
                tracking payouts.
              </p>
              {hasPermission("calculations", "create") && (
                <Button
                  variant="default"
                  size="sm"
                  className="mt-3 gap-2"
                  onClick={() => setLocation("/dash/runs")}
                >
                  <Play className="size-3.5" />
                  Run Your First Commission
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Progress */}
              <div className="px-4 pb-2">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[11px] font-medium text-muted-foreground tabular-nums">
                    {completedCount === 0
                      ? "3 steps to your first commission run"
                      : completedCount === 3
                        ? "3/3 complete"
                        : `${completedCount}/3 complete`}
                  </p>
                </div>
                <div
                  className="h-1.5 rounded-full bg-muted overflow-hidden"
                  role="progressbar"
                  aria-valuenow={completedCount}
                  aria-valuemin={0}
                  aria-valuemax={3}
                >
                  <div
                    className={cn(
                      "h-full rounded-full bg-primary transition-all duration-300 ease-out",
                      completedCount === 3 && "animate-[ckPulse_500ms_ease-in-out]",
                    )}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Step rows */}
              <div className="px-3 pb-1">
                {steps.map((step) => (
                  <StepRow
                    key={step.key}
                    title={step.title}
                    href={step.href}
                    isComplete={stepStatus[step.key]}
                  />
                ))}
              </div>

              {/* Load Sample Data */}
              <div className="px-3 pb-1">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setShowConfirmDialog(true)}
                      disabled={isSeeding}
                      className={cn(
                        "w-full flex items-center gap-2 py-2 px-4 rounded-md text-left transition-all duration-150",
                        "hover:bg-accent/30 cursor-pointer",
                        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        completedCount === 0 && "ring-1 ring-primary/30",
                      )}
                    >
                      <div className="shrink-0">
                        {isSeeding ? (
                          <Spinner className="size-3.5 text-primary" />
                        ) : (
                          <Zap className="size-3.5 text-primary" />
                        )}
                      </div>
                      <span className="text-[13px] font-semibold text-foreground flex-1">
                        {isSeeding ? "Loading..." : "Load Sample Data"}
                      </span>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>See the product in action with demo data</TooltipContent>
                </Tooltip>
              </div>

              {/* Footer */}
              <div className="px-4 py-2 flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDismiss}
                  className="text-xs text-muted-foreground font-medium"
                >
                  {allComplete ? "Dismiss" : "Skip for now"}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        title="Load Sample Data"
        description="This will add sample reps, a commission plan, and 18 deals to your workspace. You can remove them later from Settings."
        confirmLabel="Load Sample Data"
        cancelLabel="Cancel"
        variant="default"
        onConfirm={handleConfirmLoad}
        loading={isSeeding}
      />

      <ConfirmDialog
        open={showCloseConfirm}
        onOpenChange={setShowCloseConfirm}
        title="Close setup checklist?"
        description="You'll need to reopen it from Settings if you want to come back."
        confirmLabel="Close checklist"
        cancelLabel="Keep open"
        variant="default"
        onConfirm={handleConfirmClose}
      />

      <style>{`
        @keyframes ckPulse {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(1.02); }
        }
        @keyframes ckExit {
          0% { opacity: 1; transform: translateY(0); }
          100% { opacity: 0; transform: translateY(8px); }
        }
      `}</style>
    </>
  );
}
