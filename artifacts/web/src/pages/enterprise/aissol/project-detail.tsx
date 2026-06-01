import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/number-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { Plus, Trash2, ArrowLeft, FolderKanban, FileText, DollarSign, TrendingUp, Percent, Download } from "lucide-react";
import { HelpTooltip } from "@/components/help-tooltip";

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
  const [form, setForm] = useState({ invoiceNumber: "", amount: "" });

  const { data: project, isLoading } = useQuery({
    queryKey: ["aissol-project", projectId],
    queryFn: () => apiFetch(`/api/enterprise/projects/${projectId}`),
    enabled: !!projectId && !!activeWorkspace?.id && activeWorkspace?.commissionEngine === "aissol",
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (data: { invoiceNumber: string; amount: number }) =>
      apiFetch(`/api/enterprise/projects/${projectId}/invoices`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-project", projectId] });
      setShowCreate(false);
      setForm({ invoiceNumber: "", amount: "" });
      toast({ title: "Invoice added" });
    },
    onError: () => toast({ title: "Failed to add invoice", variant: "destructive" }),
  });

  const deleteInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) =>
      apiFetch(`/api/enterprise/projects/${projectId}/invoices/${invoiceId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-project", projectId] });
      toast({ title: "Invoice deleted" });
    },
  });

  const handleExportInvoices = () => {
    const csv = ["Invoice Number,Amount,Currency,Period", ...invoices.map((inv: any) =>
      `"${inv.invoiceNumber}",${inv.amount},${inv.currency},${inv.period || project.period}`
    )].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `invoices-${project.name.replace(/\s+/g, "-").toLowerCase()}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (activeWorkspace?.commissionEngine !== "aissol") {
    setLocation("/dash");
    return null;
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
          <Skeleton className="h-28 w-full rounded-2xl" />
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <div className="bg-muted size-12 rounded-full flex items-center justify-center mb-1">
          <FolderKanban className="size-6 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-medium">Project not found</h3>
        <p className="text-sm text-muted-foreground mb-3">This project may have been deleted.</p>
        <Link href="/dash/enterprise/projects">
          <Button variant="outline" size="sm"><ArrowLeft className="mr-1.5 size-3.5" /> Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const totalValue = Number(project.totalValue);
  const totalCost = Number(project.totalCost);
  const gmPercent = totalValue > 0 ? ((totalValue - totalCost) / totalValue * 100).toFixed(1) : "0.0";
  const invoices = project.invoices ?? [];

  const stats = [
    { label: "Total Value", value: formatCurrency(totalValue, project.currency), icon: DollarSign },
    { label: "Total Cost", value: formatCurrency(totalCost, project.currency), icon: TrendingUp },
    { label: "Gross Margin", value: `${gmPercent}%`, icon: Percent },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dash/enterprise/projects">
          <Button variant="ghost" size="icon" className="size-8">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Enterprise</p>
          <h1 className="text-3xl font-semibold tracking-tight">{project.name}</h1>
          <p className="text-muted-foreground">Project invoices and commission details.</p>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card border border-card-border rounded-2xl px-[22px] py-5"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <div className="flex items-center justify-between mb-3.5">
              <span className="text-[12px] font-medium text-muted-foreground">{stat.label}</span>
              <div className="flex size-7 items-center justify-center rounded-[10px] bg-secondary">
                <stat.icon className="size-3.5 text-primary" />
              </div>
            </div>
            <div className="text-[26px] font-semibold tracking-tight text-foreground leading-none">{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Invoices</h2>
          <p className="text-muted-foreground text-sm">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</p>
        </div>
        {hasPermission("deals", "create") && (
          <div className="flex gap-2">
            {invoices.length > 0 && (
              <Button variant="outline" onClick={handleExportInvoices} className="gap-1.5">
                <Download className="size-4" /> Export CSV
              </Button>
            )}
            <Button onClick={() => setShowCreate(true)} disabled={showCreate}>
              <Plus className="mr-2 size-4" />
              Add Invoice
            </Button>
          </div>
        )}
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[450px]">
          <DialogHeader>
            <DialogTitle>Add Invoice</DialogTitle>
            <DialogDescription>Add an invoice to this project for commission calculation.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              createInvoiceMutation.mutate({ invoiceNumber: form.invoiceNumber, amount: Number(form.amount) });
            }}
            className="space-y-4 py-4"
          >
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inv-number">Invoice Number</Label>
                <Input id="inv-number" value={form.invoiceNumber} onChange={(e) => setForm(p => ({ ...p, invoiceNumber: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-amount">Amount</Label>
                <NumberInput id="inv-amount" value={form.amount} onChange={(e) => setForm(p => ({ ...p, amount: e.target.value }))} required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createInvoiceMutation.isPending}>
                {createInvoiceMutation.isPending ? "Adding..." : "Add Invoice"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {invoices.length > 0 ? (
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-6 py-3.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Invoice #</th>
                <th className="text-left px-6 py-3.5 text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">Amount</th>
                <th className="w-10 px-6 py-3.5" />
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv: any, i: number) => (
                <tr key={inv._id} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-6 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                        <FileText className="size-4 text-muted-foreground" />
                      </div>
                      <span className="font-medium text-sm">{inv.invoiceNumber}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3.5 text-sm font-medium">
                    {formatCurrency(Number(inv.amount), inv.currency)}
                  </td>
                  <td className="px-6 py-3.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 text-muted-foreground hover:text-destructive"
                      onClick={() => deleteInvoiceMutation.mutate(inv._id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-card border border-card-border border-dashed rounded-2xl p-16 flex flex-col items-center justify-center text-center" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="bg-muted size-12 rounded-full flex items-center justify-center mb-3">
            <FileText className="size-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No invoices yet</h3>
          <p className="text-sm text-muted-foreground mt-1">Add invoices to calculate commission for this project.</p>
        </div>
      )}
    </div>
  );
}
