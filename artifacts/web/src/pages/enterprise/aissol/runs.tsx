import { useState } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { 
  useListRuns, getListRunsQueryKey,
} from "@workspace/api-client-react";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayCircle, ArrowRight, Clock, Loader2, AlertCircle, CheckCircle2, Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRole } from "@/hooks/use-role";
import { useWorkspace } from "@/hooks/use-workspace";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { RunCalculationDialog } from "@/components/run-calculation-dialog";
import { usePageMeta } from "@/hooks/use-page-meta";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export function EnterpriseRunsPage() {
  usePageMeta({ title: "Commission Runs", description: "View and manage commission calculation runs.", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const currency = activeWorkspace?.currency || "SAR";
  const { data: runs, isLoading } = useListRuns({ 
    query: { 
      queryKey: getListRunsQueryKey(),
      staleTime: 0,
      refetchInterval: (query: any) => {
        const data = query?.state?.data;
        const hasActiveRuns = Array.isArray(data) && data.some((r: any) => r.status === "pending" || r.status === "processing");
        return hasActiveRuns ? 2000 : false;
      },
    }
  });
  const { hasPermission, isLoading: roleLoading } = useRole();
  const [showMatrixWarning, setShowMatrixWarning] = useState(false);

  const { data: matrixCheck, isLoading: matrixLoading } = useQuery({
    queryKey: ["aissol-matrix", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/enterprise/commission-matrix`),
    enabled: !!activeWorkspace?.id,
  });
  const hasMatrix = matrixCheck?.exists;
  const hasRates = hasMatrix && matrixCheck?.rates && 
    Object.values(matrixCheck.rates).some((r: any) =>
      Object.values(r).some((v: any) => v > 0)
    );
  const canRun = matrixLoading || (hasMatrix && hasRates);
  const matrixWarningType = !matrixLoading && !hasMatrix
    ? "no-matrix"
    : !matrixLoading && hasMatrix && !hasRates
    ? "zero-rates"
    : null;

  if (roleLoading) {
    return <div className="space-y-6"><div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-64" /></div><Skeleton className="h-96 w-full rounded-2xl" /></div>;
  }

  if (!hasPermission("calculations", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <PlayCircle className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view calculation runs.</p>
      </div>
    );
  }

  const isAnyRunProcessing = Array.isArray(runs) && runs.some((r: any) => r.status === "pending" || r.status === "processing");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Operations</p>
          <h1 className="text-3xl font-semibold tracking-tight">Calculation Runs</h1>
          <p className="text-muted-foreground">Execute and audit commission calculations for projects and invoices.</p>
        </div>
        <div className="flex gap-2">
          {hasPermission("calculations", "export") && <ExportCommissionsButton />}
          {hasPermission("calculations", "create") && (
            canRun ? (
              <RunCalculationDialog isProcessing={isAnyRunProcessing} />
            ) : (
              <Button
                onClick={() => setShowMatrixWarning(true)}
                disabled={isAnyRunProcessing}
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                {isAnyRunProcessing ? (
                  <><Loader2 className="mr-2 size-4 animate-spin" />Processing…</>
                ) : (
                  <><PlayCircle className="mr-2 size-4" />Run Calculation</>
                )}
              </Button>
            )
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run History</CardTitle>
          <CardDescription>All historical commission calculation batches.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : (!Array.isArray(runs) || runs.length === 0) ? (
            <div className="text-center py-12">
              <div className="bg-muted size-12 rounded-full flex items-center justify-center mx-auto mb-3"><PlayCircle className="size-6 text-muted-foreground" /></div>
              <h3 className="text-lg font-medium">No calculations run yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Trigger a run to calculate commissions for a specific period.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Run ID</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Executed On</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Reps</TableHead>
                  <TableHead className="text-right">Results</TableHead>
                  <TableHead className="text-right">Total Commission</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run: any) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">#{String(run.id).slice(-8)}</TableCell>
                    <TableCell className="font-medium">{run.period}</TableCell>
                    <TableCell><div className="flex items-center text-sm"><Clock className="mr-2 size-3 text-muted-foreground" />{format(new Date(run.createdAt), "MMM d, yyyy h:mm a")}</div></TableCell>
                    <TableCell>
                      {run.status === "completed" && <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1"><CheckCircle2 className="size-3" /> Completed</Badge>}
                      {(run.status === "pending" || run.status === "processing") && <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse gap-1"><Loader2 className="size-3 animate-spin" /> {run.status === "processing" ? "Processing" : "Pending"}</Badge>}
                      {run.status === "failed" && (
                        <Tooltip><TooltipTrigger asChild><Badge variant="destructive" className="gap-1 cursor-help"><AlertCircle className="size-3" /> Failed</Badge></TooltipTrigger>
                        <TooltipContent><p>{run.error || "An unknown error occurred."}</p></TooltipContent></Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(run.repsCount)}</TableCell>
                    <TableCell className="text-right">{formatNumber(run.totalDeals)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{formatCurrency(run.totalCommission, currency)}</TableCell>
                    <TableCell className="text-right"><Button variant="ghost" size="sm" asChild><Link href={`/dash/runs/${run.id}`}>View Details <ArrowRight className="ml-2 size-4" /></Link></Button></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={showMatrixWarning} onOpenChange={setShowMatrixWarning}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {matrixWarningType === "zero-rates" ? "Commission Rates Are All Zero" : "Commission Matrix Not Configured"}
            </DialogTitle>
            <DialogDescription>
              {matrixWarningType === "zero-rates"
                ? "Your commission rates are all set to zero."
                : "You need to set up a commission matrix before running calculations."}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 text-sm text-muted-foreground space-y-2">
            {matrixWarningType === "zero-rates" ? (
              <p>
                The calculation engine reads rates from the matrix to determine payouts. When all rates are zero, every commission will calculate to zero. Go to <strong>Commission Matrix</strong> and set non-zero rates for your slabs and brackets.
              </p>
            ) : (
              <>
                <p>
                  The calculation engine uses sales slabs, GM brackets, and commission rates from the matrix to determine payouts. Without it, the engine won't be able to calculate any commissions.
                </p>
                <p>
                  Go to <strong>Commission Matrix</strong> to configure your slabs, brackets, and rates.
                </p>
              </>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowMatrixWarning(false)}>Cancel</Button>
            <Button asChild>
              <Link href="/dash/enterprise/matrix">Configure Matrix</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExportCommissionsButton() {
  const { sub } = useBillingStatus();
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);
  const isGrowth = sub?.plan === "growth" || sub?.plan === "pro" || sub?.isLifetime;

  const handleExport = async () => {
    if (!isGrowth) { toast({ title: "Growth Plan Required", description: "Bulk CSV export requires Growth plan.", variant: "destructive" }); return; }
    if (!activeWorkspace?.id) return;
    setIsExporting(true);
    try {
      const workspaceId = localStorage.getItem("ck_active_workspace");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8088"}/api/export/commissions`, { credentials: "include", headers: { "x-workspace-id": workspaceId ?? "" } });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url; a.download = `commissions-${new Date().toISOString().split("T")[0]}.csv`;
      a.click(); URL.revokeObjectURL(url);
      toast({ title: "Export Successful" });
    } catch { toast({ title: "Export Failed", variant: "destructive" }); }
    finally { setIsExporting(false); }
  };

  return <Button variant="outline" onClick={handleExport} disabled={isExporting} className={!isGrowth ? "opacity-70 border-dashed" : ""}>{isExporting ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Download className="mr-2 size-4" />}Export CSV</Button>;
}
