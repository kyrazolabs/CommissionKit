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
import { HelpTooltip } from "@/components/help-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useRole } from "@/hooks/use-role";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function RunsPage() {
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
  const { can } = useRole();

  const isAnyRunProcessing = Array.isArray(runs) && runs.some(r => r.status === "pending" || r.status === "processing");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calculation Runs</h1>
          <p className="text-muted-foreground">Execute and audit commission calculations.</p>
        </div>
        {can("admin") && <RunCalculationDialog isProcessing={isAnyRunProcessing} />}
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
              <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <PlayCircle className="h-6 w-6 text-muted-foreground" />
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
                        <Clock className="mr-2 h-3 w-3 text-muted-foreground" />
                        {format(new Date(run.createdAt), "MMM d, yyyy h:mm a")}
                      </div>
                    </TableCell>
                    <TableCell>
                      {run.status === "completed" && (
                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20 gap-1">
                          <CheckCircle2 className="h-3 w-3" /> Completed
                        </Badge>
                      )}
                      {(run.status === "pending" || run.status === "processing") && (
                        <Badge variant="outline" className="bg-blue-500/10 text-blue-500 border-blue-500/20 animate-pulse gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" /> {run.status === "processing" ? "Processing" : "Pending"}
                        </Badge>
                      )}
                      {run.status === "failed" && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="destructive" className="gap-1 cursor-help">
                              <AlertCircle className="h-3 w-3" /> Failed
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
                              <AlertCircle className="h-3 w-3 inline" />
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{run.skippedDeals} deals skipped (missing rep plan or stage not won)</p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-bold text-primary">
                      {formatCurrency(run.totalCommission)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/runs/${run.id}`}>
                          View Details <ArrowRight className="ml-2 h-4 w-4" />
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

function RunCalculationDialog({ isProcessing }: { isProcessing: boolean }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<string>(format(new Date(), "yyyy-MM"));
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateRun();

  const handleRun = () => {
    createMutation.mutate({ data: { period } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRunsQueryKey() });
        toast({ title: "Calculation Queued", description: `Commission calculation for ${period} has been started.` });
        setOpen(false);
      },
      onError: (err: any) => {
        toast({ title: "Run failed", description: err.message || "An error occurred", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          className="bg-primary hover:bg-primary/90 text-primary-foreground" 
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <PlayCircle className="mr-2 h-4 w-4" />
              Run Calculation
            </>
          )}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trigger Commission Calculation</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            This will process all pending and closed won deals for the specified period and calculate rep commissions.
            <HelpTooltip content="Calculating a run takes a 'snapshot' of current deals and plans. If you add deals later, you'll need to run it again to update totals." />
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="period">Calculation Period (YYYY-MM)</Label>
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
              <Input 
                id="period" 
                type="month" 
                value={period} 
                onChange={e => setPeriod(e.target.value)} 
                className="flex-1"
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Warning: Running for a period that already has a calculation will create a new run record.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleRun} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Processing..." : "Start Calculation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}