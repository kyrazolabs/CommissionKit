import { useQuery } from "@tanstack/react-query";
import { useParams } from "wouter";
import { useGetRun, getGetRunQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function RunDetailsPage() {
  const params = useParams();
  const id = params.id || "";

  const { data: run, isLoading } = useGetRun(id, { 
    query: { 
      enabled: !!id, 
      queryKey: getGetRunQueryKey(id),
      refetchInterval: (query: any) => {
        const data = query?.state?.data;
        return (data?.status === "pending" || data?.status === "processing") ? 3000 : false;
      }
    } 
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!run || (run as any).error) return <div>Run not found</div>;

  // Type cast because Orval schema handles full payload differently
  const runData = run as any;

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold tracking-tight">Run Details</h1>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium border border-primary/20">
            {runData.period}
          </span>
        </div>
        <p className="text-muted-foreground mt-1">
          Executed on {format(new Date(runData.createdAt), "MMMM d, yyyy 'at' h:mm a")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">
              {formatCurrency(runData.totalCommission)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deals Processed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{runData.totalDeals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Reps Included</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{runData.repsCount}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Calculation Audit Trail</CardTitle>
          <CardDescription>Detailed breakdown of every commission calculation in this run.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rep</TableHead>
                <TableHead>Deal</TableHead>
                <TableHead className="text-right">Deal Amount</TableHead>
                <TableHead className="text-right">Rate Applied</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {runData.results?.map((result: any) => (
                <TableRow key={result.id}>
                  <TableCell className="font-medium">{result.repName}</TableCell>
                  <TableCell>{result.dealName}</TableCell>
                  <TableCell className="text-right">{formatCurrency(result.dealAmount)}</TableCell>
                  <TableCell className="text-right">{formatPercent(result.rateApplied)}</TableCell>
                  <TableCell className="text-right font-bold text-primary">
                    {formatCurrency(result.commissionAmount)}
                  </TableCell>
                  <TableCell>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="cursor-help p-1">
                          <Info className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-sm">
                        <p className="text-xs">{result.calculationNote}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {(!runData.results || runData.results.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No results found for this run.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}