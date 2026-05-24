import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "wouter";
import {
  AlertTriangle, CheckCircle2, Clock, MessageSquare, Loader2,
  ChevronDown, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-page-meta";
import { useSyncStore } from "@/hooks/use-sync-store";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Dispute {
  id: string;
  payoutId: string;
  repId: string;
  repName: string;
  reason: string;
  status: "open" | "under_review" | "resolved";
  adminNotes?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  payout?: {
    id: string;
    finalAmount: number;
    currency: string;
    periodStart: string;
    periodEnd: string;
    status: string;
  };
}

// ─── Status config ────────────────────────────────────────────────────────────
const DISPUTE_STATUS: Record<string, { label: string; class: string; icon: any }> = {
  open:         { label: "Open",         class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50",     icon: AlertTriangle },
  under_review: { label: "Under Review", class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50", icon: Clock },
  resolved:     { label: "Resolved",     class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50", icon: CheckCircle2 },
};

function DisputeStatusBadge({ status }: { status: string }) {
  const cfg = DISPUTE_STATUS[status] ?? DISPUTE_STATUS.open;
  const Icon = cfg.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", cfg.class)}>
      <Icon className="size-3" />{cfg.label}
    </span>
  );
}

// ─── Resolve Modal ────────────────────────────────────────────────────────────
function ResolveModal({
  dispute,
  workspaceId,
  onClose,
}: {
  dispute: Dispute;
  workspaceId: string;
  onClose: () => void;
}) {
  const [adminNotes, setAdminNotes] = useState(dispute.adminNotes ?? "");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { setSyncError } = useSyncStore();

  const mutation = useMutation({
    mutationFn: async (body: any) => {
      return apiFetch(`/api/disputes/${dispute.id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ["/api/disputes"] });
      const previous = queryClient.getQueriesData({ queryKey: ["/api/disputes"] });

      queryClient.setQueriesData({ queryKey: ["/api/disputes"] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map(d => {
          if (d.id !== dispute.id) return d;
          return {
            ...d,
            status: body.status,
            adminNotes: body.adminNotes,
            resolvedAt: body.status === "resolved" ? new Date().toISOString() : d.resolvedAt,
          };
        });
      });
      return { previous };
    },
    onError: (err: any, variables, context: any) => {
      setSyncError(true);
      if (context?.previous) {
        context.previous.forEach(([queryKey, oldData]: [any, any]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/disputes"] });
    }
  });

  const handleAction = (status: string) => {
    mutation.mutate({ status, adminNotes }, {
      onSuccess: () => toast({ title: "Dispute updated" })
    });
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-lg">
      <DialogHeader>
        <DialogTitle>Resolve Dispute</DialogTitle>
        <DialogDescription>
          Resolve the dispute from <strong>{dispute.repName}</strong>. The payout will return to "Approved" status
          and the rep will be notified with your notes.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-2">
        {/* Dispute info */}
        <div className="rounded-lg border bg-muted/30 p-3 space-y-2">
          {dispute.payout && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Payout Period</span>
              <span className="font-medium">
                {format(new Date(dispute.payout.periodStart), "MMM d")}–{format(new Date(dispute.payout.periodEnd), "MMM d, yyyy")}
              </span>
            </div>
          )}
          {dispute.payout && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{formatCurrency(dispute.payout.finalAmount, dispute.payout.currency)}</span>
            </div>
          )}
          <div className="border-t border-border/60 pt-2 mt-2">
            <p className="text-xs font-semibold text-muted-foreground mb-1">Rep's Reason</p>
            <p className="text-sm leading-relaxed">{dispute.reason}</p>
          </div>
        </div>

        <div className="grid gap-2">
          <Label>Admin Notes (sent to rep)</Label>
          <Textarea
            placeholder="Explain the resolution…"
            value={adminNotes}
            onChange={e => setAdminNotes(e.target.value)}
            rows={3}
          />
        </div>
      </div>

      <DialogFooter className="gap-2">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          variant="outline"
          onClick={() => handleAction("under_review")}
        >
          <Clock className="mr-2 size-4" />Mark Under Review
        </Button>
        <Button
          onClick={() => handleAction("resolved")}
        >
          <CheckCircle2 className="mr-2 size-4" />
          Resolve
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Dispute Row ──────────────────────────────────────────────────────────────
function DisputeRow({ dispute, onAction }: { dispute: Dispute; onAction: (d: Dispute) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow className={dispute.status === "resolved" ? "opacity-60" : ""}>
        <TableCell>
          <button onClick={() => setExpanded(v => !v)} className="text-muted-foreground hover:text-foreground">
            {expanded ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
          </button>
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <div className="size-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
              {dispute.repName.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </div>
            <span className="text-sm font-medium">{dispute.repName}</span>
          </div>
        </TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {dispute.payout
            ? `${format(new Date(dispute.payout.periodStart), "MMM d")}–${format(new Date(dispute.payout.periodEnd), "MMM d, yyyy")}`
            : ":"}
        </TableCell>
        <TableCell className="text-sm tabular-nums font-medium">
          {dispute.payout ? formatCurrency(dispute.payout.finalAmount, dispute.payout.currency) : ":"}
        </TableCell>
        <TableCell className="max-w-[200px]">
          <p className="text-sm text-muted-foreground truncate">{dispute.reason}</p>
        </TableCell>
        <TableCell><DisputeStatusBadge status={dispute.status} /></TableCell>
        <TableCell className="text-sm text-muted-foreground">
          {format(new Date(dispute.createdAt), "MMM d, yyyy")}
        </TableCell>
        <TableCell className="text-right">
          {dispute.status !== "resolved" && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onAction(dispute)}>
              Review
            </Button>
          )}
        </TableCell>
      </TableRow>
      {expanded && (
        <TableRow>
          <TableCell colSpan={8} className="bg-muted/20 p-3">
            <div className="space-y-2 text-sm">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Reason</p>
                <p>{dispute.reason}</p>
              </div>
              {dispute.adminNotes && (
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">Admin Notes</p>
                  <p className="text-muted-foreground">{dispute.adminNotes}</p>
                </div>
              )}
              {dispute.resolvedAt && (
                <p className="text-xs text-muted-foreground">Resolved on {format(new Date(dispute.resolvedAt), "MMM d, yyyy 'at' h:mm a")}</p>
              )}
            </div>
          </TableCell>
        </TableRow>
      )}
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function DisputesPage() {
  usePageMeta({ title: "Disputes", description: "Review and resolve commission disputes.", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const { hasPermission, isLoading: roleLoading } = useRole();
  const { sub } = useBillingStatus();
  const workspaceId = activeWorkspace?.id ?? "";
  const [resolveTarget, setResolveTarget] = useState<Dispute | null>(null);
  const [showResolved, setShowResolved] = useState(false);

  const plan = sub?.plan ?? "free";
  const isGrowthPlus = ["growth", "annual", "flex"].includes(plan);

  const { data: disputes = [], isLoading } = useQuery<Dispute[]>({
    queryKey: ["disputes", workspaceId],
    queryFn: async () => {
      return apiFetch(`/api/disputes`);
    },
    enabled: Boolean(workspaceId) && hasPermission("disputes", "read") && !roleLoading,
  });

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="size-10" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!hasPermission("disputes", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <AlertTriangle className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Insufficient Permissions</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to manage disputes.</p>
      </div>
    );
  }

  if (!isGrowthPlus) {
    return (
      <div className="space-y-6">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Operations</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Dispute Management</h1>
        </div>
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <MessageSquare className="size-4 text-primary" />
              Dispute Management : Growth Feature
            </CardTitle>
            <CardDescription>
              The payout dispute workflow requires the <strong>Growth</strong> plan or above.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild><Link href="/dash/billing">Upgrade to Growth</Link></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const openDisputes = disputes.filter(d => d.status !== "resolved");
  const resolvedDisputes = disputes.filter(d => d.status === "resolved");

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Operations</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Dispute Management</h1>
          <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">
            Review and resolve payout disputes submitted by reps.
          </p>
        </div>
        {openDisputes.length > 0 && (
          <div className="flex items-center gap-2 px-3 h-10 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-sm font-semibold border border-red-200/50 shadow-sm">
            <AlertTriangle className="size-4" />
            {openDisputes.length} open dispute{openDisputes.length !== 1 ? "s" : ""}
          </div>
        )}
      </div>

      {/* Open Disputes */}
      <Card>
        <CardHeader className="pb-3 border-b border-border">
          <CardTitle className="text-sm font-semibold">Open Disputes</CardTitle>
          <CardDescription className="text-xs">Disputes requiring your attention.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-2">
              {[1, 2].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : openDisputes.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="size-10 text-green-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold">No open disputes</h3>
              <p className="text-sm text-muted-foreground mt-1">All disputes have been resolved.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>Rep</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {openDisputes.map(d => (
                  <DisputeRow key={d.id} dispute={d} onAction={setResolveTarget} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resolved archive */}
      {resolvedDisputes.length > 0 && (
        <div>
          <button
            onClick={() => setShowResolved(v => !v)}
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-3"
          >
            {showResolved ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
            Resolved Disputes ({resolvedDisputes.length})
          </button>

          {showResolved && (
            <Card className="border-border opacity-80">
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-8" />
                      <TableHead>Rep</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {resolvedDisputes.map(d => (
                      <DisputeRow key={d.id} dispute={d} onAction={setResolveTarget} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Resolve modal */}
      <Dialog open={!!resolveTarget} onOpenChange={() => setResolveTarget(null)}>
        {resolveTarget && (
          <ResolveModal dispute={resolveTarget} workspaceId={workspaceId} onClose={() => setResolveTarget(null)} />
        )}
      </Dialog>
    </div>
  );
}
