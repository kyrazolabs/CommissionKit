import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  DollarSign,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  ShieldCheck,
  X,
  XCircle,
} from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Payout {
  id: string;
  rep: string;
  commissionAmount: number;
  adjustments: number;
  finalAmount: number;
  period: string;
  status: string;
  scheduledPaymentDate: string;
  deals: number;
  plan: string;
  notes?: string;
}

const payoutData: Payout[] = [
  {
    id: "pay-1",
    rep: "Sarah Davis",
    commissionAmount: 7500,
    adjustments: 320,
    finalAmount: 7820,
    period: "Jun 1 – Jun 30, 2024",
    status: "paid",
    scheduledPaymentDate: "Jul 3, 2024",
    deals: 6,
    plan: "Enterprise",
    notes: "Top performer bonus applied.",
  },
  {
    id: "pay-2",
    rep: "Mike Chen",
    commissionAmount: 6480,
    adjustments: 0,
    finalAmount: 6480,
    period: "Jun 1 – Jun 30, 2024",
    status: "paid",
    scheduledPaymentDate: "Jul 3, 2024",
    deals: 4,
    plan: "Accelerator",
  },
  {
    id: "pay-3",
    rep: "Emily Park",
    commissionAmount: 5140,
    adjustments: -200,
    finalAmount: 4940,
    period: "Jun 1 – Jun 30, 2024",
    status: "approved",
    scheduledPaymentDate: "Jul 5, 2024",
    deals: 3,
    plan: "Standard",
  },
  {
    id: "pay-4",
    rep: "James Lee",
    commissionAmount: 3250,
    adjustments: 0,
    finalAmount: 3250,
    period: "Jun 1 – Jun 30, 2024",
    status: "pending",
    scheduledPaymentDate: "",
    deals: 2,
    plan: "Standard",
  },
  {
    id: "pay-5",
    rep: "Alex Kim",
    commissionAmount: 2180,
    adjustments: 0,
    finalAmount: 2180,
    period: "Jun 1 – Jun 30, 2024",
    status: "pending",
    scheduledPaymentDate: "",
    deals: 1,
    plan: "Flat 5%",
  },
];

const initialDisputes = [
  {
    id: "DSP-001",
    rep: "Alex Kim",
    deal: "Initech Upsell",
    reason:
      "Missing bonus accelerator on deal above $15k. Should have received 8% instead of 5% on the full deal amount.",
    status: "under_review",
    created: "Jul 6, 2024",
  },
  {
    id: "DSP-002",
    rep: "Mike Chen",
    deal: "Globex Renewal",
    reason:
      "Tier boundary calculated incorrectly for split deal. The second half should have fallen into the higher tier.",
    status: "resolved",
    created: "Jul 4, 2024",
    resolvedAt: "Jul 5, 2024",
    adminNotes: "Confirmed. Recalculated and adjusted payout.",
  },
];

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const PAYOUT_STATUS: Record<string, { label: string; class: string }> = {
  pending: {
    label: "Pending",
    class:
      "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50",
  },
  approved: {
    label: "Approved",
    class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50",
  },
  paid: {
    label: "Paid",
    class:
      "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50",
  },
  on_hold: {
    label: "On Hold",
    class: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200/50",
  },
  disputed: {
    label: "Disputed",
    class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50",
  },
};

const DISPUTE_STATUS: Record<string, { label: string; class: string; icon: typeof AlertTriangle }> =
  {
    open: {
      label: "Open",
      class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50",
      icon: AlertTriangle,
    },
    under_review: {
      label: "Under Review",
      class:
        "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50",
      icon: Clock,
    },
    resolved: {
      label: "Resolved",
      class:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50",
      icon: CheckCircle2,
    },
  };

