import { useState } from "react";
import { useParams } from "wouter";
import { useGetRepSummary, getGetRepSummaryQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, DollarSign, Activity, Briefcase, Wallet } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { useWorkspace } from "@/hooks/use-workspace";
import { CurrencyCell } from "@/components/currency-cell";
import { useQuery } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

const PAYOUT_STATUS: Record<string, { label: string; class: string }> = {
  pending:  { label: "Pending",  class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50" },
  approved: { label: "Approved", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50" },
  paid:     { label: "Paid",     class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50" },
  disputed: { label: "Disputed", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50" },
  on_hold:  { label: "On Hold",  class: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200/50" },
};

function PayoutsSection({ repId, workspaceId, currency }: { repId: string; workspaceId: string; currency: string }) {
  const { data: payouts = [], isLoading } = useQuery<any[]>({
    queryKey: ["rep-payouts", repId, workspaceId],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/payouts?repId=${repId}`, {
        credentials: "include",
        headers: { "x-workspace-id": workspaceId },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: Boolean(repId && workspaceId),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Wallet className="size-4 text-primary" />
          <CardTitle className="text-base">Payout History</CardTitle>
        </div>
        <CardDescription className="text-xs">All commission payouts for this rep.</CardDescription>
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
            <p className="text-sm text-muted-foreground">No payouts created yet.</p>
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
                const cfg = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.pending;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(p.periodStart), "MMM d")}–{format(new Date(p.periodEnd), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">{formatCurrency(p.commissionAmount, p.currency)}</TableCell>
                    <TableCell className={cn("text-right text-sm tabular-nums", p.adjustments < 0 ? "text-red-600" : p.adjustments > 0 ? "text-green-600" : "text-muted-foreground")}>
                      {p.adjustments !== 0 ? (p.adjustments > 0 ? "+" : "") + formatCurrency(p.adjustments, p.currency) : ":"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">{formatCurrency(p.finalAmount, p.currency)}</TableCell>
                    <TableCell><span className={cn("inline-flex items-center rounded-full border p-2.5 text-[11px] font-semibold", cfg.class)}>{cfg.label}</span></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {p.actualPaymentDate ? format(new Date(p.actualPaymentDate), "MMM d, yyyy") : ":"}
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

export function RepPortal() {
  const { activeWorkspace } = useWorkspace();
  const currency = activeWorkspace?.currency || "USD";
  const params = useParams();
  const id = params.id || "";
  const [period, setPeriod] = useState<string>(format(new Date(), "yyyy-MM"));

  const { data: summary, isLoading } = useGetRepSummary(
    id,
    { period },
    { query: { enabled: !!id, queryKey: getGetRepSummaryQueryKey(id, { period }) } }
  );

  if (isLoading) return <RepPortalSkeleton />;
  if (!summary || (summary as any).error) return <div>Rep not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold border border-primary/20">
              {summary.repName.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{summary.repName}</h1>
              <p className="text-muted-foreground">{summary.email}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {summary.planName && (
            <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground text-sm py-1">
              Plan: {summary.planName}
            </Badge>
          )}
          <div className="flex items-center border rounded-md px-3 bg-background">
            <CalendarDays className="size-4 text-muted-foreground mr-2" />
            <Input 
              type="month" 
              value={period} 
              onChange={e => setPeriod(e.target.value)}
              className="border-0 shadow-none focus-visible:ring-0 w-36 px-0 h-9"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground border-primary-foreground/10">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center">
              <DollarSign className="size-4 mr-1" /> Estimated Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{formatCurrency(summary.totalCommission, currency)}</div>
            <p className="text-xs text-primary-foreground/70 mt-1">For {format(new Date(period + "-01"), "MMMM yyyy")}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Activity className="size-4 mr-1" /> Total Revenue Closed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{formatCurrency(summary.totalRevenue, currency)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
              <Briefcase className="size-4 mr-1" /> Deals Won
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{summary.totalDeals}</div>
          </CardContent>
        </Card>
      </div>

      {/* Currency Breakdown (if multiple) */}
      {(summary as any).currencySummaries && (summary as any).currencySummaries.length > 1 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(summary as any).currencySummaries.map((c: any) => (
            <Card key={c.currency} className="border-l-4 border-l-primary/50">
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

      {summary.monthlyHistory && summary.monthlyHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Earnings History</CardTitle>
            <CardDescription>Past 6 months of commission payouts.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.monthlyHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis 
                    dataKey="period" 
                    tickFormatter={(val) => format(new Date(val + "-01"), "MMM")}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    tickFormatter={(val) => `$${val/1000}k`}
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <RechartsTooltip 
                    formatter={(value: number) => [formatCurrency(value, currency), "Commission"]}
                    labelFormatter={(label) => format(new Date(label + "-01"), "MMMM yyyy")}
                    contentStyle={{ borderRadius: '8px', border: '1px solid var(--border)', backgroundColor: 'hsl(var(--background))' }}
                  />
                  <Bar 
                    dataKey="totalCommission" 
                    fill="hsl(var(--primary))" 
                    radius={[4, 4, 0, 0]} 
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Deal Breakdown</CardTitle>
          <CardDescription>Individual deal commissions for this period.</CardDescription>
        </CardHeader>
        <CardContent>
          {summary.dealBreakdown.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-lg">
              <p className="text-muted-foreground">No deals found for this period.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Deal</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-right">Rate</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
              {summary.dealBreakdown.map((deal: any) => {
                  const dealCurrency = deal.currency || currency;
                  return (
                    <TableRow key={deal.dealId}>
                      <TableCell>
                        <div className="font-medium">{deal.dealName}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{deal.calculationNote}</div>
                        {dealCurrency !== currency && (
                          <Badge variant="outline" className="mt-0.5 text-[10px] p-1.5 h-4">
                            {dealCurrency}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(deal.closeDate), "MMM d")}
                      </TableCell>
                      <TableCell className="text-right">
                        <CurrencyCell
                          amount={deal.dealAmount}
                          currency={dealCurrency}
                          wsCurrency={deal.wsCurrency ?? currency}
                          convertedAmount={deal.convertedDealAmount}
                          exchangeRateSnapshot={deal.exchangeRateSnapshot}
                          rateSnapshotDate={deal.rateSnapshotDate}
                        />
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatPercent(deal.rateApplied)}</TableCell>
                      <TableCell className="text-right font-semibold text-primary">
                        <CurrencyCell
                          amount={deal.commissionAmount}
                          currency={dealCurrency}
                          wsCurrency={deal.wsCurrency ?? currency}
                          convertedAmount={deal.convertedCommission}
                          exchangeRateSnapshot={deal.exchangeRateSnapshot}
                          rateSnapshotDate={deal.rateSnapshotDate}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PayoutsSection repId={id} workspaceId={activeWorkspace?.id ?? ""} currency={currency} />
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
            <Skeleton className="size-8" />
            <Skeleton className="size-4" />
          </div>
        </div>
        <Skeleton className="size-10" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}