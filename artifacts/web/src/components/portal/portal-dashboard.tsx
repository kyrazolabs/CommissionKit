import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import {
  LineChart,
  Line,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertOctagon,
  Briefcase,
  DollarSign,
  TrendingUp,
  Wallet,
  Layers,
  Clock,
  ArrowDownToLine,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatCard } from "@/components/stat-card";
import { SortableTableHead } from "@/components/sortable-table-head";
import { useTableSort } from "@/hooks/use-table-sort";
import { formatCurrency, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export interface PortalDealBreakdown {
  dealId: string;
  dealName: string;
  dealAmount: number;
  closeDate: string;
  rateApplied: number;
  commissionAmount: number;
  currency: string;
  calculationNote?: string;
}

export interface PortalSummary {
  repId: string;
  repName: string;
  email: string;
  workspaceName?: string;
  planName: string | null;
  period: string;
  totalCommission: number;
  totalRevenue: number;
  totalDeals: number;
  dealBreakdown?: PortalDealBreakdown[];
  monthlyHistory?: Array<{ period: string; totalCommission: number }>;
  currencySummaries?: Array<{
    currency: string;
    totalCommission: number;
    totalRevenue: number;
    totalDeals: number;
  }>;
  currency: string;
}

export interface PortalPayout {
  id: string;
  period: string;
  commissionAmount: number;
  adjustments?: number;
  finalAmount: number;
  status: string;
  paymentDate?: string;
  currency: string;
}

export type Payout = PortalPayout;

interface PortalDashboardProps {
  summary: PortalSummary;
  payouts: PortalPayout[];
  period: string;
  onPeriodChange: (period: string) => void;
  onDispute: (payout: PortalPayout) => void;
}

function statusBadgeVariant(
  status: string,
): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "completed":
    case "paid":
      return "default";
    case "pending":
    case "processing":
      return "secondary";
    case "failed":
    case "rejected":
      return "destructive";
    default:
      return "outline";
  }
}

function EarningsTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  const [year, month] = (label || "").split("-");
  const d = new Date(year, month - 1)
  const monthLabel = month && year ? `${d.toLocaleString("en", { month: "short" })} ${year}` : label;
  return (
    <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-sm">
      <p className="text-xs font-semibold text-foreground mb-1">{monthLabel}</p>
      {payload.map((p: any) => (
        <p key={p.name} className="text-xs text-muted-foreground">
          {p.name === "totalCommission"
            ? "Commission: "
            : `${p.name}: `}
          <span className="font-medium text-foreground">
            {formatCurrency(p.value, currency)}
          </span>
        </p>
      ))}
    </div>
  );
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function PortalDashboard({
  summary,
  payouts,
  period,
  onPeriodChange,
  onDispute,
}: PortalDashboardProps) {
  const { t } = useTranslation();

  const {
    sort,
    getSortHandler,
    sortedData,
  } = useTableSort<"dealName" | "closeDate" | "dealAmount" | "rateApplied" | "commissionAmount">("commissionAmount", "desc");

  const showCurrencyBreakdown =
    (summary.currencySummaries?.length ?? 0) > 1;

  // Always compute last 6 months, filling empty months with 0
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

  // Financial metrics from payouts
  const totalOwed = payouts
    .filter((p) => p.status === "pending" || p.status === "approved")
    .reduce((s, p) => s + (p.finalAmount || p.commissionAmount || 0), 0);
  const totalPaidLifetime = payouts
    .filter((p) => p.status === "paid")
    .reduce((s, p) => s + (p.finalAmount || p.commissionAmount || 0), 0);
  const ytdPaid = payouts
    .filter((p) => p.status === "paid" && p.paymentDate && new Date(p.paymentDate).getFullYear() === new Date().getFullYear())
    .reduce((s, p) => s + (p.finalAmount || p.commissionAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* 3 Stat Cards */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <StatCard
          label={t("portal.commission", "Commission")}
          trendLabel="This period"
          value={formatCurrency(summary.totalCommission, summary.currency)}
          icon={DollarSign}
          tooltip={t("portal.commissionTooltip", "Total commission earned this period")}
        />
        <StatCard
          label={t("portal.revenue", "Revenue")}
          trendLabel="Closed won deals"
          value={formatCurrency(summary.totalRevenue, summary.currency)}
          icon={TrendingUp}
          tooltip={t("portal.revenueTooltip", "Total revenue from closed deals this period")}
        />
        <StatCard
          label={t("portal.dealsWon", "Deals Won")}
          trendLabel="This period"
          value={String(summary.totalDeals)}
          icon={Briefcase}
          tooltip={t("portal.dealsWonTooltip", "Number of deals closed this period")}
        />
      </div>

      {/* Financial Summary — Plan, Owed, Paid, YTD */}
      <Card className="rounded-xl border border-card-border bg-card">
        <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Layers className="size-3.5 text-muted-foreground" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("portal.plan", "Plan")}</p>
            </div>
            <p className="text-sm font-medium text-foreground">{summary.planName || "—"}</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <Clock className="size-3.5 text-amber-500" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("portal.outstanding", "Outstanding")}</p>
            </div>
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(totalOwed, summary.currency)}</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <ArrowDownToLine className="size-3.5 text-green-500" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("portal.totalPaid", "Total Paid")}</p>
            </div>
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(totalPaidLifetime, summary.currency)}</p>
          </div>
          <div className="px-5 py-4">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="size-3.5 text-primary" />
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{t("portal.ytdPaid", "YTD Paid")}</p>
            </div>
            <p className="text-sm font-semibold text-foreground tabular-nums">{formatCurrency(ytdPaid, summary.currency)}</p>
          </div>
        </div>
      </Card>

      {/* Currency Breakdown */}
      {showCurrencyBreakdown && (
        <Card className="rounded-xl border border-card-border bg-card">
          <div className="px-5 py-4">
            <h2 className="text-[15px] font-semibold leading-snug tracking-tight">
              {t("portal.currencyBreakdown", "Currency Breakdown")}
            </h2>
          </div>
          <div className="px-5 pb-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {summary.currencySummaries!.map((cs) => (
                <div
                  key={cs.currency}
                  className="flex items-center justify-between gap-3 rounded-lg border border-card-border bg-card p-4"
                >
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-md bg-secondary text-secondary-foreground flex items-center justify-center">
                      <Wallet className="size-4" />
                    </div>
                    <span className="text-sm font-medium">{cs.currency}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatCurrency(cs.totalCommission, cs.currency)}
                    </p>
                    <p className="text-xs text-muted-foreground tabular-nums">
                      {t("portal.onRevenue", "on")}{" "}
                      {formatCurrency(cs.totalRevenue, cs.currency)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Earnings History Chart */}
      <Card className="rounded-xl border border-card-border bg-card">
        <div className="px-5 py-4">
          <h2 className="text-[15px] font-semibold leading-snug tracking-tight">
            {t("portal.earningsHistory", "Earnings History")}
          </h2>
        </div>
        <div className="px-5  pb-4">
          <div className="h-55">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={last6Months} margin={{ top: 4, right: 16, bottom: 0, left: -16 }}>
                <defs>
                  <linearGradient id="commissionShadow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.15} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="period"
                  tickFormatter={(val) => {
                    const [year, month] = val.split("-");
                    const d = new Date(Number(year), Number(month) - 1, 1);
                    return d.toLocaleString("en", { month: "short" });
                  }}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tickFormatter={(val: number) => `$${(val / 1000).toFixed(0)}k`}
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  content={<EarningsTooltip currency={summary.currency} />}
                  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
                />
                <Line
                  type="monotone"
                  dataKey="totalCommission"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, fill: "hsl(var(--primary))" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Deal Breakdown Table */}
      <Card className="rounded-xl border border-card-border bg-card">
        <div className="px-5 py-4">
          <h2 className="text-[15px] font-semibold leading-snug tracking-tight">
            {t("portal.dealBreakdown", "Deal Breakdown")}
          </h2>
        </div>
        <div className="px-5 pb-4">
          {sortedData(summary.dealBreakdown ?? [], (row) => row.commissionAmount).length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <SortableTableHead
                      column="dealName"
                      label={t("portal.deal", "Deal")}
                      sortColumn={sort.column}
                      sortDirection={sort.direction}
                      onSort={getSortHandler}
                    />
                    <SortableTableHead
                      column="closeDate"
                      label={t("portal.date", "Date")}
                      sortColumn={sort.column}
                      sortDirection={sort.direction}
                      onSort={getSortHandler}
                    />
                    <SortableTableHead
                      column="dealAmount"
                      label={t("portal.amount", "Amount")}
                      sortColumn={sort.column}
                      sortDirection={sort.direction}
                      onSort={getSortHandler}
                      className="text-right"
                    />
                    <SortableTableHead
                      column="rateApplied"
                      label={t("portal.rate", "Rate")}
                      sortColumn={sort.column}
                      sortDirection={sort.direction}
                      onSort={getSortHandler}
                      className="text-right"
                    />
                    <SortableTableHead
                      column="commissionAmount"
                      label={t("portal.commission", "Commission")}
                      sortColumn={sort.column}
                      sortDirection={sort.direction}
                      onSort={getSortHandler}
                      className="text-right"
                    />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedData(summary.dealBreakdown ?? [], (row) => row.commissionAmount).map((deal) => (
                    <TableRow key={deal.dealId}>
                      <TableCell className="font-medium">
                        <p className="truncate max-w-[200px]">{deal.dealName}</p>
                        {deal.calculationNote && (
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {deal.calculationNote}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground tabular-nums">
                        {format(new Date(deal.closeDate), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatCurrency(deal.dealAmount, deal.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatPercent(deal.rateApplied)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-semibold text-primary">
                        {formatCurrency(deal.commissionAmount, deal.currency)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <Briefcase className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("portal.noDeals", "No deals for this period")}
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Payout History */}
      <Card className="rounded-xl border border-card-border bg-card">
        <div className="px-5 py-4 flex items-center justify-between">
          <h2 className="text-[15px] font-semibold leading-snug tracking-tight">
            {t("portal.payoutHistory", "Payout History")}
          </h2>
        </div>
        <div className="px-5  pb-4">
          {payouts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("portal.period", "Period")}
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("portal.commission", "Commission")}
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("portal.adjustments", "Adjustments")}
                    </TableHead>
                    <TableHead className="text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("portal.final", "Final")}
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("portal.status", "Status")}
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("portal.paymentDate", "Payment Date")}
                    </TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id}>
                      <TableCell className="font-medium text-sm">
                        {payout.period}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm">
                        {formatCurrency(payout.commissionAmount, payout.currency)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm text-muted-foreground">
                        {payout.adjustments !== undefined
                          ? formatCurrency(payout.adjustments, payout.currency)
                          : "—"}
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-sm font-semibold">
                        {formatCurrency(payout.finalAmount, payout.currency)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={statusBadgeVariant(payout.status)}>
                          {payout.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payout.paymentDate
                          ? format(new Date(payout.paymentDate), "MMM d, yyyy")
                          : "—"}
                      </TableCell>
                      <TableCell>
                        {(payout.status === "pending" ||
                          payout.status === "approved") && (
                          <button
                            type="button"
                            onClick={() => onDispute(payout)}
                            className={cn(
                              "inline-flex items-center gap-1 text-xs font-medium",
                              "text-muted-foreground hover:text-foreground",
                              "transition-colors duration-200",
                              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1.5 py-0.5",
                            )}
                          >
                            <AlertOctagon className="size-3.5" />
                            {t("portal.dispute", "Dispute")}
                          </button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <Wallet className="size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                {t("portal.noPayouts", "No payouts yet")}
              </p>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
