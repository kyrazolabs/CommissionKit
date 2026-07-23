import { formatCurrency, formatNumber } from "@/lib/format";
import { useGetDashboardSummary, useGetReports, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DollarSign, Users, Briefcase, Activity,
  ArrowUpRight, TrendingUp, Zap, Play, CheckCircle2, Loader2, AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { HelpTooltip } from "@/components/help-tooltip";
import { RepAvatar } from "@/components/rep-avatar";
import { RunCalculationDialog } from "@/components/run-calculation-dialog";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { useTranslation } from "react-i18next";
import { SetupChecklist } from "@/components/setup-checklist";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useTableSort } from "@/hooks/use-table-sort";
import { StatCard } from "@/components/stat-card";
import { SortableTableHead } from "@/components/sortable-table-head";
import { RevenueTrendChart } from "@/components/revenue-trend-chart";
import { useFeedbackPrompt } from "@/components/feedback-dialog";

export function Dashboard() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("dashboard.title"),
    description: "Overview of your workspace commissions and performance.",
    keywords: "commission dashboard, sales performance, rep earnings overview, commission summary",
    robots: "noindex, nofollow"
  });
  const { activeWorkspace } = useWorkspace();
  const { hasPermission, isLoading: roleLoading } = useRole();
  const { banner: feedbackBanner, dialog: feedbackDialog } = useFeedbackPrompt();

  const currency = activeWorkspace?.currency || "USD";
  const currentPeriod = format(new Date(), "yyyy-MM");

  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary(
    { query: { queryKey: [...getGetDashboardSummaryQueryKey(), activeWorkspace?.id] } }
  );

  const { data: reportData, isLoading: reportLoading } = useGetReports(
    {},
    { query: { queryKey: ["reports", activeWorkspace?.id] } }
  );

  // All hooks and derived values must be called before any early returns
  const repEarnings = summary?.repEarnings ?? [];
  const recentRuns = (summary?.recentRuns ?? []).slice(0, 3);
  const monthlyTrends = reportData?.monthlyTrends ?? [];

  const { sort, getSortHandler, sortedData } = useTableSort<"name" | "plan" | "deals" | "revenue" | "commission">("commission", "desc");
  const sortedRepEarnings = sortedData(repEarnings, (rep, col) => {
    switch (col) {
      case "name": return rep.repName;
      case "deals": return rep.totalDeals;
      case "revenue": return rep.totalRevenue;
      case "commission": return rep.totalCommission;
      case "plan": return (rep as any).planName || "";
      default: return "";
    }
  });

  if (summaryLoading || roleLoading || reportLoading) return <DashboardSkeleton />;

  if (!summary || (summary as any).error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Activity className="size-10 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">{t("dashboard.noDataYet")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("dashboard.importDealsToGetStarted")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Page header */}
      <div>
        <p className="text-[12px] font-semibold text-primary mb-1">{t("dashboard.overview")}</p>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">{t("dashboard.title")}</h1>
        <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">
          {t("dashboard.commissionPerformanceFor", { period: format(new Date(currentPeriod + "-01"), "MMMM yyyy") })}
        </p>
      </div>

      {/* Setup checklist for new workspaces */}
      <SetupChecklist />

      {/* Feedback prompt */}
      {feedbackBanner}

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <StatCard
          label={t("dashboard.totalCommissions")}
          value={formatCurrency(summary.totalCommission, currency)}
          icon={DollarSign}
          tooltip={t("dashboard.totalCommissionsTooltip")}
          trendLabel={t("dashboard.thisPeriod")}
        />
        <StatCard
          label={t("dashboard.pipelineRevenue")}
          value={formatCurrency(summary.totalRevenue, currency)}
          icon={TrendingUp}
          tooltip={t("dashboard.pipelineRevenueTooltip")}
          trendLabel={t("dashboard.closedWonDeals")}
        />
        <StatCard
          label={t("dashboard.dealsClosed")}
          value={formatNumber(summary.totalDeals)}
          icon={Briefcase}
          tooltip={t("dashboard.dealsClosedTooltip")}
          trendLabel={t("dashboard.thisPeriod")}
        />
        <StatCard
          label={t("dashboard.activeReps")}
          value={formatNumber(summary.totalReps)}
          icon={Users}
          tooltip={t("dashboard.activeRepsTooltip")}
          trendLabel={t("dashboard.thisPeriod")}
        />
      </div>

      {/* Revenue trend chart (last 6 months) */}
      <div className="bg-card border border-card-border rounded-xl px-5 py-5" style={{ boxShadow: "var(--shadow-card)" }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-1.5">
              <p className="text-[14.5px] font-semibold text-foreground">{t("dashboard.revenueTrend")}</p>
              <HelpTooltip content={t("dashboard.revenueTrendTooltip")} />
            </div>
            <p className="text-[12px] text-muted-foreground mt-0.5">{t("dashboard.last6Months")}</p>
          </div>
        </div>
        <RevenueTrendChart data={monthlyTrends} currency={currency} />
      </div>

      {/* Lower grid: earners table (3fr) + right column (2fr) */}
      <div className="grid gap-5" style={{ gridTemplateColumns: "3fr 2fr" }}>

        {/* Top Earners : sortable table */}
        <div className="bg-card border border-card-border rounded-xl overflow-auto" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between px-[22px] py-[18px] border-b border-border">
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[14.5px] font-semibold text-foreground">{t("dashboard.topEarners")}</p>
                <HelpTooltip content={t("dashboard.topEarnersTooltip")} />
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">{t("dashboard.rankedByCommissionEarned")}</p>
            </div>
            <Link href="/dash/reps" className="flex items-center gap-1 text-[12px] font-semibold text-primary hover:opacity-80 transition-opacity">
              {t("common.viewAll")} <ArrowUpRight className="size-3" />
            </Link>
          </div>

          {sortedRepEarnings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noDealsClosedYet")}</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b border-border">
                  <SortableTableHead
                    label={t("dashboard.rep")}
                    column="name"
                    sortColumn={sort.column}
                    sortDirection={sort.direction}
                    onSort={getSortHandler}
                    className="pl-[22px] pr-3"
                  />
                  <SortableTableHead
                    label={t("dashboard.plan")}
                    column="plan"
                    sortColumn={sort.column}
                    sortDirection={sort.direction}
                    onSort={getSortHandler}
                  />
                  <SortableTableHead
                    label={t("dashboard.deals")}
                    column="deals"
                    sortColumn={sort.column}
                    sortDirection={sort.direction}
                    onSort={getSortHandler}
                    align="center"
                  />
                  <SortableTableHead
                    label={t("dashboard.revenue")}
                    column="revenue"
                    sortColumn={sort.column}
                    sortDirection={sort.direction}
                    onSort={getSortHandler}
                    align="right"
                  />
                  <SortableTableHead
                    label={t("dashboard.commission")}
                    column="commission"
                    sortColumn={sort.column}
                    sortDirection={sort.direction}
                    onSort={getSortHandler}
                    align="right"
                    className="pl-3 pr-[22px]"
                  />
                </tr>
              </thead>
              <tbody>
                {sortedRepEarnings.map((rep, i) => {
                  const isTop3 = i < 3;
                  return (
                    <tr
                      key={rep.repId}
                      className="border-b border-border last:border-0 hover:bg-muted/40 transition-colors"
                    >
                      <td className="pl-[22px] pr-3 py-2">
                        <div className="flex items-center gap-3">
                          {isTop3 && (
                            <div
                              className={`flex items-center justify-center size-5 rounded-full font-bold text-[10px] shrink-0 ${
                                i === 0
                                  ? "bg-primary text-primary-foreground"
                                  : i === 1
                                    ? "bg-secondary-foreground/20 text-foreground"
                                    : "bg-secondary-foreground/10 text-muted-foreground"
                              }`}
                            >
                              {i + 1}
                            </div>
                          )}
                          <RepAvatar
                            name={rep.repName}
                            size={32}
                            className={`shrink-0 rounded-full ${i === 0 ? "ring-2 ring-primary/30" : ""}`}
                          />
                          <Link
                            href={`/dash/reps/${rep.repId}`}
                            className="text-[13.5px] font-semibold text-foreground hover:text-primary transition-colors truncate"
                          >
                            {rep.repName}
                          </Link>
                        </div>
                      </td>
                      <td className="px-3 py-2">
                        <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground truncate">
                          {(rep as any).planName || t("dashboard.none")}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-[13px] font-medium text-foreground text-center tabular-nums">
                        {rep.totalDeals}
                      </td>
                      <td className="px-3 py-2 text-[13px] font-medium text-foreground text-right tabular-nums">
                        {formatCurrency(rep.totalRevenue, currency)}
                      </td>
                      <td className="pl-3 pr-[22px] py-2 text-[13.5px] font-semibold text-primary text-right tabular-nums">
                        {formatCurrency(rep.totalCommission, currency)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Quick action */}
          {hasPermission && hasPermission("calculations", "create") && (
            <div
              className="rounded-xl border border-card-border bg-card px-[22px] py-5"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div className="flex items-center gap-2 mb-2.5">
                <Zap className="size-4 text-primary" />
                <p className="text-[14px] font-semibold text-foreground">{t("dashboard.runCalculation")}</p>
              </div>
              <p className="text-[12.5px] text-muted-foreground leading-relaxed mb-4">
                {t("dashboard.runCalculationDescription")}</p>
              <RunCalculationDialog
                isProcessing={recentRuns.some((r: any) => r.status === "pending" || r.status === "processing")}
                trigger={
                  <Button className="w-full rounded-xl text-[13px] font-semibold">
                    {t("dashboard.run", { period: format(new Date(currentPeriod + "-01"), "MMM yyyy") })}
                  </Button>
                }
              />
            </div>
          )}

          {/* Recent Runs */}
          <div
            className="flex-1 rounded-xl border border-card-border bg-card px-[22px] py-[18px]"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center gap-1.5 mb-0.5">
              <p className="text-[14.5px] font-semibold text-foreground">{t("dashboard.recentRuns")}</p>
              <HelpTooltip content={t("dashboard.recentRunsTooltip")} />
            </div>
            <p className="text-[12px] text-muted-foreground mb-4">{t("dashboard.previousCalculationJobs")}</p>

            {recentRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t("dashboard.noRunsYet")}</p>
            ) : (
              <div className="space-y-0">
                {recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center gap-3 py-3 border-b border-muted/60 last:border-0">
                    <div className="flex size-8 shrink-0 items-center justify-center rounded-[10px] bg-muted">
                      <Play className="size-3.5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground">{run.period}</p>
                      <p className="text-[11.5px] text-muted-foreground">
                        {format(new Date(run.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                    {run.status === "completed" && (
                      <Link
                        href={`/dash/runs/${run.id}`}
                        className="flex items-center gap-0.5 text-[11px] font-semibold text-primary bg-secondary border border-primary/20 rounded-md px-2.5 py-0.5 hover:opacity-80 transition-opacity"
                      >
                        <CheckCircle2 className="size-3" />
                        {t("dashboard.completed")}
                      </Link>
                    )}
                    {(run.status === "pending" || run.status === "processing") && (
                      <span className="flex items-center gap-0.5 text-[11px] font-semibold text-blue-500 bg-blue-500/10 border border-blue-500/20 rounded-md px-2.5 py-0.5">
                        <Loader2 className="size-3 animate-spin" />
                        {run.status === "processing" ? "Processing" : "Pending"}
                      </span>
                    )}
                    {run.status === "failed" && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <span className="flex items-center gap-0.5 text-[11px] font-semibold text-destructive bg-destructive/10 border border-destructive/20 rounded-md px-2.5 py-0.5 cursor-help">
                            <AlertCircle className="size-3" />
                            Failed
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{run.error || "Unknown error"}</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {feedbackDialog}
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="bg-card border border-card-border rounded-2xl px-[22px] py-5">
            <div className="flex items-start justify-between mb-3.5">
              <Skeleton className="h-3.5 w-28" />
              <Skeleton className="h-7 w-7 rounded-[10px]" />
            </div>
            <Skeleton className="h-7 w-24 mb-1.5" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="grid gap-5" style={{ gridTemplateColumns: "3fr 2fr" }}>
        <Card>
          <CardHeader>
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Card className="flex-1">
            <CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
            <CardContent className="space-y-3">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
