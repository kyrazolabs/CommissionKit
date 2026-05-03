import { useQuery } from "@tanstack/react-query";
import { formatCurrency, formatNumber } from "@/lib/format";
import { useGetDashboardSummary, getGetDashboardSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUpRight, DollarSign, Users, Briefcase, Activity, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";

export function Dashboard() {
  const currentPeriod = format(new Date(), "yyyy-MM");
  const { data: summary, isLoading } = useGetDashboardSummary(
    { period: currentPeriod },
    { query: { queryKey: getGetDashboardSummaryQueryKey({ period: currentPeriod }) } }
  );

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (!summary) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <Activity className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold">No data available</h2>
        <p className="text-muted-foreground mt-2">Check back later when deals are closed.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Overview</h1>
        <p className="text-muted-foreground">Performance summary for {format(new Date(currentPeriod + "-01"), "MMMM yyyy")}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Commissions</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalCommission)}</div>
            <p className="text-xs text-muted-foreground mt-1">Calculated for this period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Closed won deals</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Closed</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalDeals)}</div>
            <p className="text-xs text-muted-foreground mt-1">This period</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Reps</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(summary.totalReps)}</div>
            <p className="text-xs text-muted-foreground mt-1">With deals this period</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Top Earners</CardTitle>
            <CardDescription>Highest commissions earned this period.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {summary.repEarnings.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No deals closed yet.</div>
              ) : (
                summary.repEarnings.map((rep, i) => (
                  <div key={rep.repId} className="flex items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border bg-muted font-medium text-xs">
                      #{i + 1}
                    </div>
                    <div className="ml-4 space-y-1 flex-1">
                      <Link href={`/reps/${rep.repId}`} className="text-sm font-medium leading-none hover:underline">
                        {rep.repName}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {rep.totalDeals} deals ({formatCurrency(rep.totalRevenue)} rev)
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-emerald-600 dark:text-emerald-500">
                      {formatCurrency(rep.totalCommission)}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
        
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Calculation Runs</CardTitle>
            <CardDescription>Latest batch processing jobs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              {summary.recentRuns.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">No runs executed yet.</div>
              ) : (
                summary.recentRuns.map((run) => (
                  <div key={run.id} className="flex items-center">
                    <div className="bg-primary/10 text-primary p-2 rounded-full">
                      <CalendarDays className="h-4 w-4" />
                    </div>
                    <div className="ml-4 space-y-1">
                      <p className="text-sm font-medium leading-none">Period: {run.period}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(run.createdAt), "MMM d, h:mm a")}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center">
                      <Link href={`/runs/${run.id}`} className="text-sm font-medium text-primary flex items-center hover:underline">
                        View <ArrowUpRight className="ml-1 h-3 w-3" />
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-32 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-9 w-9 rounded-full" />
                <div className="ml-4 space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-6 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </CardHeader>
          <CardContent className="space-y-6">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="ml-4 space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
