import { formatCurrency, formatNumber } from "@/lib/format";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  DollarSign, Users, Briefcase, Activity, CalendarDays, ArrowUpRight, TrendingUp
} from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { cn } from "@/lib/utils";

const statCards = [
  {
    key: "totalCommission" as const,
    label: "Total Commissions",
    sub: "Calculated this period",
    icon: DollarSign,
    color: "bg-indigo-500/10 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-400",
  },
  {
    key: "totalRevenue" as const,
    label: "Total Revenue",
    sub: "Closed won deals",
    icon: TrendingUp,
    color: "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-400",
  },
  {
    key: "totalDeals" as const,
    label: "Deals Closed",
    sub: "This period",
    icon: Briefcase,
    color: "bg-amber-500/10 text-amber-600 dark:bg-amber-400/15 dark:text-amber-400",
    isCount: true,
  },
  {
    key: "totalReps" as const,
    label: "Active Reps",
    sub: "With deals this period",
    icon: Users,
    color: "bg-sky-500/10 text-sky-600 dark:bg-sky-400/15 dark:text-sky-400",
    isCount: true,
  },
];

const rankColors = [
  "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
  "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
  "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
];

export function Dashboard() {
  const currentPeriod = format(new Date(), "yyyy-MM");
  const { data: summary, isLoading } = useGetDashboardSummary(
    { period: currentPeriod },
    { query: { queryKey: getGetDashboardSummaryQueryKey({ period: currentPeriod }) } }
  );

  if (isLoading) return <DashboardSkeleton />;

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Activity className="h-10 w-10 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold">No data yet</h2>
        <p className="text-muted-foreground mt-1 text-sm">Import deals to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Overview</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Performance summary for {format(new Date(currentPeriod + "-01"), "MMMM yyyy")}
          </p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {statCards.map(({ key, label, sub, icon: Icon, color, isCount }) => (
          <Card key={key}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
                <div className={cn("p-2 rounded-lg", color)}>
                  <Icon className="h-4 w-4" />
                </div>
              </div>
              <div className="text-[28px] font-bold tracking-tight text-foreground leading-none">
                {isCount
                  ? formatNumber(summary[key] as number)
                  : formatCurrency(summary[key] as number)}
              </div>
              <p className="text-[12px] text-muted-foreground mt-1.5">{sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Lower grid */}
      <div className="grid gap-5 lg:grid-cols-7">
        {/* Top earners */}
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Top Earners</CardTitle>
            <CardDescription>Highest commissions this period</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.repEarnings.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No deals closed yet.</p>
            ) : (
              <div className="space-y-1">
                {summary.repEarnings.map((rep, i) => (
                  <div
                    key={rep.repId}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors group"
                  >
                    <div
                      className={cn(
                        "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold",
                        i < 3 ? rankColors[i] : "bg-muted text-muted-foreground"
                      )}
                    >
                      {i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/reps/${rep.repId}`}
                        className="text-[14px] font-semibold text-foreground hover:text-primary transition-colors block truncate"
                      >
                        {rep.repName}
                      </Link>
                      <p className="text-[12px] text-muted-foreground">
                        {rep.totalDeals} {rep.totalDeals === 1 ? "deal" : "deals"} · {formatCurrency(rep.totalRevenue)} rev
                      </p>
                    </div>
                    <div className="font-bold text-[15px] text-emerald-600 dark:text-emerald-400 shrink-0">
                      {formatCurrency(rep.totalCommission)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent runs */}
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Runs</CardTitle>
            <CardDescription>Latest commission calculations</CardDescription>
          </CardHeader>
          <CardContent>
            {summary.recentRuns.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-6">No runs yet.</p>
            ) : (
              <div className="space-y-1">
                {summary.recentRuns.map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[14px] font-semibold text-foreground leading-tight">
                        Period: {run.period}
                      </p>
                      <p className="text-[12px] text-muted-foreground">
                        {format(new Date(run.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <Link
                      href={`/runs/${run.id}`}
                      className="flex items-center gap-1 text-[13px] font-medium text-primary hover:text-primary/80 transition-colors shrink-0"
                    >
                      View <ArrowUpRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-7">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="pt-5">
              <div className="flex items-start justify-between mb-3">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-8 w-8 rounded-lg" />
              </div>
              <Skeleton className="h-8 w-24 mb-1.5" />
              <Skeleton className="h-3 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-5 w-28 mb-1" />
            <Skeleton className="h-4 w-44" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-7 w-7 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-16" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-5 w-32 mb-1" />
            <Skeleton className="h-4 w-40" />
          </CardHeader>
          <CardContent className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
                <Skeleton className="h-4 w-10" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
