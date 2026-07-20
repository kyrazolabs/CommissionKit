import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  DollarSign, CheckCircle2, Clock, AlertTriangle, Download,
  MoreHorizontal, Check, Filter, Search, Plus, Loader2,
  XCircle, ChevronDown, ChevronRight,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/ui/data-pagination";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/number-input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { DateRangePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useRepSearch } from "@/hooks/use-rep-search";
import { RepCombobox } from "@/components/rep-combobox";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Payout {
  id: string;
  repId: string;
  repName: string;
  periodStart: string;
  periodEnd: string;
  commissionAmount: number;
  adjustments: number;
  finalAmount: number;
  currency: string;
  status: "pending" | "approved" | "paid" | "disputed" | "on_hold";
  paymentMethod?: string;
  scheduledPaymentDate?: string;
  actualPaymentDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  pending: { label: "Pending", class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50" },
  approved: { label: "Approved", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50" },
  paid: { label: "Paid", class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50" },
  disputed: { label: "Disputed", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50" },
  on_hold: { label: "On Hold", class: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200/50" },
};

const STATUS_I18N: Record<string, string> = {
  pending: "payouts.pending", approved: "payouts.approved", paid: "payouts.paid",
  disputed: "payouts.disputed", on_hold: "payouts.onHold",
};

function StatusBadge({ status, i18nKey }: { status: Payout["status"]; i18nKey?: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const label = i18nKey ?? cfg.label;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", cfg.class)}>
      {label}
    </span>
  );
}

function useFetchPayouts(workspaceId: string, filters: any, search: string, page: number, limit: number) {
  return useQuery({
    queryKey: ["payouts", workspaceId, filters, search, page],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);
      if (filters.repId) params.set("repId", filters.repId);
      if (search.trim()) params.set("search", search.trim());
      params.set("page", String(page));
      params.set("limit", String(limit));
      return apiFetch(`/api/payouts?${params.toString()}`) as Promise<{ data: Payout[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>;
    },
    enabled: Boolean(workspaceId),
  });
}

function usePayoutMutation(workspaceId: string) {
  const queryClient = useQueryClient();
  const { setSyncError } = useSyncStore();

  return useMutation({
    mutationFn: async ({ id, action, body }: { id: string; action: string; body: any }) => {
      return apiFetch(`/api/payouts/${id}/${action}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    },
    onMutate: async ({ id, action, body }) => {
      await queryClient.cancelQueries({ queryKey: ["payouts", workspaceId] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ["payouts", workspaceId] });

      queryClient.setQueriesData({ queryKey: ["payouts", workspaceId] }, (old: any) => {
        if (!Array.isArray(old)) return old;
        return old.map(p => {
          if (p.id !== id) return p;
          let updated = { ...p };
          if (action === "status") {
            updated.status = body.status;
          } else if (action === "adjust") {
            updated.adjustments = (updated.adjustments || 0) + (body.amount || 0);
            updated.finalAmount = updated.commissionAmount + updated.adjustments;
          }
          return updated;
        });
      });
      return { previousQueries };
    },
    onError: (err: any, variables, context: any) => {
      setSyncError(true);
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, oldData]: [any, any]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts", workspaceId] });
    }
  });
}

// ─── Summary Cards ────────────────────────────────────────────────────────────
function SummaryCards({ payouts, currency }: { payouts: Payout[]; currency: string }) {
  const totalPending = payouts.filter(p => p.status === "pending").reduce((s, p) => s + p.finalAmount, 0);
  const totalApproved = payouts.filter(p => p.status === "approved").reduce((s, p) => s + p.finalAmount, 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const totalPaidMonth = payouts
    .filter(p => p.status === "paid" && p.actualPaymentDate?.startsWith(thisMonth))
    .reduce((s, p) => s + p.finalAmount, 0);
  const openDisputes = payouts.filter(p => p.status === "disputed").length;

  const cards = [
    { label: "Total Pending", value: formatCurrency(totalPending, currency), icon: Clock, delta: "Awaiting approval" },
    { label: "Total Approved", value: formatCurrency(totalApproved, currency), icon: CheckCircle2, delta: "Ready for payment" },
    { label: "Paid This Month", value: formatCurrency(totalPaidMonth, currency), icon: DollarSign, delta: "Successfully disbursed" },
    { label: "Open Disputes", value: String(openDisputes), icon: AlertTriangle, delta: "Require resolution" },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {cards.map(({ label, value, delta, icon: Icon }) => (
        <div
          key={label}
          className="bg-card border border-card-border rounded-2xl px-[22px] py-5"
          style={{ boxShadow: "var(--shadow-card)" }}
        >
          <div className="flex items-center justify-between mb-3.5">
            <span className="text-[12px] font-medium text-muted-foreground">{label}</span>
            <div className="flex size-7 items-center justify-center rounded-[10px] bg-secondary">
              <Icon className="size-3.5 text-primary" />
            </div>
          </div>
          <div className="text-[26px] font-semibold tracking-tight text-foreground leading-none">{value}</div>
          <p className="text-[12px] text-primary font-medium mt-1.5">{delta}</p>
        </div>
      ))}
    </div>
  );
}

// ─── Adjust Modal ─────────────────────────────────────────────────────────────
function AdjustModal({ payout, workspaceId, onClose }: { payout: Payout; workspaceId: string; onClose: () => void }) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const { toast } = useToast();
  const mutation = usePayoutMutation(workspaceId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num)) return;
    mutation.mutate(
      { id: payout.id, action: "adjust", body: { amount: num, note } },
      {
        onSuccess: () => toast({ title: "Adjustment applied" }),
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      }
    );
    onClose();
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Add Adjustment</DialogTitle>
        <DialogDescription>
          Adjust the payout for <strong>{payout.repName}</strong>. Use a negative value for clawbacks.
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid gap-2">
          <Label>Amount (+ bonus / − clawback)</Label>
          <NumberInput
            placeholder="e.g. -150.00"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="grid gap-2">
          <Label>Note</Label>
          <Textarea placeholder="Reason for adjustment…" value={note} onChange={e => setNote(e.target.value)} rows={3} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Apply</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// ─── Create Payout Modal ──────────────────────────────────────────────────────
function CreatePayoutModal({ workspaceId, open, setOpen }: { workspaceId: string; open: boolean; setOpen: (v: boolean) => void }) {
  const { t } = useTranslation();
  const [repId, setRepId] = useState("");
  const [periodStart, setPeriodStart] = useState<Date | undefined>(undefined);
  const [periodEnd, setPeriodEnd] = useState<Date | undefined>(undefined);
  const [amount, setAmount] = useState("");
  const [notes, setNotes] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: repsRaw } = useQuery({
    queryKey: ["reps-list", workspaceId],
    queryFn: async () => {
      return apiFetch(`/api/reps?limit=500`);
    },
  });
  const reps = (repsRaw as any)?.data ?? (Array.isArray(repsRaw) ? repsRaw : []);
  const { reps: searchReps, searching: repSearching, onSearch: onRepSearch } = useRepSearch(workspaceId);

  const { setSyncError } = useSyncStore();
  const mutation = useMutation({
    mutationFn: async (body: any) => {
      return apiFetch(`/api/payouts`, {
        method: "POST",
        body: JSON.stringify(body),
      });
    },
    onMutate: async (body) => {
      await queryClient.cancelQueries({ queryKey: ["payouts", workspaceId] });
      const previousQueries = queryClient.getQueriesData({ queryKey: ["payouts", workspaceId] });

      const optimisticPayout = {
        id: `temp-${Date.now()}`,
        repId: body.repId,
        repName: reps?.find((r: any) => r.id === body.repId)?.name || "Unknown",
        periodStart: body.periodStart,
        periodEnd: body.periodEnd,
        commissionAmount: body.commissionAmount,
        adjustments: 0,
        finalAmount: body.commissionAmount,
        currency: "USD",
        status: "pending",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueriesData({ queryKey: ["payouts", workspaceId] }, (old: any) => {
        return Array.isArray(old) ? [optimisticPayout, ...old] : [optimisticPayout];
      });
      return { previousQueries };
    },
    onError: (err: any, variables, context: any) => {
      setSyncError(true);
      if (context?.previousQueries) {
        context.previousQueries.forEach(([queryKey, oldData]: [any, any]) => {
          queryClient.setQueryData(queryKey, oldData);
        });
      }
      toast({ title: "Failed to create payout", description: "Recovering your input...", variant: "destructive" });
      setOpen(true);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["payouts", workspaceId] });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!periodStart || !periodEnd) return;
    mutation.mutate({
      repId,
      periodStart: format(periodStart, "yyyy-MM-dd"),
      periodEnd: format(periodEnd, "yyyy-MM-dd"),
      commissionAmount: parseFloat(amount),
      notes
    }, {
      onSuccess: () => {
        toast({ title: "Payout created" });
        setRepId(""); setPeriodStart(undefined); setPeriodEnd(undefined); setAmount(""); setNotes("");
      }
    });
    setOpen(false);
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Payout</DialogTitle>
        <DialogDescription>Manually create a commission payout for a rep.</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 py-2">
        <div className="grid gap-2">
          <Label>Sales Rep</Label>
          <RepCombobox
            reps={searchReps}
            onSearch={onRepSearch}
            searching={repSearching}
            value={repId}
            onChange={setRepId}
            placeholder={t("payouts.selectRep")}
          />
        </div>
        <div className="grid gap-2">
          <Label>Payout Period</Label>
          <DateRangePicker
            from={periodStart}
            to={periodEnd}
            onRangeChange={(range) => {
              setPeriodStart(range?.from);
              setPeriodEnd(range?.to);
            }}
            placeholder={t("payouts.selectPeriod")}
            numberOfMonths={2}
          />
        </div>
        <div className="grid gap-2">
          <Label>Commission Amount</Label>
          <NumberInput placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} required />
        </div>
        <div className="grid gap-2">
          <Label>Notes (optional)</Label>
          <Textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button type="submit">Create Payout</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

// ─── Status Confirmation Modal ───────────────────────────────────────────────
function StatusConfirmModal({
  payout,
  targetStatus,
  onConfirm,
  onClose
}: {
  payout: Payout;
  targetStatus: string;
  onConfirm: () => void;
  onClose: () => void;
}) {
  const isFinal = targetStatus === "paid";
  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isFinal ? <AlertTriangle className="size-5 text-amber-500" /> : <CheckCircle2 className="size-5 text-blue-500" />}
          Confirm Status Change
        </DialogTitle>
        <DialogDescription>
          Are you sure you want to change the status for <strong>{payout.repName}</strong> to <span className="font-semibold text-foreground">{targetStatus.toUpperCase()}</span>?
          {isFinal && (
            <p className="mt-2 text-destructive font-semibold">
              Warning: Marking a payout as PAID will finalize it. You will no longer be able to edit or adjust this record.
            </p>
          )}
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button onClick={onConfirm} variant={isFinal ? "destructive" : "default"}>
          Confirm
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function PayoutsPage() {
  usePageMeta({ title: "Payouts", description: "Manage and track commission payouts for your team.", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const { hasPermission, isLoading: roleLoading } = useRole();
  const { toast } = useToast();
  const { sub, loading: subLoading } = useBillingStatus();
  const queryClient = useQueryClient();

  const workspaceId = activeWorkspace?.id || "";

  const currency = activeWorkspace?.currency ?? "USD";
  const plan = sub?.plan ?? "free";
  const isGrowthPlus = ["growth", "annual", "pro"].includes(plan);

  const [filters, setFilters] = useState({ status: "", repId: "" });
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [adjustTarget, setAdjustTarget] = useState<Payout | null>(null);
  const [confirmTarget, setConfirmTarget] = useState<{ payout: Payout; status: string; extra?: any } | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [expandedPayoutId, setExpandedPayoutId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  const { data: payoutsResult, isLoading, error } = useFetchPayouts(workspaceId, filters, search, page, LIMIT);
  const payouts = payoutsResult?.data ?? [];
  const pagination = payoutsResult?.pagination;
  const mutation = usePayoutMutation(workspaceId);

  // Reset to page 1 when server-side filters change
  useEffect(() => { setPage(1); }, [filters.status, filters.repId]);

  if (roleLoading || subLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-28 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!hasPermission("payouts", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <AlertTriangle className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view payouts.</p>
      </div>
    );
  }

  const executeStatusChange = (payout: Payout, status: string, extra?: any) => {
    mutation.mutate(
      { id: payout.id, action: "status", body: { status, ...extra } },
      {
        onSuccess: () => {
          toast({ title: "Status updated" });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
      },
    );
    setConfirmTarget(null);
  };

  const handleBulkApprove = async () => {
    if (!isGrowthPlus) return;
    try {
      const data = await apiFetch(`/api/payouts/bulk-approve`, {
        method: "POST",
        body: JSON.stringify({ ids: [...selectedIds] }),
      });
      toast({ title: t("payouts.bulkApproved", { count: data.approved }) });
      setSelectedIds(new Set());
      queryClient.invalidateQueries({ queryKey: ["payouts", workspaceId] });
    } catch {
      toast({ title: t("payouts.bulkApproveFailed"), variant: "destructive" });
    } finally {
      setBulkLoading(false);
    }
  };

  const handleExport = async () => {
    if (!isGrowthPlus) return;
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set("status", filters.status);

      const workspaceId = localStorage.getItem("ck_active_workspace");
      const res = await fetch(`${API_URL}/api/payouts/export?${params.toString()}`, {
        credentials: "include",
        headers: {
          "x-workspace-id": workspaceId ?? ""
        },
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Export failed");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payouts-${format(new Date(), "yyyy-MM-dd")}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      toast({ title: "Export failed", description: err.message, variant: "destructive" });
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const pendingIds = payouts.filter((p: Payout) => p.status === "pending").map((p: Payout) => p.id);
    if (pendingIds.every((id: string) => selectedIds.has(id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendingIds));
    }
  };

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Operations</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Payout Tracker</h1>
          <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">
            Manage and approve commission payouts for your team.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isGrowthPlus ? (
            <Button variant="outline" onClick={handleExport} className="px-4 shadow-sm gap-2">
              <Download className="size-4" />
              Export CSV
            </Button>
          ) : (
            <Button variant="outline" disabled title="Growth plan required" className="px-4 shadow-sm gap-2 opacity-60">
              <Download className="size-4" />
              Export CSV
            </Button>
          )}
          <Button className="px-4 shadow-sm gap-2" onClick={() => setCreateOpen(true)}>
            <Plus className="size-4" />
            New Payout
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-24" />)}
        </div>
      ) : (
        <SummaryCards payouts={payouts} currency={currency} />
      )}

      {/* Filters & bulk actions */}
      <Card>
        <div className="px-5 pt-4 pb-3 border-b border-border flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder={t("payouts.searchByRep")} className="pl-8" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <Select value={filters.status || "all"} onValueChange={v => setFilters(f => ({ ...f, status: v === "all" ? "" : v }))}>
            <SelectTrigger className="w-36">
              <Filter className="size-3.5 mr-1.5 text-muted-foreground" />
              <SelectValue placeholder={t("common.allStatuses")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="disputed">Disputed</SelectItem>
              <SelectItem value="on_hold">On Hold</SelectItem>
            </SelectContent>
          </Select>

          {selectedIds.size > 0 && (
            <Button
              onClick={handleBulkApprove}
              disabled={bulkLoading || !isGrowthPlus}
              className="gap-2"
            >
              {bulkLoading ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-3.5" />}
              Approve {selectedIds.size} Selected
              {!isGrowthPlus && <span className="ml-1 text-[10px] opacity-70">(Growth+)</span>}
            </Button>
          )}
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-2">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
           ) : payouts.length === 0 ? (
            <div className="text-center py-14">
              <DollarSign className="size-10 text-muted-foreground mx-auto mb-3" />
              <h3 className="text-base font-semibold">No payouts found</h3>
              <p className="text-sm text-muted-foreground mt-1">Create a payout or adjust your filters.</p>
            </div>
          ) : (
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={
                        payouts.filter((p: Payout) => p.status === "pending").length > 0 &&
                        payouts.filter((p: Payout) => p.status === "pending").every((p: Payout) => selectedIds.has(p.id))
                      }
                      onCheckedChange={toggleAll}
                    />
                  </TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead className="text-right">Adjustments</TableHead>
                  <TableHead className="text-right">Final</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead className="w-10"></TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout: Payout) => {
                  const isPaid = payout.status === "paid";
                  return (
                    <>
                    <TableRow key={payout.id} className={cn(selectedIds.has(payout.id) ? "bg-primary/5" : "", isPaid && "opacity-80 bg-muted/20")}>
                      <TableCell>
                        {payout.status === "pending" && (
                          <Checkbox
                            checked={selectedIds.has(payout.id)}
                            onCheckedChange={() => toggleSelect(payout.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="size-7 rounded-full bg-primary/10 text-primary text-[10px] font-semibold flex items-center justify-center shrink-0">
                            {payout.repName.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                          </div>
                          <span className="text-sm font-medium">{payout.repName}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(payout.periodStart), "MMM d")}–{format(new Date(payout.periodEnd), "MMM d, yyyy")}
                      </TableCell>
                      <TableCell className="text-right text-sm tabular-nums">
                        {formatCurrency(payout.commissionAmount, payout.currency)}
                      </TableCell>
                      <TableCell className={cn("text-right text-sm tabular-nums", payout.adjustments < 0 ? "text-red-600" : payout.adjustments > 0 ? "text-green-600" : "text-muted-foreground")}>
                        {payout.adjustments !== 0 ? (payout.adjustments > 0 ? "+" : "") + formatCurrency(payout.adjustments, payout.currency) : ":"}
                      </TableCell>
                      <TableCell className="text-right text-sm font-semibold tabular-nums">
                        {formatCurrency(payout.finalAmount, payout.currency)}
                      </TableCell>
                      <TableCell><StatusBadge status={payout.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {payout.scheduledPaymentDate
                          ? format(new Date(payout.scheduledPaymentDate), "MMM d, yyyy")
                          : ":"}
                      </TableCell>
                      <TableCell className="w-10">
                        {payout.notes ? (
                          <button
                            onClick={() => setExpandedPayoutId(expandedPayoutId === payout.id ? null : payout.id)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            {expandedPayoutId === payout.id ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                          </button>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="size-8 p-0" disabled={isPaid}>
                              {isPaid ? <XCircle className="size-4 text-muted-foreground" /> : <MoreHorizontal className="size-4" />}
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {payout.status === "pending" && hasPermission("payouts", "approve") && (
                              <DropdownMenuItem onClick={() => setConfirmTarget({ payout, status: "approved" })}>
                                <CheckCircle2 className="mr-2 size-4 text-blue-500" />Approve
                              </DropdownMenuItem>
                            )}
                            {payout.status === "approved" && hasPermission("payouts", "mark_paid") && (
                              <DropdownMenuItem onClick={() => setConfirmTarget({ payout, status: "paid", extra: { actualPaymentDate: new Date().toISOString() } })}>
                                <DollarSign className="mr-2 size-4 text-green-500" />Mark as Paid
                              </DropdownMenuItem>
                            )}
                            {hasPermission("payouts", "adjust") && (
                              <DropdownMenuItem onClick={() => setAdjustTarget(payout)}>
                                <Plus className="mr-2 size-4" />Add Adjustment
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            {payout.status !== "on_hold" && hasPermission("payouts", "edit") && (
                              <DropdownMenuItem onClick={() => setConfirmTarget({ payout, status: "on_hold" })} className="text-muted-foreground">
                                <Clock className="mr-2 size-4" />Put on Hold
                              </DropdownMenuItem>
                            )}
                            {payout.status === "on_hold" && hasPermission("payouts", "edit") && (
                              <DropdownMenuItem onClick={() => setConfirmTarget({ payout, status: "pending" })}>
                                <Clock className="mr-2 size-4" />Resume (→ Pending)
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {expandedPayoutId === payout.id && payout.notes && (
                      <TableRow key={`${payout.id}-notes`} className="hover:bg-transparent">
                        <TableCell colSpan={10} className="p-0 border-t-0 overflow-hidden">
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                          >
                            <div className="px-6 py-3 bg-muted/20 border-t text-sm text-muted-foreground">
                              {payout.notes}
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
            {pagination ? (
              <div className="border-t px-4 py-3">
                <DataPagination
                  page={page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  limit={LIMIT}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
            </>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <Dialog open={!!adjustTarget} onOpenChange={() => setAdjustTarget(null)}>
        {adjustTarget && (
          <AdjustModal payout={adjustTarget} workspaceId={workspaceId} onClose={() => setAdjustTarget(null)} />
        )}
      </Dialog>

      <Dialog open={!!confirmTarget} onOpenChange={() => setConfirmTarget(null)}>
        {confirmTarget && (
          <StatusConfirmModal
            payout={confirmTarget.payout}
            targetStatus={confirmTarget.status}
            onConfirm={() => executeStatusChange(confirmTarget.payout, confirmTarget.status, confirmTarget.extra)}
            onClose={() => setConfirmTarget(null)}
          />
        )}
      </Dialog>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <CreatePayoutModal workspaceId={workspaceId} open={createOpen} setOpen={setCreateOpen} />
      </Dialog>
    </div>
  );
}