export function InteractivePayouts() {
  const [tab, setTab] = useState("payouts");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedDisputeId, setExpandedDisputeId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [disputes, setDisputes] = useState(initialDisputes);
  const [showResolved, setShowResolved] = useState(false);
  const [payouts, setPayouts] = useState(payoutData);

  const totalPaid = payouts.reduce((s, p) => s + (p.status === "paid" ? p.finalAmount : 0), 0);
  const totalPending = payouts.reduce(
    (s, p) => s + (["pending", "approved"].includes(p.status) ? p.finalAmount : 0),
    0,
  );
  const openDisputes = disputes.filter((d) => d.status !== "resolved");
  const resolvedDisputes = disputes.filter((d) => d.status === "resolved");

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    const pending = payouts.filter((p) => p.status === "pending");
    if (pending.every((p) => selectedIds.has(p.id))) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pending.map((p) => p.id)));
    }
  }

  function updatePayout(id: string, patch: Partial<Payout>) {
    setPayouts((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function handleBulkApprove() {
    setPayouts((prev) =>
      prev.map((p) =>
        selectedIds.has(p.id)
          ? { ...p, status: "approved", scheduledPaymentDate: "Jul 5, 2024" }
          : p,
      ),
    );
    setSelectedIds(new Set());
  }

  function resolveDispute(id: string) {
    setDisputes((prev) =>
      prev.map((d) =>
        d.id === id
          ? {
              ...d,
              status: "resolved",
              resolvedAt: "Jul 7, 2024",
              adminNotes: "Reviewed. Commission recalculated.",
            }
          : d,
      ),
    );
  }

  function dismissDispute(id: string) {
    setDisputes((prev) => prev.filter((d) => d.id !== id));
  }

  function markUnderReview(id: string) {
    setDisputes((prev) => prev.map((d) => (d.id === id ? { ...d, status: "under_review" } : d)));
  }

  const filtered = payouts.filter((p) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return p.rep.toLowerCase().includes(s) || p.plan.toLowerCase().includes(s);
  });

  return (
    <Card className="overflow-hidden border-card-border shadow-sm h-[460px] flex flex-col">
      <div className="px-5 py-3 border-b border-card-border bg-muted/20 flex items-center gap-2 shrink-0">
        <div className="flex size-7 items-center justify-center rounded-[8px] bg-primary/10">
          <ShieldCheck className="size-3.5 text-primary" />
        </div>
        <span className="text-[13px] font-semibold text-foreground">Payouts & Disputes</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          Interactive Demo
        </Badge>
      </div>

      <div className="grid grid-cols-3 divide-x divide-card-border border-b border-card-border shrink-0">
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <DollarSign className="size-3 text-emerald-600" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Total Paid
            </span>
          </div>
          <p className="text-[17px] font-bold text-foreground tabular-nums">
            {fmtCurrency(totalPaid)}
          </p>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Clock className="size-3 text-amber-600" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Pending
            </span>
          </div>
          <p className="text-[17px] font-bold text-foreground tabular-nums">
            {fmtCurrency(totalPending)}
          </p>
        </div>
        <div className="px-4 py-3">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="size-3 text-red-500" />
            <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Open Disputes
            </span>
          </div>
          <p className="text-[17px] font-bold text-foreground tabular-nums">
            {openDisputes.length}
          </p>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="flex-1 min-h-0 flex flex-col">
        <TabsList className="w-full rounded-none border-b border-card-border bg-transparent p-0 h-auto grid grid-cols-2 shrink-0">
          {(["payouts", "disputes"] as const).map((t) => (
            <TabsTrigger
              key={t}
              value={t}
              className="rounded-none border-b-2 border-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:bg-primary/[0.04] py-2.5 px-2 h-auto text-xs font-medium capitalize"
            >
              {t === "payouts"
                ? "Payouts"
                : `Disputes${openDisputes.length > 0 ? ` (${openDisputes.length})` : ""}`}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="payouts" className="mt-0 overflow-auto custom-scrollbar flex-1 min-h-0">
          <div className="px-4 py-2 border-b border-card-border flex flex-wrap items-center gap-2 shrink-0 sticky top-0 bg-card z-10">
            <div className="relative flex-1 min-w-[120px] max-w-[200px]">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-muted-foreground" />
              <Input
                placeholder="Search reps..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-7 h-7 text-[11px]"
              />
            </div>
            {selectedIds.size > 0 && (
              <Button
                size="sm"
                className="h-7 text-[10px] rounded-lg gap-1"
                onClick={handleBulkApprove}
              >
                <Check className="size-3" />
                Approve {selectedIds.size}
              </Button>
            )}
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-7">
                  <Checkbox
                    checked={
                      filtered.filter((p) => p.status === "pending").length > 0 &&
                      filtered
                        .filter((p) => p.status === "pending")
                        .every((p) => selectedIds.has(p.id))
                    }
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Rep
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Period
                </TableHead>
                <TableHead className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Commission
                </TableHead>
                <TableHead className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Adjustments
                </TableHead>
                <TableHead className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Final
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Status
                </TableHead>
                <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                  Scheduled
                </TableHead>
                <TableHead className="w-7" />
                <TableHead className="text-right w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={10}
                    className="text-center py-8 text-[11px] text-muted-foreground"
                  >
                    No payouts match your search.
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((p) => {
                  const cfg = PAYOUT_STATUS[p.status] ?? PAYOUT_STATUS.pending;
                  const isPaid = p.status === "paid";
                  const isExpanded = expandedId === p.id;
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <>
                      <TableRow
                        key={p.id}
                        className={cn(
                          "border-t border-card-border",
                          isSelected && "bg-primary/5",
                          isPaid && "opacity-80 bg-muted/20",
                        )}
                      >
                        <TableCell>
                          {p.status === "pending" && (
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelect(p.id)}
                            />
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                              {p.rep
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .slice(0, 2)}
                            </div>
                            <div>
                              <span className="text-[12px] font-medium text-foreground">
                                {p.rep}
                              </span>
                              <p className="text-[10px] text-muted-foreground">{p.plan}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {p.period}
                        </TableCell>
                        <TableCell className="text-right text-[12px] tabular-nums">
                          {fmtCurrency(p.commissionAmount)}
                        </TableCell>
                        <TableCell
                          className={cn(
                            "text-right text-[12px] tabular-nums",
                            p.adjustments < 0
                              ? "text-red-600"
                              : p.adjustments > 0
                                ? "text-green-600"
                                : "text-muted-foreground",
                          )}
                        >
                          {p.adjustments !== 0
                            ? (p.adjustments > 0 ? "+" : "") + fmtCurrency(p.adjustments)
                            : ":"}
                        </TableCell>
                        <TableCell className="text-right text-[12px] font-semibold tabular-nums">
                          {fmtCurrency(p.finalAmount)}
                        </TableCell>
                        <TableCell>
                          <span
                            className={cn(
                              "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                              cfg.class,
                            )}
                          >
                            {cfg.label}
                          </span>
                        </TableCell>
                        <TableCell className="text-[11px] text-muted-foreground">
                          {p.scheduledPaymentDate || ":"}
                        </TableCell>
                        <TableCell className="w-7">
                          {p.notes ? (
                            <button
                              onClick={() => setExpandedId(isExpanded ? null : p.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {isExpanded ? (
                                <ChevronDown className="size-3.5" />
                              ) : (
                                <ChevronRight className="size-3.5" />
                              )}
                            </button>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-7"
                                disabled={isPaid}
                              >
                                {isPaid ? (
                                  <XCircle className="size-3.5 text-muted-foreground" />
                                ) : (
                                  <MoreHorizontal className="size-3.5" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-44">
                              {p.status === "pending" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    updatePayout(p.id, {
                                      status: "approved",
                                      scheduledPaymentDate: "Jul 5, 2024",
                                    })
                                  }
                                >
                                  <CheckCircle2 className="mr-2 size-3.5 text-blue-500" />
                                  Approve
                                </DropdownMenuItem>
                              )}
                              {p.status === "approved" && (
                                <DropdownMenuItem
                                  onClick={() => updatePayout(p.id, { status: "paid" })}
                                >
                                  <DollarSign className="mr-2 size-3.5 text-green-500" />
                                  Mark as Paid
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem
                                onClick={() => {
                                  const adj = prompt("Adjustment amount (+ bonus / − clawback):");
                                  if (adj && !isNaN(+adj)) {
                                    const delta = +adj;
                                    updatePayout(p.id, {
                                      adjustments: p.adjustments + delta,
                                      finalAmount: p.finalAmount + delta,
                                    });
                                  }
                                }}
                              >
                                <Plus className="mr-2 size-3.5" />
                                Add Adjustment
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              {p.status !== "on_hold" && p.status !== "paid" && (
                                <DropdownMenuItem
                                  onClick={() => updatePayout(p.id, { status: "on_hold" })}
                                  className="text-muted-foreground"
                                >
                                  <Ban className="mr-2 size-3.5" />
                                  Put on Hold
                                </DropdownMenuItem>
                              )}
                              {p.status === "on_hold" && (
                                <DropdownMenuItem
                                  onClick={() => updatePayout(p.id, { status: "pending" })}
                                >
                                  <Clock className="mr-2 size-3.5" />
                                  Resume (→ Pending)
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                      {isExpanded && p.notes && (
                        <TableRow key={`${p.id}-notes`} className="hover:bg-transparent">
                          <TableCell colSpan={10} className="p-0 border-t-0 overflow-hidden">
                            <div className="px-6 py-3 bg-muted/20 border-t">
                              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1">
                                Notes
                              </p>
                              <p className="text-[12px] text-muted-foreground">{p.notes}</p>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent
          value="disputes"
          className="mt-0 overflow-auto custom-scrollbar flex-1 min-h-0"
        >
          {openDisputes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-2">
              <CheckCircle2 className="size-8 text-emerald-500" />
              <p className="text-[12px] font-semibold text-foreground">No open disputes</p>
              <p className="text-[11px] text-muted-foreground">All issues have been resolved.</p>
            </div>
          ) : (
            <>
              <div className="px-4 py-2 border-b border-card-border bg-muted/10 flex items-center gap-2 shrink-0 sticky top-0 z-10">
                <span className="inline-flex items-center gap-1 rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 text-[10px] font-semibold border border-red-200/50 px-2 py-0.5">
                  <AlertTriangle className="size-3" />
                  {openDisputes.length} open
                </span>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-7" />
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      ID
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Rep
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Deal
                    </TableHead>
                    <TableHead className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </TableHead>
                    <TableHead className="text-right text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                      Action
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {openDisputes.map((d) => {
                    const cfg = DISPUTE_STATUS[d.status] ?? DISPUTE_STATUS.open;
                    const Icon = cfg.icon;
                    const isExpanded = expandedDisputeId === d.id;
                    return (
                      <>
                        <TableRow key={d.id} className="border-t border-card-border">
                          <TableCell>
                            <button
                              onClick={() => setExpandedDisputeId(isExpanded ? null : d.id)}
                              className="text-muted-foreground hover:text-foreground"
                            >
                              {isExpanded ? (
                                <ChevronDown className="size-3.5" />
                              ) : (
                                <ChevronRight className="size-3.5" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5">
                              <FileText className="size-3 text-muted-foreground" />
                              <span className="text-[11px] font-semibold text-foreground">
                                {d.id}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-[11px] font-medium text-foreground">
                            {d.rep}
                          </TableCell>
                          <TableCell className="text-[11px] text-muted-foreground">
                            {d.deal}
                          </TableCell>
                          <TableCell>
                            <span
                              className={cn(
                                "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                cfg.class,
                              )}
                            >
                              <Icon className="size-2.5" />
                              {cfg.label}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="size-7">
                                  <MoreHorizontal className="size-3.5" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44">
                                {d.status !== "under_review" && (
                                  <DropdownMenuItem onClick={() => markUnderReview(d.id)}>
                                    <Clock className="mr-2 size-3.5 text-amber-500" />
                                    Mark Under Review
                                  </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={() => resolveDispute(d.id)}>
                                  <CheckCircle2 className="mr-2 size-3.5 text-green-500" />
                                  Resolve
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => dismissDispute(d.id)}
                                  className="text-destructive"
                                >
                                  <X className="mr-2 size-3.5" />
                                  Dismiss
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                        {isExpanded && (
                          <TableRow className="hover:bg-transparent">
                            <TableCell colSpan={6} className="p-0 border-t-0 overflow-hidden">
                              <div className="px-6 py-3 bg-muted/20 border-t">
                                <div className="space-y-2">
                                  <div>
                                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-0.5">
                                      Reason
                                    </p>
                                    <p className="text-[11px] whitespace-pre-wrap">{d.reason}</p>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">
                                    Submitted {d.created}
                                  </p>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </>
          )}

          {resolvedDisputes.length > 0 && (
            <div className="border-t border-card-border">
              <button
                onClick={() => setShowResolved(!showResolved)}
                className="flex items-center gap-1.5 w-full px-4 py-2.5 text-[11px] font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {showResolved ? (
                  <ChevronDown className="size-3.5" />
                ) : (
                  <ChevronRight className="size-3.5" />
                )}
                {resolvedDisputes.length} resolved dispute{resolvedDisputes.length > 1 ? "s" : ""}
              </button>
              {showResolved && (
                <div className="opacity-80">
                  <Table>
                    <TableBody>
                      {resolvedDisputes.map((d) => {
                        const cfg = DISPUTE_STATUS[d.status] ?? DISPUTE_STATUS.resolved;
                        const Icon = cfg.icon;
                        return (
                          <TableRow key={d.id} className="border-t border-card-border opacity-60">
                            <TableCell className="pl-8">
                              <div className="flex items-center gap-1.5">
                                <FileText className="size-3 text-muted-foreground" />
                                <span className="text-[11px] font-semibold text-foreground">
                                  {d.id}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-[11px] font-medium text-foreground">
                              {d.rep}
                            </TableCell>
                            <TableCell className="text-[11px] text-muted-foreground">
                              {d.deal}
                            </TableCell>
                            <TableCell>
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold",
                                  cfg.class,
                                )}
                              >
                                <Icon className="size-2.5" />
                                {cfg.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-[10px] text-muted-foreground">
                              {d.resolvedAt}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </Card>
  );
}
