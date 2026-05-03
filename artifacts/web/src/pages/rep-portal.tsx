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
import { CalendarDays, DollarSign, Activity, Briefcase } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";

export function RepPortal() {
  const params = useParams();
  const id = parseInt(params.id || "0", 10);
  const [period, setPeriod] = useState<string>(format(new Date(), "yyyy-MM"));

  const { data: summary, isLoading } = useGetRepSummary(
    id,
    { period },
    { query: { enabled: !!id, queryKey: getGetRepSummaryQueryKey(id, { period }) } }
  );

  if (isLoading) return <RepPortalSkeleton />;
  if (!summary) return <div>Rep not found</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-bold border border-primary/20">
              {summary.repName.charAt(0)}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{summary.repName}</h1>
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
            <CalendarDays className="h-4 w-4 text-muted-foreground mr-2" />
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
              <DollarSign className="h-4 w-4 mr-1" /> Estimated Commission
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{formatCurrency(summary.totalCommission)}</div>
            <p className="text-xs text-primary-foreground/70 mt-1">For {format(new Date(period + "-01"), "MMMM yyyy")}</p>
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
                    formatter={(value: number) => [formatCurrency(value), "Commission"]}
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
                {summary.dealBreakdown.map((deal: any) => (
                  <TableRow key={deal.dealId}>
                    <TableCell>
                      <div className="font-medium">{deal.dealName}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{deal.calculationNote}</div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {format(new Date(deal.closeDate), "MMM d")}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(deal.dealAmount)}</TableCell>
                    <TableCell className="text-right font-medium">{formatPercent(deal.rateApplied)}</TableCell>
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
    </div>
  );
}

function RepPortalSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
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