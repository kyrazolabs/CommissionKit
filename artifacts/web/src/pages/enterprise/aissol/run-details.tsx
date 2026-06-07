import { useParams } from "wouter";
import { useGetRun, getGetRunQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CurrencyCell } from "@/components/currency-cell";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";

export function EnterpriseRunDetailsPage() {
  const { activeWorkspace } = useWorkspace();
  const { hasPermission, isLoading: roleLoading } = useRole();
  const currency = activeWorkspace?.currency || "SAR";
  const params = useParams();
  const id = params.id || "";

  const { data: run, isLoading } = useGetRun(id, {
    query: {
      enabled: !!id,
      queryKey: getGetRunQueryKey(id),
      staleTime: 0,
      refetchInterval: (query: any) => {
        const data = query?.state?.data;
        return (data?.status === "pending" || data?.status === "processing") ? 3000 : false;
      },
    }
  });

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="size-10" />
        <div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-2xl" />)}</div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!hasPermission("calculations", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view run details.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-56" />
        </div>
        <div className="grid gap-4 md:grid-cols-4">{[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}</div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (!run || (run as any).error) {
    return <div className="py-24 text-center text-muted-foreground">Run not found.</div>;
  }

  const runData = run as any;

  const totalCommission = Number(runData.totalCommission) || 0;

  // Build project summary from meta
  const projectMap = new Map<string, { name: string; slab: number; slabLabel: string; gmPercent: number; gmBracket: string; invoiceCount: number; commission: number }>();
  for (const r of runData.results ?? []) {
    const meta = (r as any).meta ?? {};
    if (!meta?.projectId) continue;
    const pid = String(meta.projectId);
    if (!projectMap.has(pid)) {
      projectMap.set(pid, {
        name: String(meta.projectId).slice(-8),
        slab: meta.slab ?? 0,
        slabLabel: meta.slabLabel ?? `Slab ${meta.slab ?? 0}`,
        gmPercent: meta.gmPercent ?? 0,
        gmBracket: meta.gmBracket ?? "—",
        invoiceCount: 0,
        commission: 0,
      });
    }
    const p = projectMap.get(pid)!;
    p.invoiceCount++;
    p.commission += Number(r.commissionAmount) || 0;
  }

  const projects = Array.from(projectMap.values());

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[12px] font-semibold text-primary mb-1">Operations</p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">Run Details</h1>
          <Badge
            variant="outline"
            className={
              runData.status === "completed"
                ? "border-green-500/40 bg-green-500/10 text-green-600 dark:text-green-400"
                : runData.status === "failed"
                ? "border-destructive/40 bg-destructive/10 text-destructive"
                : "border-yellow-500/40 bg-yellow-500/10 text-yellow-600"
            }
          >
            {runData.status}
          </Badge>
        </div>
        <p className="text-muted-foreground mt-1">
          Executed on {format(new Date(runData.createdAt), "MMMM d, yyyy 'at' h:mm a")} for{" "}
          <span className="text-primary px-1 text-base font-medium">{runData.period}</span>
          Period
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Total Commission</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold text-primary">{formatCurrency(totalCommission, currency)}</div><p className="text-xs text-muted-foreground mt-1">In {currency}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Results</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{runData.totalDeals}</div><p className="text-xs text-muted-foreground mt-1">invoice commissions</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Projects</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{projects.length}</div><p className="text-xs text-muted-foreground mt-1">in this run</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Reps</CardTitle></CardHeader>
          <CardContent><div className="text-3xl font-semibold">{runData.repsCount}</div><p className="text-xs text-muted-foreground mt-1">included</p></CardContent>
        </Card>
      </div>

      {projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Project Breakdown</CardTitle>
            <CardDescription>Summary per project with slab, GM, and commission totals.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow>{["Project", "Slab", "GM%", "GM Bracket", "Invoices", "Commission"].map(h => <TableHead key={h} className={h === "Commission" ? "text-right" : ""}>{h}</TableHead>)}</TableRow></TableHeader>
              <TableBody>
                {projects.map((p, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell>{p.slab} ({p.slabLabel})</TableCell>
                    <TableCell className="font-medium text-emerald-600">{p.gmPercent}%</TableCell>
                    <TableCell>{p.gmBracket}</TableCell>
                    <TableCell>{p.invoiceCount}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatCurrency(p.commission, currency)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Invoice Results</CardTitle>
          <CardDescription>Per-invoice commission calculation details.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow>{["Rep", "Invoice", "Rate", "Commission", ""].map(h => <TableHead key={h} className={h === "Rate" || h === "Commission" ? "text-right" : ""}>{h}</TableHead>)}</TableRow></TableHeader>
            <TableBody>
              {runData.results?.map((result: any) => {
                const meta = (result as any).meta ?? {};
                const invLabel = meta.invoiceNumber || `#${String(result.dealId || "").slice(-6)}`;
                return (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium w-[140px]">{result.repName || "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{invLabel}</div>
                      {meta.slab !== undefined && (
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground mt-0.5">
                          Slab {meta.slab} · {meta.gmBracket}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right w-[100px]">{formatPercent(result.rateApplied)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary w-[140px]">
                      <CurrencyCell
                        amount={result.commissionAmount}
                        currency={result.currency || currency}
                        wsCurrency={result.wsCurrency ?? currency}
                        convertedAmount={result.convertedCommission}
                        exchangeRateSnapshot={result.exchangeRateSnapshot}
                        rateSnapshotDate={result.rateSnapshotDate}
                      />
                    </TableCell>
                    <TableCell className="w-[40px]">
                      <Tooltip><TooltipTrigger asChild><div className="cursor-help p-1"><Info className="size-4 text-muted-foreground" /></div></TooltipTrigger>
                        <TooltipContent side="left" className="max-w-sm"><p className="text-xs">{result.calculationNote}</p></TooltipContent></Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!runData.results || runData.results.length === 0) && (
                <TableRow><TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No results found for this run.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
