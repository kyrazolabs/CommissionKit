import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/number-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { DatePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";
import { format } from "date-fns";
import { Plus, Trash2, ArrowLeft, FolderKanban, FileText, DollarSign, TrendingUp, Percent, Download, Receipt, Clock, AlertCircle, Pencil } from "lucide-react";
import { HelpTooltip } from "@/components/help-tooltip";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function AissolProjectDetailPage() {
  usePageMeta({ title: "Project Detail", description: "Manage project invoices", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { hasPermission } = useRole();
  const queryClient = useQueryClient();
  const [, params] = useRoute("/dash/enterprise/projects/:id");
  const projectId = params?.id ?? "";
  const [showCreate, setShowCreate] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [editTarget, setEditTarget] = useState<any>(null);
  const [showPaidConfirm, setShowPaidConfirm] = useState(false);
  const [editForm, setEditForm] = useState({ invoiceNumber: "", amount: "", notes: "", dueDate: "", paymentStatus: "unpaid" });
  const [form, setForm] = useState({ invoiceNumber: "", amount: "", notes: "", dueDate: "", paymentStatus: "unpaid" });

  const { data: project, isLoading } = useQuery({
    queryKey: ["aissol-project", projectId],
    queryFn: () => apiFetch(`/api/enterprise/projects/${projectId}`),
    enabled: !!projectId && !!activeWorkspace?.id && activeWorkspace?.commissionEngine === "aissol",
    staleTime: 0,
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`/api/enterprise/projects/${projectId}/invoices`, { method: "POST", body: JSON.stringify({ ...data, amount: Number(data.amount) }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-project", projectId] });
      setShowCreate(false);
      setForm({ invoiceNumber: "", amount: "", notes: "", dueDate: "", paymentStatus: "unpaid" });
      toast({ title: "Invoice added" });
    },
    onError: () => toast({ title: "Failed to add invoice", variant: "destructive" }),
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => apiFetch(`/api/enterprise/projects/${projectId}/invoices/${invoiceId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-project", projectId] });
      setDeleteTarget(null);
      toast({ title: "Invoice deleted" });
    },
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: (data: any) =>
      apiFetch(`/api/enterprise/projects/${projectId}/invoices/${editTarget?._id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-project", projectId] });
      setEditTarget(null);
      toast({ title: "Invoice updated" });
    },
  });

  const handleExportInvoices = () => {
    const invs = project?.invoices ?? [];
    const csv = ["Invoice Number,Amount,Currency,Payment,Period,Notes", ...invs.map((inv: any) =>
      `"${inv.invoiceNumber}",${inv.amount},${inv.currency},${inv.paymentStatus || "unpaid"},${inv.period || project.period},"${(inv.notes || "").replace(/"/g, '""')}"`
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `invoices-${project.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (activeWorkspace?.commissionEngine !== "aissol") { setLocation("/dash"); return null; }
  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
        <div className="grid gap-4 md:grid-cols-3"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-28 rounded-2xl" /></div>
      </div>
    );
  }
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="bg-muted size-12 rounded-full flex items-center justify-center mb-1"><FolderKanban className="size-6 text-muted-foreground" /></div>
        <h3 className="text-lg font-medium">Project not found</h3>
        <p className="text-sm text-muted-foreground mb-3">This project may have been deleted.</p>
        <Link href="/dash/enterprise/projects"><Button variant="outline" size="sm"><ArrowLeft className="mr-1.5 size-3.5" /> Back to Projects</Button></Link>
      </div>
    );
  }

  const totalValue = Number(project.totalValue);
  const totalCost = Number(project.totalCost);
  const gmPercent = totalValue > 0 ? ((totalValue - totalCost) / totalValue * 100).toFixed(1) : "0.0";
  const invoices: any[] = project.invoices ?? [];
  const invoiceTotal = invoices.reduce((s: number, inv: any) => s + Number(inv.amount), 0);
  const paidTotal = invoices.filter((inv: any) => inv.paymentStatus === "paid").reduce((s: number, inv: any) => s + Number(inv.amount), 0);
  const remainingTotal = invoiceTotal - paidTotal;
  const paidCount = invoices.filter((inv: any) => inv.paymentStatus === "paid").length;
  const unpaidCount = invoices.filter((inv: any) => inv.paymentStatus === "unpaid").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dash/enterprise/projects"><Button variant="ghost" size="icon" className="size-8"><ArrowLeft className="size-4" /></Button></Link>
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Enterprise</p>
          <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">Project invoices and commission details.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {[
          { label: "Total Value", value: formatCurrency(totalValue, project.currency), icon: DollarSign },
          { label: "Total Cost", value: formatCurrency(totalCost, project.currency), icon: TrendingUp },
          { label: "Gross Margin", value: `${gmPercent}%`, icon: Percent },
          { label: "Invoiced", value: formatCurrency(invoiceTotal, project.currency), icon: Receipt },
          { label: "Remaining", value: formatCurrency(remainingTotal, project.currency), icon: Clock },
          { label: "Paid", value: `${paidCount}/${invoices.length} invoices`, icon: AlertCircle },
        ].map((stat) => (
          <div key={stat.label} className="bg-card border border-card-border rounded-2xl px-[22px] py-5" style={{ boxShadow: "var(--shadow-card)" }}>
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[12px] font-medium text-muted-foreground">{stat.label}</span>
              <div className="flex size-7 items-center justify-center rounded-[10px] bg-secondary"><stat.icon className="size-3.5 text-primary" /></div>
            </div>
            <div className="text-[26px] font-semibold tracking-tight text-foreground leading-none">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Invoices</h2>
          <p className="text-muted-foreground text-sm">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""} · {formatCurrency(invoiceTotal, project.currency)} total</p>
        </div>
        {hasPermission("deals", "create") && (
          <div className="flex gap-2">
            {invoices.length > 0 && <Button variant="outline" onClick={handleExportInvoices} className="gap-1.5"><Download className="size-4" /> Export CSV</Button>}
            <Button onClick={() => setShowCreate(true)} disabled={showCreate}><Plus className="mr-2 size-4" />Add Invoice</Button>
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add Invoice</DialogTitle>
            <DialogDescription>Add an invoice to this project for commission calculation.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createInvoiceMutation.mutate(form); }} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label htmlFor="inv-number">Invoice Number</Label><Input id="inv-number" value={form.invoiceNumber} onChange={(e) => setForm(p => ({ ...p, invoiceNumber: e.target.value }))} required /></div>
              <div className="space-y-2"><Label htmlFor="inv-amount">Amount</Label><NumberInput id="inv-amount" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} required /></div>
              <div className="space-y-2"><Label htmlFor="inv-due">Due Date</Label><Input id="inv-due" type="date" value={form.dueDate} onChange={(e) => setForm(p => ({ ...p, dueDate: e.target.value }))} /></div>
              <div className="space-y-2"><Label htmlFor="inv-status">Payment Status</Label>
                <Select value={form.paymentStatus} onValueChange={(v) => setForm(p => ({ ...p, paymentStatus: v }))}>
                  <SelectTrigger id="inv-status"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label htmlFor="inv-notes">Notes (optional)</Label><Textarea id="inv-notes" value={form.notes} onChange={(e) => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} placeholder="Invoice details, payment terms..." /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createInvoiceMutation.isPending}>{createInvoiceMutation.isPending ? "Adding..." : "Add Invoice"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {invoices.length > 0 ? (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                {["Invoice #", "Amount", "Payment", "Due Date", "Actions"].map(h => <th key={h} className={cn("px-6 py-3.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider", h === "Actions" ? "text-right" : "text-left")}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any) => (
                <tr key={inv._id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-muted"><FileText className="size-4 text-muted-foreground" /></div>
                      <div>
                        <span className="font-medium text-sm">{inv.invoiceNumber}</span>
                        {inv.notes && <p className="text-[11px] text-muted-foreground mt-0.5">{inv.notes}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-medium">{formatCurrency(Number(inv.amount), inv.currency)}</td>
                  <td className="px-6 py-3.5">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border",
                      inv.paymentStatus === "paid" ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30" :
                      inv.paymentStatus === "partial" ? "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30" :
                      inv.paymentStatus === "on_hold" ? "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/30" :
                      "bg-muted text-muted-foreground border-border")}>
                      {(inv.paymentStatus || "unpaid").replace("_", " ").toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-sm text-muted-foreground">{inv.dueDate || "—"}</td>
                  <td className="px-6 py-3.5">
                    <div className="flex gap-1 justify-end">
                      {inv.paymentStatus !== "paid" && (
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-primary" onClick={() => { setEditTarget(inv); setEditForm({ invoiceNumber: inv.invoiceNumber, amount: String(inv.amount), notes: inv.notes || "", dueDate: inv.dueDate || "", paymentStatus: inv.paymentStatus || "unpaid" }); }}><Pencil className="size-3.5" /></Button>
                      )}
                      <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => setDeleteTarget(inv)}><Trash2 className="size-3.5" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card border border-card-border border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="bg-muted size-12 rounded-full flex items-center justify-center mb-3"><FileText className="size-6 text-muted-foreground" /></div>
          <h3 className="text-lg font-medium">No invoices yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Add invoices to calculate commission for this project.</p>
        </div>
      )}

      <Dialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Invoice</DialogTitle>
            <DialogDescription>Are you sure you want to delete invoice <strong>#{deleteTarget?.invoiceNumber}</strong>? This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => deleteInvoiceMutation.mutate(deleteTarget?._id)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editTarget} onOpenChange={(v) => { if (!v) setEditTarget(null); }}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Invoice #{editTarget?.invoiceNumber}</DialogTitle>
            <DialogDescription>Update invoice details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            if (editForm.paymentStatus === "paid" && editTarget?.paymentStatus !== "paid") {
              setShowPaidConfirm(true);
              return;
            }
            updateInvoiceMutation.mutate(editForm);
          }} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Invoice Number</Label><Input value={editForm.invoiceNumber} onChange={(e) => setEditForm(p => ({ ...p, invoiceNumber: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Amount</Label><NumberInput value={editForm.amount} onChange={(e) => setEditForm(p => ({ ...p, amount: e.target.value }))} /></div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <DatePicker
                  date={editForm.dueDate ? parseISO(editForm.dueDate) : undefined}
                  onChange={(d) => setEditForm(p => ({ ...p, dueDate: d ? format(d, "yyyy-MM-dd") : "" }))}
                />
              </div>
              <div className="space-y-2"><Label>Payment Status</Label>
                <Select value={editForm.paymentStatus} onValueChange={(v) => setEditForm(p => ({ ...p, paymentStatus: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2"><Label>Notes</Label><Textarea value={editForm.notes} onChange={(e) => setEditForm(p => ({ ...p, notes: e.target.value }))} rows={2} /></div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setEditTarget(null)}>Cancel</Button>
              <Button type="submit" disabled={updateInvoiceMutation.isPending}>Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={showPaidConfirm}
        onOpenChange={setShowPaidConfirm}
        title="Mark as Paid?"
        description={<>Marking <strong>#{editTarget?.invoiceNumber}</strong> as paid will lock it from further edits. This cannot be undone.</>}
        confirmLabel="Mark as Paid"
        variant="default"
        onConfirm={() => {
          setShowPaidConfirm(false);
          updateInvoiceMutation.mutate(editForm);
        }}
      />
    </div>
  );
}
