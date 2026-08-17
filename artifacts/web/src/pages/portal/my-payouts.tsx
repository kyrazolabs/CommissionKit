import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  AlertTriangle,
  Calendar,
  Clock,
  DollarSign,
  Loader2,
  MessageSquare,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { SortableTableHead } from "@/components/sortable-table-head";
import { StatCard } from "@/components/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { useTableSort } from "@/hooks/use-table-sort";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Payout {
  id: string;
  repName: string;
  periodStart: string;
  periodEnd: string;
  commissionAmount: number;
  adjustments: number;
  finalAmount: number;
  currency: string;
  status: "pending" | "approved" | "paid" | "disputed" | "on_hold";
  scheduledPaymentDate?: string;
  actualPaymentDate?: string;
  notes?: string;
}

type PayoutSortKey = "commissionAmount" | "finalAmount" | "status";

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending: {
    label: "pending",
    class:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50",
  },
  approved: {
    label: "approved",
    class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50",
  },
  paid: {
    label: "paid",
    class:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50",
  },
  disputed: {
    label: "disputed",
    class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50",
  },
  on_hold: {
    label: "on_hold",
    class: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200/50",
  },
};

function StatusBadge({ status }: { status: string }) {
  const { t } = useTranslation();
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
        cfg.class,
      )}
    >
      {t(`portal.public.myPayouts.${cfg.label}` as any) ?? cfg.label}
    </span>
  );
}

// Guards against Invalid Date crashes — API dates can be empty/null,
// and date-fns format() throws RangeError on Invalid Date.
function formatDateSafe(value: string | null | undefined, pattern: string): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return format(d, pattern);
}

