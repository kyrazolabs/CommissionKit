import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, FolderKanban, FileText, ArrowLeft, Wallet } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { useWorkspace } from "@/hooks/use-workspace";
import { MonthPicker } from "@/components/ui/month-picker";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { usePageMeta } from "@/hooks/use-page-meta";

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
    queryFn: async () => { try { return await apiFetch(`/api/payouts?repId=${repId}`); } catch { return []; } },
    enabled: Boolean(repId && workspaceId),
  });

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2"><Wallet className="size-4 text-primary" /><CardTitle className="text-base">Payout History</CardTitle></div>
        <CardDescription className="text-xs">All commission payouts for this rep.</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? <div className="p-4 space-y-2"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
        : payouts.length === 0 ? <div className="text-center py-10"><Wallet className="size-8 text-muted-foreground mx-auto mb-2" /><p className="text-sm text-muted-foreground">No payouts created yet.</p></div>
        : <Table><TableHeader><TableRow>{["Period","Commission","Adjustments","Final","Status","Payment Date"].map(h=><TableHead key={h} className={h!=="Period"&&h!=="Status"&&h!=="Payment Date"?"text-right":""}>{h}</TableHead>)}</TableRow></TableHeader>
          <TableBody>{payouts.map((p:any)=>{const cfg=PAYOUT_STATUS[p.status]??PAYOUT_STATUS.pending;return <TableRow key={p.id}>
            <TableCell className="text-sm text-muted-foreground">{format(new Date(p.periodStart),"MMM d")}–{format(new Date(p.periodEnd),"MMM d, yyyy")}</TableCell>
            <TableCell className="text-right text-sm">{formatCurrency(p.commissionAmount,p.currency)}</TableCell>
            <TableCell className={cn("text-right text-sm",p.adjustments<0?"text-red-600":p.adjustments>0?"text-green-600":"text-muted-foreground")}>{p.adjustments!==0?(p.adjustments>0?"+":"")+formatCurrency(p.adjustments,p.currency):"—"}</TableCell>
            <TableCell className="text-right text-sm font-semibold">{formatCurrency(p.finalAmount,p.currency)}</TableCell>
            <TableCell><span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",cfg.class)}>{cfg.label}</span></TableCell>
            <TableCell className="text-sm text-muted-foreground">{p.actualPaymentDate?format(new Date(p.actualPaymentDate),"MMM d, yyyy"):"—"}</TableCell>
          </TableRow>})}</TableBody></Table>}
      </CardContent>
    </Card>
  );
}

export function EnterpriseRepPortal() {
  usePageMeta({ title: "Rep Portal", description: "Enterprise rep details", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const currency = activeWorkspace?.currency || "SAR";
  const params = useParams();
  const id = params.id || "";
  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"));

  const { data: summary, isLoading } = useQuery<any>({
    queryKey: ["enterprise-rep-summary", id, period],
    queryFn: () => apiFetch(`/api/enterprise/reps/${id}/summary?period=${period}`),
    enabled: !!id && !!activeWorkspace?.id && activeWorkspace?.commissionEngine === "aissol",
    staleTime: 0,
  });

  if (isLoading) return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">{[1,2,3].map(i=><Skeleton key={i} className="h-28 rounded-2xl"/>)}</div>
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  );

  if (!summary) return <div className="py-24 text-center text-muted-foreground">Rep not found.</div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Link href="/dash/reps"><Button variant="ghost" size="icon" className="size-8"><ArrowLeft className="size-4" /></Button></Link>
            <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold border border-primary/20">{summary.repName.charAt(0)}</div>
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">{summary.repName}</h1>
              <p className="text-muted-foreground">{summary.email}</p>
            </div>
          </div>
        </div>
        <MonthPicker value={period} onChange={setPeriod} placeholder="Pick a month" className="w-40 h-9" />
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {[
          { label: "Total Commission", value: formatCurrency(summary.totalCommission, currency), icon: DollarSign, className: "bg-primary text-primary-foreground border-primary-foreground/10" },
          { label: "Total Projects", value: summary.totalProjects, icon: FolderKanban },
          { label: "Total Invoices", value: summary.totalInvoices, icon: FileText },
          { label: "Project Value", value: formatCurrency(summary.totalValue, currency), icon: DollarSign },
        ].map((stat, i) => (
          <Card key={i} className={stat.className}>
            <CardHeader className="pb-2"><CardTitle className={cn("text-sm font-medium flex items-center gap-1", stat.className ? "text-primary-foreground/80" : "text-muted-foreground")}><stat.icon className="size-4" />{stat.label}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-semibold">{stat.value}</div></CardContent>
          </Card>
        ))}
      </div>

      {summary.monthlyHistory?.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Earnings History</CardTitle><CardDescription>Past 6 months of commission payouts.</CardDescription></CardHeader>
          <CardContent>
            <div className="h-[250px] w-full mt-4">
              <ResponsiveContainer>
                <BarChart data={summary.monthlyHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <XAxis dataKey="period" tickFormatter={(v) => format(new Date(v+"-01"),"MMM")} fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} fontSize={12} tickLine={false} axisLine={false} />
                  <RechartsTooltip formatter={(v: number) => [formatCurrency(v, currency), "Commission"]} labelFormatter={(l) => format(new Date(l+"-01"), "MMMM yyyy")} />
                  <Bar dataKey="totalCommission" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle>Project Breakdown</CardTitle><CardDescription>Projects and their commission details for this period.</CardDescription></CardHeader>
        <CardContent>
          {(!summary.projectBreakdown || summary.projectBreakdown.length === 0) ? (
            <div className="text-center py-10 border border-dashed rounded-lg"><p className="text-muted-foreground">No projects found for this period.</p></div>
          ) : (
            <Table>
              <TableHeader><TableRow>{["Project","Value","Cost","GM%","Invoices","Commission"].map(h=><TableHead key={h} className={h==="Commission"?"text-right":""}>{h}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {summary.projectBreakdown.map((p: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(p.value, p.currency)}</TableCell>
                    <TableCell className="text-muted-foreground">{formatCurrency(p.cost, p.currency)}</TableCell>
                    <TableCell className="font-medium text-emerald-600">{p.gm}%</TableCell>
                    <TableCell>{p.invoiceCount}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{p.commission > 0 ? formatCurrency(p.commission, p.currency) : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PayoutsSection repId={id} workspaceId={activeWorkspace?.id ?? ""} currency={currency} />
    </div>
  );
}
