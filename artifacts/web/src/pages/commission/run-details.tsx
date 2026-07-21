import { useState } from "react";
import { useParams } from "wouter";
import { useTranslation } from "react-i18next";
import { useGetRun, getGetRunQueryKey } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { DataPagination } from "@/components/ui/data-pagination";
import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { CurrencyCell } from "@/components/currency-cell";
import { useWorkspace } from "@/hooks/use-workspace";

import { useRole } from "@/hooks/use-role";

export function RunDetailsPage() {
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspace();
  const { hasPermission, isLoading: roleLoading } = useRole();
  const currency = activeWorkspace?.currency || "USD";

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

  const [page, setPage] = useState(1);
  const LIMIT = 50;

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-52" />
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!hasPermission("calculations", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <h2 className="text-lg font-semibold">{t("runs.accessDenied")}</h2>
        <p className="text-sm text-muted-foreground">{t('runs.runDetails.noPermission')}.</p>
      </div>
    );
  }

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

  if (!run || (run as any).error) return <div>{t("runs.runDetails.notFound")}</div>;

  const runData = run as any;
  const totalResults = runData.results?.length ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalResults / LIMIT));
  const startIndex = (page - 1) * LIMIT;
  const paginatedResults = runData.results?.slice(startIndex, startIndex + LIMIT) ?? [];

  // Group results by rep for the summary view
  const repGroups = new Map<string, { repName: string; results: any[] }>();
  for (const r of runData.results ?? []) {
    if (!repGroups.has(r.repId)) {
      repGroups.set(r.repId, { repName: r.repName, results: [] });
    }
    repGroups.get(r.repId)!.results.push(r);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[12px] font-semibold text-primary mb-1">{t("runs.operations")}</p>
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-semibold tracking-tight">{t("runs.runDetails.title")}</h1>
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
          {t('runs.runDetails.executedOn')} {format(new Date(runData.createdAt), "MMMM d, yyyy 'at' h:mm a")} for 
          <span className="text-primary px-1 text-base font-medium">
            {runData.period}
          </span> Period
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("runs.runDetails.totalPayout")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold text-primary">
              {formatCurrency(runData.totalCommission, currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t("runs.runDetails.in")} {currency}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("runs.runDetails.dealsProcessed")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{runData.totalDeals}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t("runs.runDetails.repsIncluded")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-semibold">{runData.repsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit trail */}
      <Card>
        <CardHeader>
          <CardTitle>{t("runs.runDetails.auditTrail")}</CardTitle>
          <CardDescription>
            {t('runs.runDetails.auditDescription')}.
            <span className="ml-2 text-muted-foreground/60 text-xs">
              {t('runs.runDetails.auditNote')}.{" "}
              <span className="border-b border-dashed border-current cursor-help">Underlined values</span>{" "}
              have a conversion tooltip : hover to see the {currency} equivalent at the rate captured when the deal was entered.
            </span>
          </CardDescription>
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
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedResults.map((result: any) => {
                const dealCurrency = result.dealCurrency || currency;
                return (
                  <TableRow key={result.id}>
                    <TableCell className="font-medium">{result.repName}</TableCell>
                    <TableCell>
                      <div>{result.dealName}</div>
                      {dealCurrency !== currency && (
                        <Badge variant="outline" className="mt-0.5 text-[10px] p-1.5 h-4">
                          {dealCurrency}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <CurrencyCell
                        amount={result.dealAmount}
                        currency={dealCurrency}
                        wsCurrency={result.wsCurrency ?? currency}
                        convertedAmount={result.convertedDealAmount}
                        exchangeRateSnapshot={result.exchangeRateSnapshot}
                        rateSnapshotDate={result.rateSnapshotDate}
                      />
                    </TableCell>
                    <TableCell className="text-right">{formatPercent(result.rateApplied)}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">
                      <CurrencyCell
                        amount={result.commissionAmount}
                        currency={dealCurrency}
                        wsCurrency={result.wsCurrency ?? currency}
                        convertedAmount={result.convertedCommission}
                        exchangeRateSnapshot={result.exchangeRateSnapshot}
                        rateSnapshotDate={result.rateSnapshotDate}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="cursor-help p-1">
                            <Info className="size-4 text-muted-foreground" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="left" className="max-w-sm">
                          <p className="text-xs">{result.calculationNote}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {(!paginatedResults || paginatedResults.length === 0) && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-6 text-muted-foreground">
                    No results found for this run.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {totalResults > LIMIT && (
            <div className="border-t px-4 py-3">
              <DataPagination
                page={page}
                totalPages={totalPages}
                total={totalResults}
                limit={LIMIT}
                onPageChange={setPage}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}