// ─── Dispute Modal ────────────────────────────────────────────────────────────
function DisputeModal({
  payout,
  workspaceId,
  onClose,
}: {
  payout: Payout;
  workspaceId: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/api/disputes`, {
        method: "POST",
        body: JSON.stringify({ payoutId: payout.id, reason }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-payouts", workspaceId] });
      toast({
        title: t("portal.public.myPayouts.disputeSubmitted"),
        description: t("portal.public.myPayouts.disputeReview"),
      });
      onClose();
    },
    onError: (err: any) =>
      toast({
        title: t("common.error", "Error"),
        description: err.message,
        variant: "destructive",
      }),
  });

  const periodLabel = `${formatDateSafe(payout.periodStart, "MMM d")}–${formatDateSafe(payout.periodEnd, "MMM d, yyyy")}`;

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{t("portal.public.myPayouts.disputePayout")}</DialogTitle>
        <DialogDescription>
          {t("portal.public.myPayouts.disputePayoutAmount", { period: periodLabel })}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="rounded-lg border bg-muted/30 p-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{t("portal.public.myPayouts.finalAmount")}</span>
          <span className="font-semibold">
            {formatCurrency(payout.finalAmount, payout.currency)}
          </span>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dispute-reason">{t("portal.public.myPayouts.reason")}</Label>
          <Textarea
            id="dispute-reason"
            placeholder={t("portal.public.myPayouts.reasonPlaceholder")}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground text-right">{reason.length} chars</p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          {t("common.cancel", "Cancel")}
        </Button>
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || reason.length < 10}
          variant="destructive"
        >
          {mutation.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <MessageSquare className="mr-2 size-4" />
          )}
          {t("portal.public.myPayouts.submitDispute")}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Main Page ──────────────────────────────────────────────────────────────
export function MyPayoutsPage() {
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspace();
  const { sub } = useBillingStatus();
  const { toast } = useToast();
  const workspaceId = activeWorkspace?.id ?? "";
  const currency = activeWorkspace?.currency ?? "USD";

  const plan = sub?.plan ?? "free";
  const isGrowthPlus = ["growth", "annual", "pro"].includes(plan);

  const [disputeTarget, setDisputeTarget] = useState<Payout | null>(null);

  // ── Sortable table state (must be before early returns) ──
  const { sort, getSortHandler, sortedData } = useTableSort<PayoutSortKey>();

  const { data: payoutsRaw = {} as any, isLoading } = useQuery<any>({
    queryKey: ["my-payouts", workspaceId],
    queryFn: async () => {
      return apiFetch(`/api/payouts?limit=500`);
    },
    enabled: Boolean(workspaceId),
  });
  const payouts = payoutsRaw?.data ?? (Array.isArray(payoutsRaw) ? payoutsRaw : []);

  // ── Summary calculations ──
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentPeriodPayout = payouts.find((p: any) => {
    const ps = new Date(p.periodStart);
    const pe = new Date(p.periodEnd);
    return ps <= now && pe >= now;
  });

  const lastPaid = [...payouts]
    .filter((p) => p.status === "paid" && p.actualPaymentDate)
    .sort(
      (a, b) => new Date(b.actualPaymentDate!).getTime() - new Date(a.actualPaymentDate!).getTime(),
    )[0];

  const ytdPaid = payouts
    .filter(
      (p: any) =>
        p.status === "paid" &&
        p.actualPaymentDate &&
        new Date(p.actualPaymentDate).getFullYear() === now.getFullYear(),
    )
    .reduce((s: number, p: any) => s + p.finalAmount, 0);

  // ── Sortable payouts ──
  const sortedPayouts = sortedData<Payout>(payouts, (payout, col) => {
    if (col === "commissionAmount") return payout.commissionAmount;
    if (col === "finalAmount") return payout.finalAmount;
    if (col === "status") return payout.status;
    return "";
  });

  // Gating: show upgrade prompt for non-Growth plans
  if (!isGrowthPlus) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">
            {t("portal.public.myPayouts.payoutsTitle")}
          </p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">
            {t("portal.public.myPayouts.myPayoutsTitle")}
          </h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            {t("portal.public.myPayouts.description")}
          </p>
        </div>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              {t("portal.public.myPayouts.growthFeature")}
            </CardTitle>
            <CardDescription>
              {t("portal.public.myPayouts.growthDescription", { plan: "Growth" })}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/dash/billing">{t("portal.public.myPayouts.upgradeToGrowth")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <p className="text-[12px] font-semibold text-primary mb-1">
          {t("portal.public.myPayouts.payoutsTitle")}
        </p>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">
          {t("portal.public.myPayouts.myPayoutsTitle")}
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">
          {t("portal.public.myPayouts.payoutsDescription")}
        </p>
      </div>

      {/* Summary stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label={t("portal.public.myPayouts.currentPeriodEarnings")}
            value={
              currentPeriodPayout ? formatCurrency(currentPeriodPayout.finalAmount, currency) : "–"
            }
            icon={TrendingUp}
            tooltip={t("portal.public.myPayouts.currentPeriodEarnings")}
          />
          <StatCard
            label={t("portal.public.myPayouts.lastPayout")}
            value={lastPaid ? formatCurrency(lastPaid.finalAmount, currency) : "–"}
            icon={DollarSign}
            tooltip={t("portal.public.myPayouts.lastPayout")}
          />
          <StatCard
            label={t("portal.public.myPayouts.lastPaymentDate")}
            value={
              lastPaid?.actualPaymentDate
                ? formatDateSafe(lastPaid.actualPaymentDate, "MMM d, yyyy")
                : "–"
            }
            icon={Calendar}
            tooltip={t("portal.public.myPayouts.lastPaymentDate")}
          />
          <StatCard
            label={t("portal.public.myPayouts.ytdTotalPaid")}
            value={formatCurrency(ytdPaid, currency)}
            icon={Clock}
            tooltip={t("portal.public.myPayouts.ytdTotalPaid")}
          />
        </div>
      )}

      {/* Payout history table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold">
            {t("portal.public.myPayouts.payoutHistory")}
          </CardTitle>
          <CardDescription className="text-xs">
            {t("portal.public.myPayouts.payoutHistoryDesc")}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-14">
              <DollarSign className="size-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold">
                {t("portal.public.myPayouts.noPayoutsYet")}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t("portal.public.myPayouts.noPayoutsDescription")}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("portal.public.myPayouts.period")}</TableHead>
                  <SortableTableHead
                    label={t("portal.public.myPayouts.earned")}
                    column="commissionAmount"
                    sortColumn={sort.column}
                    sortDirection={sort.direction}
                    onSort={getSortHandler}
                    align="right"
                  />
                  <TableHead className="text-right">
                    {t("portal.public.myPayouts.adjustments")}
                  </TableHead>
                  <SortableTableHead
                    label={t("portal.public.myPayouts.final")}
                    column="finalAmount"
                    sortColumn={sort.column}
                    sortDirection={sort.direction}
                    onSort={getSortHandler}
                    align="right"
                  />
                  <SortableTableHead
                    label={t("portal.public.myPayouts.status")}
                    column="status"
                    sortColumn={sort.column}
                    sortDirection={sort.direction}
                    onSort={getSortHandler}
                  />
                  <TableHead>{t("portal.public.myPayouts.paymentDate")}</TableHead>
                  <TableHead className="text-right">
                    {t("portal.public.myPayouts.action")}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedPayouts.map((payout: any) => (
                  <TableRow key={payout.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDateSafe(payout.periodStart, "MMM d")}–
                      {formatDateSafe(payout.periodEnd, "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatCurrency(payout.commissionAmount, payout.currency)}
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right text-sm tabular-nums",
                        payout.adjustments < 0
                          ? "text-red-600"
                          : payout.adjustments > 0
                            ? "text-green-600"
                            : "text-muted-foreground",
                      )}
                    >
                      {payout.adjustments !== 0
                        ? (payout.adjustments > 0 ? "+" : "") +
                          formatCurrency(payout.adjustments, payout.currency)
                        : "–"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      {formatCurrency(payout.finalAmount, payout.currency)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={payout.status} />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payout.actualPaymentDate
                        ? formatDateSafe(payout.actualPaymentDate, "MMM d, yyyy")
                        : payout.scheduledPaymentDate
                          ? t("portal.public.myPayouts.expected", {
                              date: formatDateSafe(payout.scheduledPaymentDate, "MMM d"),
                            })
                          : "–"}
                    </TableCell>
                    <TableCell className="text-right">
                      {["pending", "approved"].includes(payout.status) &&
                        payout.status !== "disputed" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
                            onClick={() => setDisputeTarget(payout)}
                          >
                            <AlertTriangle className="mr-1.5 size-3" />
                            {t("portal.public.myPayouts.dispute")}
                          </Button>
                        )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dispute modal */}
      <Dialog open={!!disputeTarget} onOpenChange={() => setDisputeTarget(null)}>
        {disputeTarget && (
          <DisputeModal
            payout={disputeTarget}
            workspaceId={workspaceId}
            onClose={() => setDisputeTarget(null)}
          />
        )}
      </Dialog>
    </div>
  );
}
