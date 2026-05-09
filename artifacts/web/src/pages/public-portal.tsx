import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { format } from "date-fns";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  DollarSign,
  Activity,
  Briefcase,
  ShieldAlert,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";

// ─── Types ─────────────────────────────────────────────────────────────────

interface DealBreakdown {
  dealId: string;
  dealName: string;
  dealAmount: number;
  closeDate: string;
  rateApplied: number;
  commissionAmount: number;
  calculationNote: string;
}

interface MonthlyHistory {
  period: string;
  totalCommission: number;
  totalDeals: number;
}

interface PortalSummary {
  repId: string;
  repName: string;
  email: string;
  planName: string | null;
  period: string;
  totalCommission: number;
  totalRevenue: number;
  totalDeals: number;
  dealBreakdown: DealBreakdown[];
  monthlyHistory: MonthlyHistory[];
}

// ─── Fetch helper ───────────────────────────────────────────────────────────

async function fetchPortalData(accessCode: string, period: string): Promise<PortalSummary> {
  const base = import.meta.env.VITE_API_URL ?? "";
  const url = `${base}/api/portal/${encodeURIComponent(accessCode)}?period=${period}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.error ?? "Failed to load portal");
  }
  return res.json();
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function PublicRepPortal() {
  const params = useParams<{ accessCode: string }>();
  const accessCode = params.accessCode ?? "";
  const [period, setPeriod] = useState<string>(format(new Date(), "yyyy-MM"));
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accessCode) return;
    setLoading(true);
    setError(null);
    fetchPortalData(accessCode, period)
      .then(setSummary)
      .catch((err) => setError(err.message ?? "Something went wrong"))
      .finally(() => setLoading(false));
  }, [accessCode, period]);

  return (
    <div className="min-h-screen bg-sidebar">
      {/* Slim branded header — no sidebar, no topbar chrome */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="14" fill="#111827" />
              <line x1="16" y1="40" x2="40" y2="16" stroke="#0D9488" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="20" cy="20" r="5" fill="#0D9488" />
              <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" strokeWidth="3" />
              <circle cx="36" cy="36" r="2.5" fill="#0D9488" />
            </svg>
            <span className="font-bold text-[15px] text-foreground tracking-tight">
              Commission<span className="text-primary">Kit</span>
            </span>
          </div>

          {/* Rep name chip (once loaded) */}
          {summary && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-7 w-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold border border-primary/20">
                {summary.repName.charAt(0)}
              </div>
              <span className="hidden sm:inline font-medium text-foreground">{summary.repName}</span>
            </div>
          )}
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        {loading && <PortalSkeleton />}

        {!loading && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Portal not found</h1>
            <p className="text-muted-foreground max-w-sm">
              {error}. Please check your link or contact your manager for a new one.
            </p>
          </div>
        )}

        {!loading && !error && summary && (
          <div className="space-y-6">
            {/* Rep header row */}
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20">
                    {summary.repName.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">{summary.repName}</h1>
                    <p className="text-muted-foreground text-sm">{summary.email}</p>
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
                  <CalendarDays className="h-4 w-4 text-muted-foreground mr-2" />
                  <Input
                    type="month"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 w-36 px-0 h-9"
                  />
                </div>
              </div>
            </div>

            {/* Stat cards */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-primary text-primary-foreground border-primary-foreground/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center">
                    <DollarSign className="h-4 w-4 mr-1" /> Estimated Commission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(summary.totalCommission)}</div>
                  <p className="text-xs text-primary-foreground/70 mt-1">
                    For {format(new Date(period + "-01"), "MMMM yyyy")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Activity className="h-4 w-4 mr-1" /> Total Revenue Closed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Briefcase className="h-4 w-4 mr-1" /> Deals Won
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{summary.totalDeals}</div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings history chart */}
            {summary.monthlyHistory && summary.monthlyHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Earnings History</CardTitle>
                  <CardDescription>Past 6 months of commission payouts.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={summary.monthlyHistory}
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="period"
                          tickFormatter={(val) => format(new Date(val + "-01"), "MMM")}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={(val) => `$${val / 1000}k`}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <RechartsTooltip
                          formatter={(value: number) => [formatCurrency(value), "Commission"]}
                          labelFormatter={(label) =>
                            format(new Date(label + "-01"), "MMMM yyyy")
                          }
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            backgroundColor: "hsl(var(--background))",
                          }}
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

            {/* Deal breakdown table */}
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
                      {summary.dealBreakdown.map((deal) => (
                        <TableRow key={deal.dealId}>
                          <TableCell>
                            <div className="font-medium">{deal.dealName}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">
                              {deal.calculationNote}
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {deal.closeDate ? format(new Date(deal.closeDate), "MMM d") : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(deal.dealAmount)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatPercent(deal.rateApplied)}
                          </TableCell>
                          <TableCell className="text-right font-bold text-primary">
                            {formatCurrency(deal.commissionAmount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Footer note */}
            <p className="text-center text-xs text-muted-foreground pb-4">
              This is a read-only view of your commission data, provided by{" "}
              <span className="font-medium text-foreground">CommissionKit</span>.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function PortalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex gap-4 items-center">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-10 w-48" />
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
