import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import * as XLSX from 'xlsx';
import { downloadTemplate } from "@/lib/templates";
import { useQueryClient } from "@tanstack/react-query";
import { useSyncStore } from "@/hooks/use-sync-store";
import {
  useListDeals, getListDealsQueryKey,
  useDeleteDeal,
  useUpdateDeal,
  useListReps, getListRepsQueryKey,
  useImportDeals
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NumberInput } from "@/components/number-input";
import { MonthPicker } from "@/components/ui/month-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash, UploadCloud, FileDown, Briefcase, Loader2, ChevronDown, ChevronRight, Pencil, MoreHorizontal } from "lucide-react";
import { HelpTooltip } from "@/components/help-tooltip";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Papa from "papaparse";
import { useRole } from "@/hooks/use-role";
import { useWorkspace } from "@/hooks/use-workspace";
import { CurrencyCombobox } from "@/components/currency-combobox";
import { RepCombobox } from "@/components/rep-combobox";
import { MarkdownEditor } from "@/components/markdown-editor";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-page-meta";


export function DealsPage() {
  const { t } = useTranslation();
  usePageMeta({ title: t("deals.title"), description: "Track deals and calculate commissions across your team.", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const currency = activeWorkspace?.currency || "USD";
  const [period, setPeriod] = useState<string>(format(new Date(), "yyyy-MM"));
  const [repId, setRepId] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDealId, setExpandedDealId] = useState<string | null>(null);

  const { can, hasPermission, isLoading: roleLoading } = useRole();
  const { data: reps } = useListReps({ query: { queryKey: getListRepsQueryKey() } });

  const queryParams: any = { period };
  if (repId !== "all") queryParams.repId = repId;
  if (paymentStatus !== "all") queryParams.paymentStatus = paymentStatus;

  const { data: deals, isLoading } = useListDeals(
    queryParams,
    { query: { queryKey: getListDealsQueryKey(queryParams) } }
  );

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!hasPermission("deals", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <Briefcase className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">{t("deals.accessDenied")}</h2>
        <p className="text-sm text-muted-foreground">{t("deals.noPermissionDeals")}</p>
      </div>
    );
  }

  const filteredDeals = Array.isArray(deals) ? deals.filter(deal => 
    deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.repName.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">{t("deals.operations")}</p>
          <h1 className="text-3xl font-semibold tracking-tight">{t("deals.title")}</h1>
          <p className="text-muted-foreground">{t("deals.description")}</p>
        </div>
        <div className="flex gap-2">
          {hasPermission("deals", "create") && (
            <>
              {hasPermission("deals", "export") && <ExportDealsButton />}
              <CreateDealDialog period={period} workspaceCurrency={currency} />
              <ImportDealsDialog period={period} workspaceCurrency={currency} />
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-1 items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
              <Input
                placeholder={t("deals.searchDeals")}
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-40">
              <RepCombobox
                reps={Array.isArray(reps) ? reps.map((r: any) => ({ id: String(r.id), name: r.name })) : []}
                value={repId}
                onChange={setRepId}
                includeAll
                allLabel={t("deals.allReps")}
              />
            </div>
            <div className="w-40">
              <Select value={paymentStatus} onValueChange={setPaymentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder={t("common.paymentStatus")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Payments</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="partial">Partial</SelectItem>
                  <SelectItem value="on_hold">On Hold</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <MonthPicker 
                value={period} 
                onChange={setPeriod} 
                placeholder={t("common.pickMonth")}
                className="w-full h-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredDeals.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-muted size-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No deals found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                No deals match your current filters for {period}.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-1.5">
                      Deal Name
                      <HelpTooltip content="The unique identifier for this revenue event." />
                    </div>
                  </TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead className="text-right tabular-nums">Amount</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.flatMap((deal) => {
                  const rows: React.ReactNode[] = [
                    <TableRow key={deal.id}>
                      <TableCell className="font-medium">
                        <button
                          onClick={() => setExpandedDealId(expandedDealId === deal.id ? null : deal.id)}
                          className="flex items-center gap-1.5 hover:text-primary transition-colors text-left"
                        >
                          {deal.notes ? (
                            expandedDealId === deal.id ? (
                              <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="size-3.5 shrink-0 text-muted-foreground" />
                            )
                          ) : (
                            <span className="size-3.5 shrink-0" />
                          )}
                          {deal.name}
                        </button>
                      </TableCell>
                      <TableCell>{deal.repName}</TableCell>
                      <TableCell className="font-medium text-primary text-right tabular-nums">
                        {formatCurrency(deal.amount, deal.currency || currency)}
                      </TableCell>
                      <TableCell>{format(new Date(deal.closeDate), "MMM d, yyyy")}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          deal.stage === 'closed_won' ? 'bg-primary/10 text-primary border-primary/20' : 
                          deal.stage === 'closed_lost' ? 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/30' :
                          'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800/30'
                        }`}>
                          {deal.stage.replace('_', ' ').toUpperCase()}
                        </span>
                        {(deal as any).clawbackApplied && (
                          <span className="ml-1 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-orange-100 text-orange-800 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/30">
                            CLAWBACK
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${
                          deal.paymentStatus === 'paid' ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30' : 
                          deal.paymentStatus === 'partial' ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800/30' :
                          deal.paymentStatus === 'on_hold' ? 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800/30' :
                          'bg-muted text-muted-foreground border-border'
                        }`}>
                          {(deal.paymentStatus || 'unpaid').replace('_', ' ').toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="size-8">
                              <MoreHorizontal className="size-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {hasPermission("deals", "edit") && deal.paymentStatus !== "paid" && (
                              <UpdateDealDialog deal={deal} queryParams={queryParams} reps={reps} workspaceCurrency={currency} />
                            )}
                            {hasPermission("deals", "delete") && (
                              <>
                                <DropdownMenuSeparator />
                                <DealDeleteAction deal={deal} queryParams={queryParams} currency={currency} />
                              </>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>,
                  ];
                  if (expandedDealId === deal.id && deal.notes) {
                    rows.push(
                      <TableRow key={`${deal.id}-notes`} className="hover:bg-transparent">
                        <TableCell colSpan={7} className="p-0 border-t-0 overflow-hidden">
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.15, ease: "easeOut" }}
                          >
                            <div className="px-6 py-4 bg-muted/20 border-t">
                              <div className="prose prose-sm max-w-none prose-p:my-0.5" dangerouslySetInnerHTML={{ __html: deal.notes }} />
                            </div>
                          </motion.div>
                        </TableCell>
                      </TableRow>
                    );
                  }
                  return rows;
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function UpdateDealDialog({ deal, queryParams, reps, workspaceCurrency }: { deal: any, queryParams: any, reps: any, workspaceCurrency: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();
  const updateMutation = useUpdateDeal({
    mutation: {
      onMutate: async (variables) => {
        const { id, data } = variables;
        await queryClient.cancelQueries({ queryKey: ['/api/deals'] });
        const previousDealsQueries = queryClient.getQueriesData<any[]>({ queryKey: ['/api/deals'] });

        const rep = reps?.find((r: any) => String(r.id || r._id) === String(data.repId));
        const repName = rep ? rep.name : t("deals.creator.title");

        queryClient.setQueriesData<any[]>({ queryKey: ['/api/deals'] }, (old) => {
          if (!old) return [];
          return old.map(dealItem => {
            if (dealItem.id === id) {
              return {
                ...dealItem,
                ...data,
                repName,
              };
            }
            return dealItem;
          });
        });

        return { previousDealsQueries };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousDealsQueries) {
          context.previousDealsQueries.forEach(([queryKey, value]: any) => {
            queryClient.setQueryData(queryKey, value);
          });
        }
        useSyncStore.getState().setSyncError(true);
        toast({
          title: t("deals.dealUpdateFailed"),
          description: t("deals.dealUpdateFailedDescription"),
          variant: "destructive",
        });
      },
      onSuccess: () => {
        useSyncStore.getState().setSyncError(false);
        toast({ title: t("deals.dealUpdated") });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      }
    }
  });

  const [formData, setFormData] = useState({
    repId: String(deal.repId?._id ?? deal.repId ?? ""),
    name: deal.name,
    amount: deal.amount,
    currency: deal.currency || workspaceCurrency,
    closeDate: format(new Date(deal.closeDate), "yyyy-MM-dd"),
    period: deal.period,
    stage: deal.stage as any,
    paymentStatus: deal.paymentStatus || "unpaid",
    notes: deal.notes || ""
  });
  const [showClawbackConfirm, setShowClawbackConfirm] = useState(false);
  const [showPaidConfirm, setShowPaidConfirm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const stageChangedToLost = deal.stage === "closed_won" && formData.stage === "closed_lost";
    const markingPaid = deal.paymentStatus !== "paid" && formData.paymentStatus === "paid";
    if (stageChangedToLost) {
      setShowClawbackConfirm(true);
      return;
    }
    if (markingPaid) {
      setShowPaidConfirm(true);
      return;
    }
    updateMutation.mutate({ id: deal.id, data: formData });
    setOpen(false);
  };

  const isPending = deal.stage === 'pending';
  const isClosedWon = deal.stage === 'closed_won';
  const isEditable = isPending || isClosedWon;
  const isPaymentOnly = isClosedWon;

  if (!isEditable) return null;

  return (<>
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-8 text-muted-foreground hover:text-primary"
          disabled={!isEditable}
          title={t("deals.editDealTitle")}
        >
          <Pencil />
          
        </Button>
      </DialogTrigger>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isPaymentOnly ? t("deals.updatePaymentStatus") : "Edit Deal"}</DialogTitle>
            <DialogDescription>{isPaymentOnly ? "Update the stage or payment status for this closed won deal. Changing to Closed Lost triggers clawback." : "Update deal details."}</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            {isPaymentOnly ? (
              <>
                <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30 p-3 text-sm text-amber-800 dark:text-amber-300">
                  This deal is <strong>closed won</strong>. Changing the stage to <strong>Closed Lost</strong> will trigger a <strong>clawback</strong> if the plan has a clawback period configured.
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-stage">Stage</Label>
                  <Select value={formData.stage} onValueChange={(val) => setFormData(prev => ({ ...prev, stage: val }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="closed_won">CLOSED WON</SelectItem>
                      <SelectItem value="closed_lost">CLOSED LOST</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-paymentStatus">Payment Status</Label>
                  <Select value={formData.paymentStatus} onValueChange={(val) => setFormData(prev => ({ ...prev, paymentStatus: val }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unpaid">UNPAID</SelectItem>
                    <SelectItem value="paid">PAID</SelectItem>
                    <SelectItem value="partial">PARTIAL</SelectItem>
                    <SelectItem value="on_hold">ON HOLD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          ) : (
            <>
          <div className="space-y-2">
            <Label htmlFor="edit-repId">Sales Rep</Label>
            <RepCombobox
              key={`rep-select-${formData.repId}-${reps?.length || 0}`}
              reps={Array.isArray(reps) ? reps.map((r: any) => ({ id: String(r.id || r._id), name: r.name })) : []}
              value={formData.repId}
              onChange={(val) => setFormData(prev => ({ ...prev, repId: val }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Deal Name</Label>
            <Input id="edit-name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <NumberInput id="edit-amount" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-currency">Currency</Label>
              <CurrencyCombobox
                value={formData.currency}
                onChange={(val) => setFormData((prev) => ({ ...prev, currency: val }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-closeDate">Close Date</Label>
              <DatePicker 
                date={formData.closeDate ? parseISO(formData.closeDate) : undefined} 
                onChange={(d) => setFormData(prev => ({ ...prev, closeDate: d ? format(d, "yyyy-MM-dd") : "" }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-stage">Stage</Label>
              <Select value={formData.stage} onValueChange={(val) => setFormData(prev => ({ ...prev, stage: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="closed_won">CLOSED WON</SelectItem>
                  <SelectItem value="closed_lost">CLOSED LOST</SelectItem>
                  <SelectItem value="pending">PENDING</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-paymentStatus">Payment Status</Label>
            <Select value={formData.paymentStatus} onValueChange={(val) => setFormData(prev => ({ ...prev, paymentStatus: val }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">UNPAID</SelectItem>
                <SelectItem value="paid">PAID</SelectItem>
                <SelectItem value="partial">PARTIAL</SelectItem>
                <SelectItem value="on_hold">ON HOLD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <MarkdownEditor
              value={formData.notes}
              onChange={(val) => setFormData(prev => ({ ...prev, notes: val }))}
              placeholder={t("deals.notesPlaceholder")}
            />
          </div>
            </>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? t("common.saving") : t("common.saveChanges")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
      <ConfirmDialog
        open={showClawbackConfirm}
        onOpenChange={setShowClawbackConfirm}
        title={t("deals.triggerClawback")}
        description={<>Changing this deal from <strong>Closed Won</strong> to <strong>Closed Lost</strong> will trigger a clawback if the plan has a clawback period configured. The commission paid for this deal will be deducted from the rep's next payout.</>}
        confirmLabel={t("deals.changeToClosedLost")}
        variant="destructive"
        onConfirm={() => {
          setShowClawbackConfirm(false);
          updateMutation.mutate({ id: deal.id, data: formData });
          setOpen(false);
        }}
      />
      <ConfirmDialog
        open={showPaidConfirm}
        onOpenChange={setShowPaidConfirm}
        title={t("deals.markAsPaid")}
        description={<>Marking <strong>{deal.name}</strong> as paid will lock it from further edits and set the stage to <strong>Closed Won</strong>. This cannot be undone.</>}
        confirmLabel={t("deals.markAsPaidConfirm")}
        variant="default"
        onConfirm={() => {
          setShowPaidConfirm(false);
          updateMutation.mutate({ id: deal.id, data: { ...formData, stage: "closed_won" } });
          setOpen(false);
        }}
      />
      </>
  );
}

function DealDeleteAction({ deal, queryParams, currency }: { deal: any, queryParams: any, currency: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { t } = useTranslation();
  const { toast } = useToast();
  const deleteMutation = useDeleteDeal({
    mutation: {
      onMutate: async (variables) => {
        const { id } = variables;
        await queryClient.cancelQueries({ queryKey: ['/api/deals'] });
        const previousDealsQueries = queryClient.getQueriesData<any[]>({ queryKey: ['/api/deals'] });

        queryClient.setQueriesData<any[]>({ queryKey: ['/api/deals'] }, (old) => {
          if (!old) return [];
          return old.filter(dealItem => dealItem.id !== id);
        });

        return { previousDealsQueries };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousDealsQueries) {
          context.previousDealsQueries.forEach(([queryKey, value]: any) => {
            queryClient.setQueryData(queryKey, value);
          });
        }
        useSyncStore.getState().setSyncError(true);
        toast({
          title: "Sync Error",
          description: t("deals.dealDeleteFailedDescription"),
          variant: "destructive",
        });
      },
      onSuccess: () => {
        useSyncStore.getState().setSyncError(false);
        toast({ title: t("deals.dealDeleted") });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
      }
    }
  });

  const handleDelete = () => {
    deleteMutation.mutate({ id: deal.id });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-destructive">
          <Trash className="size-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Deal</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{deal.name}</strong> ({formatCurrency(deal.amount, deal.currency || currency)})? This may affect historical commission calculations.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDealsDialog({ period, workspaceCurrency }: { period: string, workspaceCurrency: string }) {
  const [open, setOpen] = useState(false);
  const [defaultCurrency, setDefaultCurrency] = useState(workspaceCurrency);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: reps } = useListReps({ query: { queryKey: getListRepsQueryKey() } });
  const { t } = useTranslation();
  const importMutation = useImportDeals();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const processData = (data: any[]) => {
    const mapped = data.map((row: any) => {
      const repEmail = (row['Rep Email'] || row['email'] || row['Rep'] || row['sales_rep'] || row['Sales Rep'] || '').trim();
      const dealName = (row['Deal Name'] || row['Name'] || row['Deal'] || row['deal_name'] || '').trim();
      const amountStr = (row['Amount'] || row['Price'] || row['Value'] || row['Deal Amount'] || row['deal_amount'] || '0').toString().replace(/[^0-9.-]+/g, "");
      const closeDateStr = (row['Close Date'] || row['Date'] || row['close_date'] || '').trim();
      const stageRaw = (row['Stage'] || row['stage'] || 'closed_won').toString().trim().toLowerCase().replace(' ', '_');
      const rowCurrency = (row['Currency'] || row['currency'] || defaultCurrency).trim().toUpperCase();
      const paymentStatusRaw = (row['Payment Status'] || row['payment_status'] || row['Payment'] || 'unpaid').toString().trim().toLowerCase().replace(' ', '_');
      const notes = (row['Notes'] || row['Description'] || row['notes'] || '').trim();

      const rep = reps?.find(r => 
        r.email.toLowerCase() === repEmail.toLowerCase() || 
        r.name.toLowerCase() === repEmail.toLowerCase()
      );
      
      let stage: 'closed_won' | 'closed_lost' | 'pending' = 'closed_won';
      if (stageRaw.includes('lost')) stage = 'closed_lost';
      else if (stageRaw.includes('pending') || stageRaw.includes('open')) stage = 'pending';

      let paymentStatus = 'unpaid';
      if (paymentStatusRaw.includes('paid')) paymentStatus = 'paid';
      else if (paymentStatusRaw.includes('partial')) paymentStatus = 'partial';
      else if (paymentStatusRaw.includes('hold')) paymentStatus = 'on_hold';
      
      return {
        id: Math.random().toString(36).substr(2, 9), // Temp ID for list management
        repId: rep?.id || "",
        repEmail,
        name: dealName || 'Unknown Deal',
        amount: parseFloat(amountStr) || 0,
        closeDate: closeDateStr || new Date().toISOString().split('T')[0],
        period: period,
        stage,
        paymentStatus,
        currency: rowCurrency,
        notes: notes || null
      };
    });
    setParsedData(mapped);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsing(true);
    const reader = new FileReader();

    if (file.name.endsWith('.csv')) {
      reader.onload = (event) => {
        const text = event.target?.result as string;
        Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
          complete: (results) => {
            processData(results.data);
            setIsParsing(false);
          }
        });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(worksheet);
        processData(json);
        setIsParsing(false);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const updateRow = (id: string, field: string, value: any) => {
    setParsedData(prev => prev ? prev.map(row => 
      row.id === id ? { ...row, [field]: value } : row
    ) : null);
  };

  const removeRow = (id: string) => {
    setParsedData(prev => prev ? prev.filter(row => row.id !== id) : null);
  };

  const handleImport = () => {
    if (!parsedData) return;
    
    // Validate that all rows have a repId
    const invalidRows = parsedData.filter(d => !d.repId);
    if (invalidRows.length > 0) {
      toast({ 
        title: t("deals.validationError"), 
        description: `Please select a Sales Rep for all rows (missing for ${invalidRows.length} rows).`,
        variant: "destructive" 
      });
      return;
    }

    const dealsToImport = parsedData.map(({ id, ...deal }) => deal);
    
    importMutation.mutate({ data: { period, deals: dealsToImport } }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListDealsQueryKey({ period }) });
        toast({ 
          title: res.skipped > 0 ? t("deals.importPartial") : t("deals.importComplete"), 
          description: `Imported ${res.imported} deals.`,
        });
        setOpen(false);
        setParsedData(null);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) { setParsedData(null); }
    }}>
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="mr-2 size-4" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[95vw] md:max-w-[80vw] lg:max-w-[1000px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Import Deals</DialogTitle>
              <DialogDescription>
                Import deals for the period <strong>{period}</strong>. Support CSV and XLSX.
              </DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('csv')} className="text-xs">
                <FileDown className="mr-1.5 size-3.5" /> Template (CSV)
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadTemplate('xlsx')} className="text-xs">
                <FileDown className="mr-1.5 size-3.5" /> Template (XLSX)
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          {!parsedData ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center bg-muted/30">
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <UploadCloud className="size-8 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Upload deal data</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                Drop your CSV or XLSX file here, or click to browse. We'll show a preview for you to edit.
              </p>
              
              <div className="flex flex-col items-center gap-4 w-full max-w-xs">
                <div className="w-full space-y-2 text-left">
                  <Label className="text-xs">Default Currency (fallback)</Label>
                  <CurrencyCombobox value={defaultCurrency} onChange={setDefaultCurrency} />
                </div>
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".csv,.xlsx"
                  className="hidden" 
                />
                <Button onClick={() => fileInputRef.current?.click()} disabled={isParsing} className="w-full">
                  {isParsing ? t("deals.parsing") : t("deals.selectFile")}
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center bg-muted/40 p-2 rounded-lg border">
                <div className="text-sm font-medium px-2">
                  <span className="text-primary">{parsedData.length}</span> rows detected
                </div>
                <Button variant="ghost" size="sm" onClick={() => setParsedData(null)}>
                  Clear and upload new
                </Button>
              </div>
              
              <div className="border rounded-xl overflow-x-auto bg-background shadow-sm">
                <Table className="relative">
                  <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
                    <TableRow>
                      <TableHead className="w-[200px]">Sales Rep</TableHead>
                      <TableHead className="w-[200px]">Deal Name</TableHead>
                      <TableHead className="w-[120px]">Amount</TableHead>
                      <TableHead className="w-[160px]">Currency</TableHead>
                      <TableHead className="w-[150px]">Close Date</TableHead>
                      <TableHead className="w-[140px]">Stage</TableHead>
                      <TableHead className="w-[140px]">Payment</TableHead>
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row) => (
                      <TableRow key={row.id} className={!row.repId ? "bg-red-50/30 dark:bg-red-900/10" : ""}>
                        <TableCell>
                          <RepCombobox
                            reps={Array.isArray(reps) ? reps.map((r: any) => ({ id: String(r.id), name: r.name })) : []}
                            value={row.repId}
                            onChange={(val) => updateRow(row.id, 'repId', val)}
                            className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent shadow-none"
                          />
                          {!row.repId && <p className="text-[10px] text-destructive mt-0.5 ml-2">Unknown email: {row.repEmail}</p>}
                        </TableCell>
                        <TableCell>
                          <Input 
                            value={row.name} 
                            onChange={(e) => updateRow(row.id, 'name', e.target.value)}
                            className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent"
                          />
                        </TableCell>
                        <TableCell>
                          <NumberInput
                            value={row.amount} 
                            onChange={(e) => updateRow(row.id, 'amount', parseFloat(e.target.value) || 0)}
                            className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent"
                          />
                        </TableCell>
                        <TableCell>
                          <CurrencyCombobox 
                            value={row.currency} 
                            onChange={(val) => updateRow(row.id, 'currency', val)}
                            className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent shadow-none hover:bg-muted/50"
                          />
                        </TableCell>
                        <TableCell>
                          <DatePicker
                            date={row.closeDate ? parseISO(row.closeDate) : undefined}
                            onChange={(d) => updateRow(row.id, 'closeDate', d ? format(d, "yyyy-MM-dd") : "")}
                          />
                        </TableCell>
                        <TableCell>
                          <Select value={row.stage} onValueChange={(val) => updateRow(row.id, 'stage', val)}>
                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="closed_won">CLOSED WON</SelectItem>
                              <SelectItem value="closed_lost">CLOSED LOST</SelectItem>
                              <SelectItem value="pending">PENDING</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Select value={row.paymentStatus || 'unpaid'} onValueChange={(val) => updateRow(row.id, 'paymentStatus', val)}>
                            <SelectTrigger className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unpaid">UNPAID</SelectItem>
                              <SelectItem value="paid">PAID</SelectItem>
                              <SelectItem value="partial">PARTIAL</SelectItem>
                              <SelectItem value="on_hold">ON HOLD</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" onClick={() => removeRow(row.id)}>
                            <Trash className="size-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </div>
        
        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {parsedData && (
            <Button onClick={handleImport} disabled={importMutation.isPending}>
              {importMutation.isPending ? (
                <><Loader2 className="mr-2 size-4 animate-spin" /> Importing…</>
              ) : (
                <>Finalize Import ({parsedData.length} deals)</>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateDealDialog({ period, workspaceCurrency }: { period: string, workspaceCurrency: string }) {
  const [open, setOpen] = useState(false);
  const { data: reps } = useListReps({ query: { queryKey: getListRepsQueryKey() } });
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useImportDeals({
    mutation: {
      onMutate: async (variables) => {
        const dealsToImport = variables.data.deals;
        if (dealsToImport.length !== 1) return;

        const newDeal = dealsToImport[0];
        await queryClient.cancelQueries({ queryKey: ['/api/deals'] });
        const previousDealsQueries = queryClient.getQueriesData<any[]>({ queryKey: ['/api/deals'] });

        const rep = reps?.find((r: any) => String(r.id || r._id) === String(newDeal.repId));
        const repName = rep ? rep.name : "Unknown Rep";

        const tempId = `temp-deal-${Date.now()}`;
        const optimisticDeal = {
          id: tempId,
          name: newDeal.name,
          repId: newDeal.repId,
          repName,
          amount: newDeal.amount,
          currency: newDeal.currency,
          closeDate: newDeal.closeDate,
          period: newDeal.period || period,
          stage: newDeal.stage || 'closed_won',
          paymentStatus: newDeal.paymentStatus || 'unpaid',
          notes: newDeal.notes || null,
        };

        queryClient.setQueriesData<any[]>({ queryKey: ['/api/deals'] }, (old) => {
          if (!old) return [optimisticDeal];
          return [optimisticDeal, ...old];
        });

        return { previousDealsQueries };
      },
      onError: (err, variables, context: any) => {
        if (context?.previousDealsQueries) {
          context.previousDealsQueries.forEach(([queryKey, value]: any) => {
            queryClient.setQueryData(queryKey, value);
          });
        }
        useSyncStore.getState().setSyncError(true);
        toast({
          title: "Failed to create deal",
          description: "Recovering your input...",
          variant: "destructive",
        });
        setOpen(true);
      },
      onSuccess: () => {
        useSyncStore.getState().setSyncError(false);
        toast({ title: "Deal created successfully" });
      },
      onSettled: (data, error, variables) => {
        const dealsToImport = variables.data.deals;
        if (dealsToImport.length === 1) {
          queryClient.invalidateQueries({ queryKey: ['/api/deals'] });
        }
      }
    }
  });

  const [formData, setFormData] = useState({
    repId: "",
    name: "",
    amount: 0,
    currency: workspaceCurrency,
    closeDate: format(new Date(), "yyyy-MM-dd"),
    period: period,
    stage: "closed_won" as any,
    paymentStatus: "unpaid" as any,
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.repId || !formData.name) return;

    createMutation.mutate({ data: { period, deals: [formData] } }, {
      onSuccess: () => {
        setFormData({
          repId: "",
          name: "",
          amount: 0,
          currency: workspaceCurrency,
          closeDate: format(new Date(), "yyyy-MM-dd"),
          period: period,
          stage: "closed_won" as any,
          paymentStatus: "unpaid" as any,
          notes: ""
        });
      }
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Briefcase className="mr-2 size-4" />
          Add Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>Add New Deal</DialogTitle>
          <DialogDescription>Enter deal details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="repId">Sales Rep</Label>
            <RepCombobox
              reps={Array.isArray(reps) ? reps.map((r: any) => ({ id: String(r.id), name: r.name })) : []}
              value={formData.repId}
              onChange={(val) => setFormData(prev => ({ ...prev, repId: val }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Deal Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <NumberInput id="amount" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <CurrencyCombobox
                value={formData.currency}
                onChange={(val) => setFormData((prev) => ({ ...prev, currency: val }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="closeDate">Close Date</Label>
              <DatePicker 
                date={formData.closeDate ? parseISO(formData.closeDate) : undefined} 
                onChange={(d) => setFormData(prev => ({ ...prev, closeDate: d ? format(d, "yyyy-MM-dd") : "" }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stage">Stage</Label>
              <Select value={formData.stage} onValueChange={(val) => setFormData(prev => ({ ...prev, stage: val }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
                <SelectItem value="closed_won">CLOSED WON</SelectItem>
                <SelectItem value="closed_lost">CLOSED LOST</SelectItem>
                <SelectItem value="pending">PENDING</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="paymentStatus">Payment Status</Label>
            <Select value={formData.paymentStatus} onValueChange={(val) => setFormData(prev => ({ ...prev, paymentStatus: val }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="unpaid">UNPAID</SelectItem>
                <SelectItem value="paid">PAID</SelectItem>
                <SelectItem value="partial">PARTIAL</SelectItem>
                <SelectItem value="on_hold">ON HOLD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
            <MarkdownEditor
              value={formData.notes}
              onChange={(val) => setFormData(prev => ({ ...prev, notes: val }))}
              placeholder="Add notes in Markdown... (optional)"
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit">Save Deal</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExportDealsButton() {
  const { t } = useTranslation();
  const { sub } = useBillingStatus();
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const isGrowth = sub?.plan === "growth" || sub?.plan === "pro" || sub?.isLifetime;

  const handleExport = async () => {
    if (!isGrowth) {
      toast({
        title: t("deals.growthPlanRequired"),
        description: "Bulk CSV export is a premium feature. Please upgrade to the Growth plan to export your data.",
        variant: "destructive",
      });
      return;
    }

    if (!activeWorkspace?.id) return;

    setIsExporting(true);
    try {
      const workspaceId = localStorage.getItem("ck_active_workspace");
      const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:8088"}/api/export/deals`, {
        credentials: "include",
        headers: { "x-workspace-id": workspaceId ?? "" },
      });

      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `deals-export-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Export Successful",
        description: "Your deals data has been exported to CSV.",
      });
    } catch (err) {
      toast({
        title: "Export Failed",
        description: "There was an error exporting your data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Button 
      variant="outline" 
      onClick={handleExport} 
      disabled={isExporting}
      className={!isGrowth ? "opacity-70 border-dashed" : ""}
    >
      {isExporting ? (
        <Loader2 className="mr-2 size-4 animate-spin" />
      ) : (
        <Download className="mr-2 size-4" />
      )}
      Export CSV
    </Button>
  );
}