import { formatCurrency, formatNumber } from "@/lib/format";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DollarSign, Users, Briefcase, Activity, CalendarDays,
  ArrowUpRight, TrendingUp, Zap, Play
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { HelpTooltip } from "@/components/help-tooltip";
import { RunCalculationDialog } from "@/components/run-calculation-dialog";
import { useWorkspace } from "@/hooks/use-workspace";
import { useTranslation } from "react-i18next";

import { useRole } from "@/hooks/use-role";
import { usePageMeta } from "@/hooks/use-page-meta";


export function Dashboard() {
  const { t } = useTranslation();
  usePageMeta({ title: t("dashboard.title"), description: "Overview of your workspace commissions and performance.", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const { hasPermission, isLoading: roleLoading } = useRole();
  const currency = activeWorkspace?.currency || "USD";
  const currentPeriod = format(new Date(), "yyyy-MM");
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary(
    { query: { queryKey: [...getGetDashboardSummaryQueryKey(), activeWorkspace?.id] } }
  );

  if (summaryLoading || roleLoading) return <DashboardSkeleton />;

  if (!summary || (summary as any).error) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Activity className="size-10 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">{t("dashboard.noDataYet")}</h2>
        <p className="text-muted-foreground mt-1 text-sm">{t("dashboard.importDealsToGetStarted")}</p>
      </div>
    );
  }

  const repEarnings = summary.repEarnings ?? [];
  const recentRuns = summary.recentRuns ?? [];

  const statCards = [
    { label: t("dashboard.totalCommissions"), value: formatCurrency(summary.totalCommission, currency), delta: t("dashboard.calculatedThisPeriod"), icon: DollarSign, tooltip: t("dashboard.totalCommissionsTooltip") },
    { label: t("dashboard.pipelineRevenue"),  value: formatCurrency(summary.totalRevenue, currency),    delta: t("dashboard.closedWonDeals"),       icon: TrendingUp, tooltip: t("dashboard.pipelineRevenueTooltip") },
    { label: t("dashboard.dealsClosed"),      value: formatNumber(summary.totalDeals),        delta: t("dashboard.thisPeriod"),            icon: Briefcase, tooltip: t("dashboard.dealsClosedTooltip") },
    { label: t("dashboard.activeReps"),       value: formatNumber(summary.totalReps),         delta: `${t("dashboard.thisPeriod")}`, icon: Users, tooltip: t("dashboard.activeRepsTooltip") },
  ];

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

      {/* Stat cards : 4 columns, all teal icon badges */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ label, value, delta, icon: Icon, tooltip }) => (
          <div
            key={label}
            className="bg-card border border-card-border rounded-2xl px-[22px] py-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-1.5">
                <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
                <HelpTooltip content={tooltip} />
              </div>
              <div className="flex size-7 items-center justify-center rounded-[10px] bg-secondary">
                <Icon className="size-3.5 text-primary" />
              </div>
            </div>
            <div className="text-[26px] font-semibold tracking-tight text-foreground leading-none">{value}</div>
            <p className="text-[12px] text-primary font-medium mt-1.5">{delta}</p>
          </div>
        ))}
      </div>

      {/* Lower grid: earners table (3fr) + right column (2fr) */}
      <div className="grid gap-5" style={{ gridTemplateColumns: "3fr 2fr" }}>

        {/* Top Earners : table style */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
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

          {repEarnings.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">{t("dashboard.noDealsClosedYet")}</p>
          ) : (
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-muted/60">
                  {[t("dashboard.rep"), t("dashboard.plan"), t("dashboard.deals"), t("dashboard.revenue"), t("dashboard.commission")].map((h) => (
                    <th key={h} className="p-4 text-left text-[11.5px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {repEarnings.map((rep, i) => (
                  <tr key={rep.repId} className="border-t border-muted/60 hover:bg-muted/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10.5px] font-semibold"
                          style={{
                            background: i === 0 ? "hsl(var(--primary))" : "hsl(var(--muted))",
                            color: i === 0 ? "#fff" : "hsl(var(--muted-foreground))",
                          }}
                        >
                          {rep.repName.split(" ").map((n: string) => n[0]).join("")}
                        </div>
                        <div>
                          <Link
                            href={`/dash/reps/${rep.repId}`}
                            className="text-[13.5px] font-semibold text-foreground hover:text-primary transition-colors"
                          >
                            {rep.repName}
                          </Link>
                          {i === 0 && (
                              <span className="ml-1.5 text-[10px] font-semibold text-primary bg-secondary border border-primary/20 rounded px-1.5 py-px">
                                {t("dashboard.top")}
                              </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-[12.5px] text-muted-foreground">
                      <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-foreground">
                        {(rep as any).planName || t("dashboard.none")}
                      </span>
                    </td>
                    <td className="p-4 text-[13px] font-medium text-foreground">{rep.totalDeals}</td>
                    <td className="p-4 text-[13px] font-medium text-foreground">
                      {formatCurrency(rep.totalRevenue, currency)}
                    </td>
                    <td className="p-4 text-[13.5px] font-semibold text-primary">
                      {formatCurrency(rep.totalCommission, currency)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-4">
          {/* Quick action */}
          {hasPermission("calculations", "create") && (
            <div
              className="rounded-2xl border px-[22px] py-5"
              style={{
                background: "hsl(var(--secondary))",
                borderColor: "hsl(var(--primary) / 0.2)",
                boxShadow: "var(--shadow-card)",
              }}
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
            className="flex-1 bg-card border border-card-border rounded-2xl px-[22px] py-[18px]"
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
                    <Link
                      href={`/dash/runs/${run.id}`}
                      className="flex items-center gap-0.5 text-[11px] font-semibold text-primary bg-secondary border border-primary/20 rounded-md px-2.5 py-0.5 hover:opacity-80 transition-opacity"
                    >
                      {t("dashboard.completed")}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
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
        <Card><CardHeader><Skeleton className="h-5 w-28" /><Skeleton className="h-4 w-44" /></CardHeader>
          <CardContent className="space-y-3">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Card className="flex-1"><CardHeader><Skeleton className="h-5 w-28" /></CardHeader>
            <CardContent className="space-y-3">
              {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
