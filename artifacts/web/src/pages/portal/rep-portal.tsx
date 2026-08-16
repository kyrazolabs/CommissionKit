import { useState } from "react";
import { useParams } from "wouter";
import { useGetRepSummary, getGetRepSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  DollarSign, Activity, Briefcase, Wallet,
  Building2, Layers, Clock, TrendingUp, ArrowDownToLine,
} from "lucide-react";
import {
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useWorkspace } from "@/hooks/use-workspace";
import { CurrencyCell } from "@/components/currency-cell";
import { MonthPicker } from "@/components/ui/month-picker";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { RepAvatar } from "@/components/rep-avatar";
import { StatCard } from "@/components/stat-card";
import { useTableSort, SortDirection } from "@/hooks/use-table-sort";
import { SortableTableHead } from "@/components/sortable-table-head";

const PAYOUT_STATUS_I18N: Record<string, string> = {
  pending: "portal.rep.pending", approved: "portal.rep.approved", paid: "portal.rep.paid",
  disputed: "portal.rep.disputed", on_hold: "portal.rep.onHold",
};

const PAYOUT_STATUS_CLASSES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50",
  approved: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50",
  paid: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50",
  disputed: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50",
  on_hold: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200/50",
};

// Guards against Invalid Date crashes — the API can return empty strings
// for optional dates (e.g. deal.closeDate), and date-fns format() throws
// RangeError on Invalid Date, which unmounts the whole portal.
function formatDateSafe(value: string | null | undefined, pattern: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, pattern);
}

// ─── Payouts Section ──────────────────────────────────────────────────────────

