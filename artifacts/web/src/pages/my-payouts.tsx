import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { DollarSign, Calendar, TrendingUp, Clock, AlertTriangle, Loader2, MessageSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";



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

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  pending:  { label: "Pending",  class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50" },
  approved: { label: "Approved", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50" },
  paid:     { label: "Paid",     class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50" },
  disputed: { label: "Disputed", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50" },
  on_hold:  { label: "On Hold",  class: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200/50" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", cfg.class)}>
      {cfg.label}
    </span>
  );
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
      toast({ title: "Dispute submitted", description: "Your admin will review it shortly." });
      onClose();
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Dispute Payout</DialogTitle>
        <DialogDescription>
          Dispute your payout for{" "}
          <strong>{format(new Date(payout.periodStart), "MMM d")}–{format(new Date(payout.periodEnd), "MMM d, yyyy")}</strong>.
          Provide a detailed reason below.
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4 py-2">
        <div className="rounded-lg border bg-muted/30 p-3 flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Final Amount</span>
          <span className="font-semibold">{formatCurrency(payout.finalAmount, payout.currency)}</span>
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dispute-reason">Reason <span className="text-muted-foreground text-xs">(min 10 characters)</span></Label>
          <Textarea
            id="dispute-reason"
            placeholder="Describe why you're disputing this payout (e.g. calculation error, missing deals…)"
            value={reason}
            onChange={e => setReason(e.target.value)}
            rows={4}
          />
          <p className="text-xs text-muted-foreground text-right">{reason.length} chars</p>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || reason.length < 10}
          variant="destructive"
        >
          {mutation.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MessageSquare className="mr-2 size-4" />}
          Submit Dispute
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Summary stat card ────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  return (
    <Card className="border-border">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <Icon className={cn("size-4", color)} />
        </div>
        <p className="text-xl font-semibold text-foreground tabular-nums">{value}</p>
      </CardContent>
    </Card>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function MyPayoutsPage() {
  const { activeWorkspace } = useWorkspace();
  const { sub } = useBillingStatus();
  const { toast } = useToast();
  const workspaceId = activeWorkspace?.id ?? "";
  const currency = activeWorkspace?.currency ?? "USD";

  const plan = sub?.plan ?? "free";
  const isGrowthPlus = ["growth", "annual", "flex"].includes(plan);

  const [disputeTarget, setDisputeTarget] = useState<Payout | null>(null);

  const { data: payouts = [], isLoading } = useQuery<Payout[]>({
    queryKey: ["my-payouts", workspaceId],
    queryFn: async () => {
      return apiFetch(`/api/payouts`);
    },
    enabled: Boolean(workspaceId),
  });

  // ── Summary calculations ──
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const currentPeriodPayout = payouts.find(p => {
    const ps = new Date(p.periodStart);
    const pe = new Date(p.periodEnd);
    return ps <= now && pe >= now;
  });

  const lastPaid = [...payouts]
    .filter(p => p.status === "paid" && p.actualPaymentDate)
    .sort((a, b) => new Date(b.actualPaymentDate!).getTime() - new Date(a.actualPaymentDate!).getTime())[0];

  const ytdPaid = payouts
    .filter(p => p.status === "paid" && p.actualPaymentDate && new Date(p.actualPaymentDate).getFullYear() === now.getFullYear())
    .reduce((s, p) => s + p.finalAmount, 0);

  // Gating: show upgrade prompt for non-Growth plans
  if (!isGrowthPlus) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Payouts</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">My Payouts</h1>
          <p className="text-[14px] text-muted-foreground mt-1">View your commission payout history.</p>
        </div>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <TrendingUp className="size-4 text-primary" />
              Rep Payout Portal : Growth Feature
            </CardTitle>
            <CardDescription>
              The self-service payout portal is available on the <strong>Growth</strong> plan and above.
              Upgrade to view your full payout history, track payment dates, and dispute payouts.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/billing">Upgrade to Growth</a>
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
        <p className="text-[12px] font-semibold text-primary mb-1">Payouts</p>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">My Payouts</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Your commission payout history and payment status.</p>
      </div>

      {/* Summary stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Current Period Earnings"
            value={currentPeriodPayout ? formatCurrency(currentPeriodPayout.finalAmount, currency) : ":"}
            icon={TrendingUp}
            color="text-primary"
          />
          <StatCard
            label="Last Payout"
            value={lastPaid ? formatCurrency(lastPaid.finalAmount, currency) : ":"}
            icon={DollarSign}
            color="text-green-500"
          />
          <StatCard
            label="Last Payment Date"
            value={lastPaid?.actualPaymentDate ? format(new Date(lastPaid.actualPaymentDate), "MMM d, yyyy") : ":"}
            icon={Calendar}
            color="text-blue-500"
          />
          <StatCard
            label="YTD Total Paid"
            value={formatCurrency(ytdPaid, currency)}
            icon={Clock}
            color="text-amber-500"
          />
        </div>
      )}

      {/* Payout history table */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold">Payout History</CardTitle>
          <CardDescription className="text-xs">Your complete commission payout record. Read-only.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : payouts.length === 0 ? (
            <div className="text-center py-14">
              <DollarSign className="size-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold">No payouts yet</h3>
              <p className="text-sm text-muted-foreground mt-1">Your payouts will appear here once your admin creates them.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Earned</TableHead>
                  <TableHead className="text-right">Adjustments</TableHead>
                  <TableHead className="text-right">Final</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment Date</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map(payout => (
                  <TableRow key={payout.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(payout.periodStart), "MMM d")}–{format(new Date(payout.periodEnd), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right text-sm tabular-nums">
                      {formatCurrency(payout.commissionAmount, payout.currency)}
                    </TableCell>
                    <TableCell className={cn(
                      "text-right text-sm tabular-nums",
                      payout.adjustments < 0 ? "text-red-600" : payout.adjustments > 0 ? "text-green-600" : "text-muted-foreground",
                    )}>
                      {payout.adjustments !== 0
                        ? (payout.adjustments > 0 ? "+" : "") + formatCurrency(payout.adjustments, payout.currency)
                        : ":"}
                    </TableCell>
                    <TableCell className="text-right text-sm font-semibold tabular-nums">
                      {formatCurrency(payout.finalAmount, payout.currency)}
                    </TableCell>
                    <TableCell><StatusBadge status={payout.status} /></TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {payout.actualPaymentDate
                        ? format(new Date(payout.actualPaymentDate), "MMM d, yyyy")
                        : payout.scheduledPaymentDate
                        ? <span className="text-xs">Expected {format(new Date(payout.scheduledPaymentDate), "MMM d")}</span>
                        : ":"}
                    </TableCell>
                    <TableCell className="text-right">
                      {["pending", "approved"].includes(payout.status) && payout.status !== "disputed" && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10 h-7"
                          onClick={() => setDisputeTarget(payout)}
                        >
                          <AlertTriangle className="mr-1.5 size-3" />
                          Dispute
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
          <DisputeModal payout={disputeTarget} workspaceId={workspaceId} onClose={() => setDisputeTarget(null)} />
        )}
      </Dialog>
    </div>
  );
}
