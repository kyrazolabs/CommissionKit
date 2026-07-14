import { useState } from "react";
import { useGetReports, getGetReportsQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  FileText, Download, TrendingUp, DollarSign, Target, PieChart as PieIcon,
  HandCoins, Medal, AlertCircle, TrendingDown, Minus
} from "lucide-react";
import { useWorkspace } from "@/hooks/use-workspace";
import { formatCurrency, formatNumber } from "@/lib/format";
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear, subYears } from "date-fns";
import { DateRange } from "react-day-picker";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-picker";
import { cn } from "@/lib/utils";
import { useRole } from "@/hooks/use-role";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useTranslation } from "react-i18next";

// ---------------------------------------------------------------------------
// Shared Chart Components
// ---------------------------------------------------------------------------

function ChartTooltip({ active, payload, label, currency }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color?: string }>;
  label?: string;
  currency?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-sm">
      <p className="text-[11px] font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[11px] text-muted-foreground">
          {p.name}: <span className="font-medium text-foreground tabular-nums">
            {typeof p.value === "number" ? formatCurrency(p.value, currency ?? "USD") : p.value}
          </span>
        </p>
      ))}
    </div>
  );
}

function ChartLegend({ items }: { items: Array<{ label: string; color: string }> }) {
  return (
    <div className="flex items-center justify-center gap-4 mt-3">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-1.5">
          <div className={cn("size-2.5 rounded-sm", item.color)} />
          <span className="text-[10px] text-muted-foreground">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// KPI Card
// ---------------------------------------------------------------------------

function KpiCard({
  label,
  value,
  sub,
  trend,
  trendUp,
  icon: Icon,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: number;
  trendUp?: boolean;
  icon: React.ElementType;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between mb-3.5">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</span>
        <div className="flex size-7 items-center justify-center rounded-[10px] bg-secondary">
          <Icon className="size-3.5 text-primary" />
        </div>
      </div>
      <div className="text-[26px] font-semibold tracking-tight text-foreground leading-none tabular-nums">
        {value}
      </div>
      {trend !== undefined && (
        <div className={cn("flex items-center gap-1 mt-2 text-[11px]", trend > 0 ? "text-[hsl(var(--chart-2))]" : trend < 0 ? "text-destructive" : "text-muted-foreground")}>
          {trend > 0 ? <TrendingUp className="size-3" /> : trend < 0 ? <TrendingDown className="size-3" /> : <Minus className="size-3" />}
          <span className="font-medium tabular-nums">{Math.abs(trend).toFixed(1)}%</span>
          <span className="text-muted-foreground">{sub}</span>
        </div>
      )}
      {sub && trend === undefined && (
        <div className="mt-2 text-[11px] text-muted-foreground">{sub}</div>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Reports Page
// ---------------------------------------------------------------------------

export function ReportsPage() {
  const { t } = useTranslation();
  usePageMeta({
    title: t("reports.title"),
    description: "Detailed commission reports and analytics for your workspace.",
    robots: "noindex, nofollow",
  });
  const { activeWorkspace } = useWorkspace();
  const { hasPermission, isLoading: roleLoading } = useRole();
  const currency = activeWorkspace?.currency || "USD";

  const today = new Date();

  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(today),
    to: today,
  });
  const [interval, setInterval] = useState<"day" | "month">("day");
  const [selectedPreset, setSelectedPreset] = useState<string>("this-month");

  const applyPreset = (preset: string) => {
    setSelectedPreset(preset);
    switch (preset) {
      case "this-month":
        setDateRange({ from: startOfMonth(today), to: today });
        setInterval("day");
        break;
      case "last-month":
        setDateRange({ from: startOfMonth(subMonths(today, 1)), to: endOfMonth(subMonths(today, 1)) });
        setInterval("day");
        break;
      case "last-3-months":
        setDateRange({ from: startOfMonth(subMonths(today, 2)), to: today });
        setInterval("month");
        break;
      case "last-6-months":
        setDateRange({ from: startOfMonth(subMonths(today, 5)), to: today });
        setInterval("month");
        break;
      case "this-year":
        setDateRange({ from: startOfYear(today), to: today });
        setInterval("month");
        break;
      case "last-year":
        setDateRange({ from: startOfYear(subYears(today, 1)), to: endOfYear(subYears(today, 1)) });
        setInterval("month");
        break;
      default:
        break;
    }
  };

  const presetLabels: Record<string, string> = {
    "this-month": "This Month",
    "last-month": "Last Month",
    "last-3-months": "Last 3 Months",
    "last-6-months": "Last 6 Months",
    "this-year": "This Year",
    "last-year": "Last Year",
    "custom": "Custom",
  };

  const queryParams = {
    startDate: dateRange?.from ? format(dateRange.from, "yyyy-MM-dd") : undefined,
    endDate: dateRange?.to ? format(dateRange.to, "yyyy-MM-dd") : undefined,
    interval,
  };

  const { data: reportData, isLoading, isError } = useGetReports(
    queryParams,
    { query: { queryKey: [...getGetReportsQueryKey(queryParams)], staleTime: 0 } },
  );

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!hasPermission("analytics", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <PieIcon className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view reports.</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <AlertCircle className="size-10 text-destructive" />
        <h2 className="text-lg font-semibold text-foreground">Failed to load reports</h2>
        <p className="text-sm text-muted-foreground">An error occurred while fetching report data. Please try again.</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">
          Retry
        </Button>
      </div>
    );
  }

  const exec = reportData?.executiveSummary;
  const growth = reportData?.monthlyGrowth;

  // Insight computation helpers
  const top3Commission = reportData?.repCommissionBreakdown
    ? [...(reportData.repCommissionBreakdown ?? [])]
        .sort((a, b) => (b.commission ?? 0) - (a.commission ?? 0))
        .slice(0, 3)
        .reduce((s, r) => s + (r.commission ?? 0), 0)
    : 0;
  const totalCommissionAmt = reportData?.repCommissionBreakdown
    ? reportData.repCommissionBreakdown.reduce((s, r) => s + (r.commission ?? 0), 0)
    : 0;
  const top3Percent = totalCommissionAmt > 0 ? (top3Commission / totalCommissionAmt) * 100 : 0;

  const revenueTrend = growth?.revenueGrowth ?? 0;

  return (
    <>
      <div className="space-y-7">
        {/* Page Header */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4">
          <div>
            <p className="text-[12px] font-semibold text-primary mb-1">Analytics</p>
            <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Executive Report</h1>
            <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">
              Data-driven insights for compensation and revenue decisions.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg p-1 shadow-sm">
              <Select value={selectedPreset} onValueChange={applyPreset}>
                <SelectTrigger className="w-[130px] h-8 border-none bg-transparent shadow-none text-sm focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder="Select preset" />
                </SelectTrigger>
                  <SelectContent>
                  <SelectItem value="this-month">This Month</SelectItem>
                  <SelectItem value="last-month">Last Month</SelectItem>
                  <SelectItem value="last-3-months">Last 3 Months</SelectItem>
                  <SelectItem value="last-6-months">Last 6 Months</SelectItem>
                  <SelectItem value="this-year">This Year</SelectItem>
                  <SelectItem value="last-year">Last Year</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-px h-5 bg-border mx-1" />
              <DateRangePicker
                from={dateRange?.from}
                to={dateRange?.to}
                onRangeChange={(range) => {
                  setSelectedPreset("custom");
                  if (range && range.from) {
                    setDateRange(range as DateRange);
                  } else {
                    setDateRange(undefined);
                  }
                }}
                className="w-[260px] border-none bg-transparent shadow-none h-8 text-sm"
              />
              <div className="w-px h-5 bg-border mx-1" />
              <Select value={interval} onValueChange={(v: "day" | "month") => setInterval(v)}>
                <SelectTrigger className="w-[110px] h-8 border-none bg-transparent shadow-none text-sm focus:ring-0 focus:ring-offset-0">
                  <SelectValue placeholder={t("reports.interval")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="day">Daily</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-32 rounded-2xl" />
            ))}
            <Skeleton className="h-[280px] col-span-2 lg:col-span-5 rounded-2xl" />
            <Skeleton className="h-[280px] col-span-2 lg:col-span-5 rounded-2xl" />
          </div>
        ) : !reportData || !exec ? (
          <Card className="flex flex-col items-center justify-center p-16 text-center">
            <CardHeader className="pb-0">
              <FileText className="size-12 text-muted-foreground opacity-20 mb-2" />
              <CardTitle>No data available</CardTitle>
              <CardDescription>There is no report data for the selected date range.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <div className="space-y-6">

            {/* KPI Cards — 5 cards */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-5">
              <KpiCard
                label="Commissions Paid"
                value={formatCurrency(exec.totalCommission, currency)}
                sub={t("reports.ofRevenue")}
                trend={growth?.commissionGrowth}
                icon={DollarSign}
              />
              <KpiCard
                label="Commission Ratio"
                value={`${exec.commissionRatio.toFixed(1)}%`}
                sub={t("reports.ofRevenue")}
                trend={growth?.commissionGrowth}
                icon={Target}
              />
              <KpiCard
                label="Total Revenue"
                value={formatCurrency(exec.totalRevenue, currency)}
                trend={revenueTrend}
                sub={t("reports.vsPriorPeriod")}
                icon={TrendingUp}
              />
              <KpiCard
                label="Win Rate"
                value={`${exec.winRate.toFixed(1)}%`}
                sub={t("reports.vsPriorPeriod")}
                icon={Medal}
              />
              <KpiCard
                label="Pending Revenue"
                value={formatCurrency(exec.pendingRevenue, currency)}
                sub={t("reports.uncollectedPipeline")}
                icon={HandCoins}
              />
            </div>

            {/* Commission by Rep — PRIMARY chart */}
            {reportData.repCommissionBreakdown && reportData.repCommissionBreakdown.length > 0 && (
              <Card className="p-5">
                <div className="mb-1">
                  <h3 className="text-[14px] font-semibold text-foreground">{t("reports.commissionByRep")}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {top3Percent > 0 ? `Top 3 reps earned ${top3Percent.toFixed(0)}% of total commissions` : t("reports.topEarnersRanked")}
                  </p>
                </div>
                <div className="h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={reportData.repCommissionBreakdown}
                      margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="name"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip
                        content={<ChartTooltip currency={currency} />}
                        cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                      />
                      <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="commission" name="Commission" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ChartLegend
                  items={[
                    { label: "Revenue", color: "bg-muted" },
                    { label: "Commission", color: "bg-primary" },
                  ]}
                />
              </Card>
            )}

            {/* Revenue & Margin Trends */}
            {reportData.monthlyTrends && reportData.monthlyTrends.length > 0 && (
              <Card className="p-5">
                <div className="mb-1">
                  <h3 className="text-[14px] font-semibold text-foreground">{t("reports.revenueMarginTrends")}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t("reports.trackingPipelineImpact")}</p>
                </div>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reportData.monthlyTrends} margin={{ top: 4, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis
                        dataKey="period"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(val) => {
                          if (interval === "month") return format(new Date(val + "-01"), "MMM yyyy");
                          return format(new Date(val), "MMM d");
                        }}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <RechartsTooltip
                        content={<ChartTooltip currency={currency} />}
                        cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                      />
                      <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="commission" name="Commission" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <ChartLegend
                  items={[
                    { label: "Revenue", color: "bg-muted" },
                    { label: "Commission", color: "bg-primary" },
                  ]}
                />
              </Card>
            )}

            {/* Deal Stage Funnel */}
            {reportData.dealStages && reportData.dealStages.length > 0 ? (
              <Card className="p-5">
                <div className="mb-1">
                  <h3 className="text-[14px] font-semibold text-foreground">Deal Stage Funnel</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">Won, pending, and lost deals breakdown</p>
                </div>
                {/* Transform [{name, value}] → [{stage, won, pending, lost}] for grouped bar chart */}
                {(() => {
                  const funnelData = reportData.dealStages.map((d) => ({ stage: d.name, value: d.value }));
                  return (
                    <>
                      <div className="h-[220px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={funnelData}
                            layout="vertical"
                            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                            <XAxis
                              type="number"
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                            />
                            <YAxis
                              type="category"
                              dataKey="stage"
                              stroke="hsl(var(--muted-foreground))"
                              fontSize={11}
                              tickLine={false}
                              axisLine={false}
                              width={70}
                            />
                            <RechartsTooltip
                              content={({ active, payload, label }) => {
                                if (!active || !payload?.length) return null;
                                return (
                                  <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-sm">
                                    <p className="text-[11px] font-semibold text-foreground mb-1 capitalize">{label}</p>
                                    {payload.map((p, i) => (
                                      <p key={i} className="text-[11px] text-muted-foreground">
                                        {p.name}: <span className="font-medium text-foreground tabular-nums">{p.value}</span>
                                      </p>
                                    ))}
                                  </div>
                                );
                              }}
                              cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                            />
                            <Bar dataKey="value" name="Count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={20} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <ChartLegend
                        items={[
                          { label: "Won", color: "bg-[hsl(var(--chart-2))]" },
                          { label: "Pending", color: "bg-[hsl(var(--chart-3))]" },
                          { label: "Lost", color: "bg-destructive" },
                        ]}
                      />
                    </>
                  );
                })()}
              </Card>
            ) : (
              <Card className="flex flex-col items-center justify-center p-12 text-center">
                <FileText className="size-10 text-muted-foreground opacity-20 mb-3" />
                <p className="text-sm font-medium text-foreground">No deal stage data for this period</p>
                <p className="text-xs text-muted-foreground mt-1">Import deals and run a commission calculation to see the funnel.</p>
              </Card>
            )}

            {/* Row: Payment Status + Top Won Deals */}
            <div className="grid gap-6 md:grid-cols-2">
              {/* Payment Status */}
              {reportData.paymentStatusBreakdown && reportData.paymentStatusBreakdown.length > 0 && (
                <Card className="p-5">
                  <div className="mb-1">
                    <h3 className="text-[14px] font-semibold text-foreground">{t("reports.paymentStatus")}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t("reports.paymentStatusDesc")}</p>
                  </div>
                  <div className="h-[200px] w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={reportData.paymentStatusBreakdown}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {reportData.paymentStatusBreakdown.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
                          ))}
                        </Pie>
                        <RechartsTooltip
                          content={({ active, payload }) => {
                            if (!active || !payload?.length || !reportData.paymentStatusBreakdown) return null;
                            const data = payload[0];
                            const idx = reportData.paymentStatusBreakdown.findIndex((d) => d.name === data.name);
                            return (
                              <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-sm">
                                <p className="text-[11px] text-muted-foreground">
                                  <span
                                    className="inline-block size-2 rounded-sm mr-1.5"
                                    style={{ backgroundColor: `hsl(var(--chart-${(idx % 5) + 1}))` }}
                                  />
                                  {data.name}
                                </p>
                                <p className="text-[11px] font-medium text-foreground tabular-nums">{data.value} deals</p>
                              </div>
                            );
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ChartLegend
                    items={reportData.paymentStatusBreakdown.map((entry, index) => ({
                      label: `${entry.name} (${entry.value})`,
                      color: `bg-[hsl(var(--chart-${(index % 5) + 1}))]`,
                    }))}
                  />
                </Card>
              )}

              {/* Top Won Deals */}
              {reportData.topDeals && reportData.topDeals.length > 0 && (
                <Card className="overflow-hidden">
                  <div className="px-5 py-[18px] border-b border-border">
                    <h3 className="text-[14px] font-semibold text-foreground">{t("reports.topWonDeals")}</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5">{t("reports.topWonDealsDesc")}</p>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">#</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("deals.dealName")}</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("deals.rep")}</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t("deals.amount")}</TableHead>
                          <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("deals.closeDate")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {reportData.topDeals.map((deal, i) => (
                          <TableRow key={deal.name + i} className="hover:bg-muted/40 transition-colors last:border-0">
                            <TableCell className="py-3.5">
                              <span
                                className={cn(
                                  "inline-flex items-center justify-center size-6 rounded-full text-[11px] font-bold",
                                  i === 0
                                    ? "bg-[hsl(var(--chart-3))]/20 text-[hsl(var(--chart-3))]"
                                    : i === 1
                                      ? "bg-muted text-muted-foreground"
                                      : i === 2
                                        ? "bg-[hsl(var(--chart-3))]/20 text-[hsl(var(--chart-3))]"
                                        : "bg-muted text-muted-foreground",
                                )}
                              >
                                {i + 1}
                              </span>
                            </TableCell>
                            <TableCell className="text-[13px] font-semibold text-foreground">{deal.name}</TableCell>
                            <TableCell className="text-[13px] text-muted-foreground">{deal.repName}</TableCell>
                            <TableCell className="text-[13px] font-medium text-foreground text-right tabular-nums">
                              {formatCurrency(deal.amount, currency)}
                            </TableCell>
                            <TableCell className="text-[13px] text-muted-foreground">
                              {format(new Date(deal.closeDate), "MMM d, yyyy")}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </Card>
              )}
            </div>

            {/* Rep Performance Matrix */}
            {reportData.topPerformers && reportData.topPerformers.length > 0 && (
              <Card className="overflow-hidden">
                <div className="px-5 py-[18px] border-b border-border">
                  <h3 className="text-[14px] font-semibold text-foreground">{t("reports.repPerformanceMatrix")}</h3>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t("reports.decisionMetricsDesc")}</p>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("deals.rep")}</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t("reports.dealsWon")}</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t("reports.winRate")}</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t("reports.revenueDriven")}</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t("reports.commissionsPaid")}</TableHead>
                        <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">{t("reports.effectiveRate")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reportData.topPerformers.map((rep, i) => {
                        const effRate = rep.revenue > 0 ? (rep.commission / rep.revenue) * 100 : 0;
                        return (
                          <TableRow key={rep.name} className="hover:bg-muted/40 transition-colors last:border-0">
                            <TableCell className="text-[13px] font-semibold text-foreground">
                              <span className="flex items-center gap-2">
                                {i === 0 && <Medal className="size-4 text-[hsl(var(--chart-3))]" />}
                                {rep.name}
                              </span>
                            </TableCell>
                            <TableCell className="text-[13px] font-medium text-foreground text-right tabular-nums">
                              {formatNumber(rep.dealsWon)}
                            </TableCell>
                            <TableCell className="text-[13px] font-medium text-foreground text-right tabular-nums">
                              {rep.winRate.toFixed(1)}%
                            </TableCell>
                            <TableCell className="text-[13px] font-medium text-foreground text-right tabular-nums">
                              {formatCurrency(rep.revenue, currency)}
                            </TableCell>
                            <TableCell className="text-[13px] font-medium text-foreground text-right tabular-nums">
                              {formatCurrency(rep.commission, currency)}
                            </TableCell>
                            <TableCell className="text-[13px] font-medium text-muted-foreground text-right tabular-nums">
                              {effRate.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            )}

          </div>
        )}
      </div>
    </>
  );
}