function PayoutsSection({ payouts, isLoading, currency, t, statusI18n, statusClasses }: any) {
  return (
    <Card className="rounded-xl border border-card-border bg-card">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-primary" />
          <CardTitle className="text-base">{t("portal.rep.payoutHistory")}</CardTitle>
        </div>
        <CardDescription className="text-xs">{t("portal.rep.allPayoutsDescription")}</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : payouts.length === 0 ? (
          <div className="text-center py-10">
            <Wallet className="size-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{t("portal.rep.noPayouts")}</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Period</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead className="text-right">Adjustments</TableHead>
                <TableHead className="text-right">Final</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payouts.map((p: any) => {
                const statusClass = statusClasses[p.status] ?? statusClasses.pending;
                const statusKey = statusI18n[p.status] ?? statusI18n.pending;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateSafe(p.periodStart, "MMM d")}–{formatDateSafe(p.periodEnd, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{formatCurrency(p.commissionAmount, p.currency)}</TableCell>
                    <TableCell className={cn("text-right text-sm tabular-nums", p.adjustments < 0 ? "text-red-600" : p.adjustments > 0 ? "text-green-600" : "text-muted-foreground")}>
                      {p.adjustments !== 0 ? (p.adjustments > 0 ? "+" : "") + formatCurrency(p.adjustments, p.currency) : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">{formatCurrency(p.finalAmount, p.currency)}</TableCell>
                    <TableCell><span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", statusClass)}>{t(statusKey)}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateSafe(p.actualPaymentDate, "MMM d, yyyy")}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Rep Portal ──────────────────────────────────────────────────────────

export function RepPortal() {
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspace();
  const currency = activeWorkspace?.currency || "USD";
  const params = useParams();
  const id = params.id || "";
  const [period, setPeriod] = useState<string>(format(new Date(), "yyyy-MM"));

  const { data: summary, isLoading: summaryLoading } = useGetRepSummary(
    id,
    { period },
    { query: { enabled: !!id, queryKey: getGetRepSummaryQueryKey(id, { period }) } }
  );

  // Fetch payouts at the parent level so we can compute admin metrics
  const { data: payoutsRaw = {} as any, isLoading: payoutsLoading } = useQuery<any>({
    queryKey: ["rep-payouts", id, activeWorkspace?.id],
    queryFn: async () => {
      try { return await apiFetch(`/api/payouts?repId=${id}&limit=500`); }
      catch { return { data: [] }; }
    },
    enabled: Boolean(id && activeWorkspace?.id),
  });
  const payouts = payoutsRaw?.data ?? (Array.isArray(payoutsRaw) ? payoutsRaw : []);

  // Sortable deal breakdown
  type DealColumn = "dealName" | "closeDate" | "dealAmount" | "rateApplied" | "commissionAmount";
  const { sort, getSortHandler, sortedData } = useTableSort<DealColumn>();

  if (summaryLoading) return <RepPortalSkeleton />;
  if (!summary || (summary as any).error) return <div className="max-w-5xl mx-auto p-6"><p className="text-muted-foreground">{t("portal.rep.repNotFound")}</p></div>;

  // Always compute last 6 months
  const last6Months = (() => {
    const now = new Date();
    const months: Array<{ period: string; totalCommission: number; totalDeals: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const existing = (summary.monthlyHistory || []).find((m) => m.period === periodStr);
      months.push(existing ? { ...existing, totalDeals: (existing as any).totalDeals ?? 0 } : { period: periodStr, totalCommission: 0, totalDeals: 0 });
    }
    return months;
  })();

  // Compute admin financial metrics from payouts
  const totalOwed = payouts
    .filter((p: any) => p.status === "pending" || p.status === "approved")
    .reduce((s: number, p: any) => s + Number(p.finalAmount || p.commissionAmount || 0), 0);

  const totalPaid = payouts
    .filter((p: any) => p.status === "paid")
    .reduce((s: number, p: any) => s + Number(p.finalAmount || p.commissionAmount || 0), 0);

  const lifetimeEarnings = payouts
    .reduce((s: number, p: any) => s + Number(p.commissionAmount || 0), 0);

  const ytdPaid = payouts
    .filter((p: any) => p.status === "paid" && p.actualPaymentDate && new Date(p.actualPaymentDate).getFullYear() === new Date().getFullYear())
    .reduce((s: number, p: any) => s + Number(p.finalAmount || p.commissionAmount || 0), 0);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Rep Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4">
        <div className="flex items-center gap-3">
          <RepAvatar name={summary.repName} size={48} className="rounded-full shrink-0" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{summary.repName}</h1>
            <p className="text-sm text-muted-foreground">{summary.email}</p>
          </div>
        </div>
        <MonthPicker
          value={period}
          onChange={setPeriod}
          placeholder={t("common.pickMonth")}
          className="w-40 h-9"
        />
      </div>

      {/* Admin Context — Plan & Financial Summary */}
      <Card className="rounded-xl border border-card-border bg-card">
        <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
          {/* Plan */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Layers className="size-3.5 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Plan</p>
            </div>
            <p className="text-sm font-medium text-foreground">{summary.planName || t("portal.rep.planNone")}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{activeWorkspace?.name || t("portal.rep.planWorkspace")}</p>
          </div>

          {/* Total Owed (pending + approved) */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="size-3.5 text-amber-500" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Outstanding</p>
            </div>
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(totalOwed, currency)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Pending &amp; approved</p>
          </div>

          {/* Total Paid */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownToLine className="size-3.5 text-green-500" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Total Paid</p>
            </div>
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(totalPaid, currency)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Lifetime</p>
          </div>

          {/* YTD Paid */}
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="size-3.5 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">YTD Paid</p>
            </div>
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(ytdPaid, currency)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{new Date().getFullYear()}</p>
          </div>
        </div>
      </Card>

      {/* Stat Cards — Current Period */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <StatCard
          label={t("portal.rep.estimatedCommission")}
          value={formatCurrency(summary.totalCommission, currency)}
          icon={DollarSign}
          tooltip={t("portal.rep.estimatedCommissionTooltip")}
          trendLabel={format(new Date(period + "-01"), "MMMM yyyy")}
        />
        <StatCard
          label={t("portal.rep.totalRevenueClosed")}
          value={formatCurrency(summary.totalRevenue, currency)}
          icon={Activity}
          tooltip={t("portal.rep.totalRevenueClosedTooltip")}
        />
        <StatCard
          label={t("portal.rep.dealsWon")}
          value={String(summary.totalDeals)}
          icon={Briefcase}
          tooltip={t("portal.rep.dealsWonTooltip")}
        />
      </div>

      {/* Currency Breakdown */}
      {(summary as any).currencySummaries && (summary as any).currencySummaries.length > 1 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(summary as any).currencySummaries.map((c: any) => (
            <Card key={c.currency} className="rounded-xl border border-card-border bg-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {c.currency} Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-[10px] text-muted-foreground">Commission</p>
                  <p className="text-sm font-semibold">{formatCurrency(c.totalCommission, c.currency)}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-muted-foreground">Deals</p>
                  <p className="text-sm font-semibold">{c.totalDeals}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Earnings History */}
      <Card className="rounded-xl border border-card-border bg-card">
        <CardHeader>
          <CardTitle>{t("portal.rep.title")}</CardTitle>
          <CardDescription>{t("portal.rep.pastSixMonths")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-55">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last6Months} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="adminCommissionShadow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="period" tickFormatter={(val) => { const [y,m]=val.split("-"); return new Date(+y,+m-1,1).toLocaleString("en",{month:"short"}); }} tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <YAxis tickFormatter={(v:number)=>`$${(v/1000).toFixed(0)}k`} tick={{fontSize:11}} stroke="hsl(var(--muted-foreground))" tickLine={false} axisLine={false} />
                <RechartsTooltip formatter={(v:number)=>[formatCurrency(v,currency),t("portal.rep.commission")]} labelFormatter={(l)=>{const[y,m]=(l||"").split("-");const d=new Date(+y,+m-1,1);return`${d.toLocaleString("en",{month:"short"})} ${y}`;}} contentStyle={{borderRadius:8,border:"1px solid hsl(var(--border))",backgroundColor:"hsl(var(--card))",fontSize:13}} cursor={{fill:"hsl(var(--muted)/0.3)"}} />
                <Line type="monotone" dataKey="totalCommission" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} activeDot={{r:4,fill:"hsl(var(--primary))"}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Deal Breakdown */}
      <Card className="rounded-xl border border-card-border bg-card">
        <CardHeader>
          <CardTitle>{t("portal.rep.dealBreakdown")}</CardTitle>
          <CardDescription>{t("portal.rep.dealBreakdownDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.dealBreakdown.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-border rounded-lg">
              <p className="text-sm text-muted-foreground">{t("portal.rep.noDeals")}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <SortableTableHead label={t("portal.rep.dealName")} column="dealName" sortColumn={sort.column} sortDirection={sort.direction as SortDirection} onSort={getSortHandler} />
                  <SortableTableHead label={t("portal.rep.closeDate")} column="closeDate" sortColumn={sort.column} sortDirection={sort.direction as SortDirection} onSort={getSortHandler} />
                  <SortableTableHead label={t("portal.rep.amount")} column="dealAmount" sortColumn={sort.column} sortDirection={sort.direction as SortDirection} onSort={getSortHandler} align="right" />
                  <SortableTableHead label={t("portal.rep.rate")} column="rateApplied" sortColumn={sort.column} sortDirection={sort.direction as SortDirection} onSort={getSortHandler} align="right" />
                  <SortableTableHead label={t("portal.rep.commission")} column="commissionAmount" sortColumn={sort.column} sortDirection={sort.direction as SortDirection} onSort={getSortHandler} align="right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedData(summary.dealBreakdown, (deal, col) => {
                  if (col === "dealName") return deal.dealName;
                  if (col === "closeDate") return deal.closeDate;
                  if (col === "dealAmount") return deal.dealAmount;
                  if (col === "rateApplied") return deal.rateApplied;
                  if (col === "commissionAmount") return deal.commissionAmount;
                  return "";
                }).map((deal: any) => {
                  const dealCurrency = deal.currency || currency;
                  return (
                    <TableRow key={deal.dealId}>
                      <TableCell>
                        <div className="font-medium">{deal.dealName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{deal.calculationNote}</div>
                        {dealCurrency !== currency && (<Badge variant="outline" className="mt-0.5 text-[10px] p-1.5 h-4">{dealCurrency}</Badge>)}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">{formatDateSafe(deal.closeDate, "MMM d")}</TableCell>
                      <TableCell className="text-right"><CurrencyCell amount={deal.dealAmount} currency={dealCurrency} wsCurrency={deal.wsCurrency ?? currency} convertedAmount={deal.convertedDealAmount} exchangeRateSnapshot={deal.exchangeRateSnapshot} rateSnapshotDate={deal.rateSnapshotDate} /></TableCell>
                      <TableCell className="text-right font-medium">{formatPercent(deal.rateApplied)}</TableCell>
                      <TableCell className="text-right font-semibold text-primary"><CurrencyCell amount={deal.commissionAmount} currency={dealCurrency} wsCurrency={deal.wsCurrency ?? currency} convertedAmount={deal.convertedCommission} exchangeRateSnapshot={deal.exchangeRateSnapshot} rateSnapshotDate={deal.rateSnapshotDate} /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Payout History */}
      <PayoutsSection payouts={payouts} isLoading={payoutsLoading} currency={currency} t={t} statusI18n={PAYOUT_STATUS_I18N} statusClasses={PAYOUT_STATUS_CLASSES} />
    </div>
  );
}

function RepPortalSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-end">
        <div className="flex gap-4 items-center">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>
        <Skeleton className="h-9 w-40" />
      </div>
      <Skeleton className="h-20 w-full rounded-xl" />
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <Skeleton className="h-[220px] w-full rounded-xl" />
      <Skeleton className="h-[400px] w-full rounded-xl" />
    </div>
  );
}
