import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListRuns, getListRunsQueryKey,
  useCreateRun
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { PlayCircle, ArrowRight, CalendarDays, Clock, FileText, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrency, formatNumber } from "@/lib/format";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";
import { HelpTooltip } from "@/components/help-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRole } from "@/hooks/use-role";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useWorkspace } from "@/hooks/use-workspace";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { RunCalculationDialog } from "@/components/run-calculation-dialog";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-page-meta";


export function RunsPage() {
  usePageMeta({ title: "Commission Runs", description: "View and manage commission calculation runs.", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const currency = activeWorkspace?.currency || "USD";
  const { data: runs, isLoading } = useListRuns({ 
    query: { 
      queryKey: getListRunsQueryKey(),
      refetchInterval: (query: any) => {
        const data = query?.state?.data;
        const hasActiveRuns = Array.isArray(data) && data.some((r: any) => r.status === "pending" || r.status === "processing");
        return hasActiveRuns ? 2000 : false;
      }
    } 
  });
  const { can, hasPermission, isLoading: roleLoading } = useRole();

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="size-10" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
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

  const isAnyRunProcessing = Array.isArray(runs) && runs.some(r => r.status === "pending" || r.status === "processing");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Calculation Runs</h1>
          <p className="text-muted-foreground">Execute and audit commission calculations.</p>
        </div>
        <div className="flex gap-2">
          {hasPermission("calculations", "export") && <ExportCommissionsButton />}
          {hasPermission("calculations", "create") && <RunCalculationDialog isProcessing={isAnyRunProcessing} />}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run History</CardTitle>
          <CardDescription>All historical commission calculation batches.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : (!Array.isArray(runs) || runs.length === 0) ? (
            <div className="text-center py-12">
              <div className="bg-muted size-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <PlayCircle className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No calculations run yet</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                Trigger a run to calculate commissions for a specific period.
              </p>
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
                  <TableHead className="text-right">Deals</TableHead>
                  <TableHead className="text-right">Total Commission</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {runs.map((run) => (
                  <TableRow key={run.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      #{run.id.toString().padStart(4, '0')}
                    </TableCell>
                    <TableCell className="font-medium">{run.period}</TableCell>
                    <TableCell>
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 size-3 text-muted-foreground" />
                        {format(new Date(run.createdAt), "MMM d, yyyy h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {run.status === "completed" && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                          <CheckCircle2 className="size-3" /> Completed
                        </Badge>
                      )}
                      {(run.status === "pending" || run.status === "processing") && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse gap-1">
                          <Loader2 className="size-3 animate-spin" /> {run.status === "processing" ? "Processing" : "Pending"}
                        </Badge>
                      )}
                      {run.status === "failed" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="destructive" className="gap-1 cursor-help">
                              <AlertCircle className="size-3" /> Failed
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{run.error || "An unknown error occurred during calculation."}</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="text-right">{formatNumber(run.repsCount)}</TableCell>
                    <TableCell className="text-right">
                      {formatNumber(run.totalDeals)}
                      {run.skippedDeals > 0 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="ml-1.5 text-amber-500 cursor-help">
                              <AlertCircle className="size-3 inline" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{run.skippedDeals} deals skipped (missing rep plan or stage not won)</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      {formatCurrency(run.totalCommission, currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/dash/runs/${run.id}`}>
                          View Details <ArrowRight className="ml-2 size-4" />
                        </Link>
                      </Button>
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


function ExportCommissionsButton() {
  const { sub } = useBillingStatus();
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const isGrowth = sub?.plan === "growth" || sub?.plan === "pro" || sub?.isLifetime;

  const handleExport = async () => {
    if (!isGrowth) {
      toast({
        title: "Growth Plan Required",
        description: "Bulk CSV export is a premium feature. Please upgrade to the Growth plan to export your data.",
        variant: "destructive",
      });
      return;
    }

    if (!activeWorkspace?.id) return;

    setIsExporting(true);
    try {
      const workspaceId = localStorage.getItem("ck_active_workspace");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8088"}/api/export/commissions`, {
        credentials: "include",
        headers: { "x-workspace-id": workspaceId ?? "" },
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `commissions-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Your commission data has been exported to CSV.",
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isExporting}
      className={!isGrowth ? "opacity-70 border-dashed" : ""}
    >
      {isExporting ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Download className="mr-2 size-4" />
      )}
      Export CSV
    </Button>
  );
}