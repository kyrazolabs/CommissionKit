import { useState, useRef } from "react";
import * as XLSX from 'xlsx';
import { downloadTemplate } from "@/lib/templates";
import { useQueryClient } from "@tanstack/react-query";
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
import { MonthPicker } from "@/components/ui/month-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DatePicker, DateRangePicker } from "@/components/ui/date-picker";
import { parseISO } from "date-fns";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash, UploadCloud, FileDown, Briefcase, Loader2 } from "lucide-react";
import { HelpTooltip } from "@/components/help-tooltip";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Papa from "papaparse";
import { useRole } from "@/hooks/use-role";
import { useWorkspace } from "@/hooks/use-workspace";
import { CurrencyCombobox } from "@/components/currency-combobox";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api";

export function DealsPage() {
  const { activeWorkspace } = useWorkspace();
  const currency = activeWorkspace?.currency || "USD";
  const [period, setPeriod] = useState<string>(format(new Date(), "yyyy-MM"));
  const [repId, setRepId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { can, hasPermission, isLoading: roleLoading } = useRole();
  const { data: reps } = useListReps({ query: { queryKey: getListRepsQueryKey() } });

  const queryParams: any = { period };
  if (repId !== "all") queryParams.repId = repId;

  const { data: deals, isLoading } = useListDeals(
    queryParams,
    { query: { queryKey: getListDealsQueryKey(queryParams) } }
  );

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="size-10" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!hasPermission("deals", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <Briefcase className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view deals.</p>
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
          <h1 className="text-3xl font-semibold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">Manage revenue events for commission calculation.</p>
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
                placeholder="Search deals…"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-40">
              <Select value={repId} onValueChange={setRepId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Reps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reps</SelectItem>
                  {Array.isArray(reps) && reps.map(rep => (
                    <SelectItem key={rep.id} value={rep.id.toString()}>{rep.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <MonthPicker 
                value={period} 
                onChange={setPeriod} 
                placeholder="Pick a month"
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
                  <TableHead>Amount</TableHead>
                  <TableHead>Close Date</TableHead>
                  <TableHead>Stage</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeals.map((deal) => (
                  <TableRow key={deal.id}>
                    <TableCell className="font-medium">{deal.name}</TableCell>
                    <TableCell>{deal.repName}</TableCell>
                    <TableCell className="font-medium text-primary">
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
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {hasPermission("deals", "edit") && (
                          <UpdateDealDialog deal={deal} queryParams={queryParams} reps={reps} workspaceCurrency={currency} />
                        )}
                        {hasPermission("deals", "delete") && (
                          <DealDeleteAction deal={deal} queryParams={queryParams} currency={currency} />
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
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
  const { toast } = useToast();
  const updateMutation = useUpdateDeal();

  const [formData, setFormData] = useState({
    repId: String(deal.repId?._id ?? deal.repId ?? ""),
    name: deal.name,
    amount: deal.amount,
    currency: deal.currency || workspaceCurrency,
    closeDate: format(new Date(deal.closeDate), "yyyy-MM-dd"),
    period: deal.period,
    stage: deal.stage as any,
    notes: deal.notes || ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate({ id: deal.id, data: formData }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDealsQueryKey(queryParams) });
        toast({ title: "Deal updated successfully" });
        setOpen(false);
      }
    });
  };

  const isEditable = deal.stage === 'pending';

  if (!isEditable) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="ghost" 
          size="icon" 
          className="size-8 text-muted-foreground hover:text-primary"
          disabled={!isEditable}
          title={!isEditable ? "Only pending deals can be edited" : "Edit deal"}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-pencil"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/></svg>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Deal</DialogTitle>
          <DialogDescription>Update deal details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="edit-repId">Sales Rep</Label>
            <Select 
              key={`rep-select-${formData.repId}-${reps?.length || 0}`}
              value={formData.repId} 
              onValueChange={(val) => setFormData(prev => ({ ...prev, repId: val }))}
            >
              <SelectTrigger><SelectValue placeholder="Select a representative" /></SelectTrigger>
              <SelectContent>
                {Array.isArray(reps) && reps.map((rep: any) => (
                  <SelectItem key={rep.id || rep._id} value={(rep.id || rep._id).toString()}>{rep.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-name">Deal Name</Label>
            <Input id="edit-name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-amount">Amount</Label>
              <Input id="edit-amount" type="number" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} required />
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
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? "Saving…" : "Save Changes"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function DealDeleteAction({ deal, queryParams, currency }: { deal: any, queryParams: any, currency: string }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteDeal();

  const handleDelete = () => {
    deleteMutation.mutate({ id: deal.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDealsQueryKey(queryParams) });
        toast({ title: "Deal deleted" });
        setOpen(false);
      }
    });
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
      const notes = (row['Notes'] || row['Description'] || row['notes'] || '').trim();

      const rep = reps?.find(r => 
        r.email.toLowerCase() === repEmail.toLowerCase() || 
        r.name.toLowerCase() === repEmail.toLowerCase()
      );
      
      let stage: 'closed_won' | 'closed_lost' | 'pending' = 'closed_won';
      if (stageRaw.includes('lost')) stage = 'closed_lost';
      else if (stageRaw.includes('pending') || stageRaw.includes('open')) stage = 'pending';
      
      return {
        id: Math.random().toString(36).substr(2, 9), // Temp ID for list management
        repId: rep?.id || "",
        repEmail,
        name: dealName || 'Unknown Deal',
        amount: parseFloat(amountStr) || 0,
        closeDate: closeDateStr || new Date().toISOString().split('T')[0],
        period: period,
        stage,
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
        title: "Validation error", 
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
          title: res.skipped > 0 ? "Import partially successful" : "Import complete", 
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
        
        <div className="flex-1 overflow-hidden py-4 flex flex-col min-h-0">
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
                  {isParsing ? "Parsing…" : "Select File"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col h-full min-h-0">
              <div className="mb-4 flex justify-between items-center bg-muted/40 p-2 rounded-lg border">
                <div className="text-sm font-medium px-2">
                  <span className="text-primary">{parsedData.length}</span> rows detected
                </div>
                <Button variant="ghost" size="sm" onClick={() => setParsedData(null)}>
                  Clear and upload new
                </Button>
              </div>
              
              <div className="flex-1 border rounded-xl overflow-hidden bg-background shadow-sm">
                <div className="overflow-auto h-full">
                  <Table className="relative">
                    <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-[0_1px_0_0_rgba(0,0,0,0.1)]">
                      <TableRow>
                        <TableHead className="w-[200px]">Sales Rep</TableHead>
                        <TableHead className="w-[200px]">Deal Name</TableHead>
                        <TableHead className="w-[120px]">Amount</TableHead>
                        <TableHead className="w-[160px]">Currency</TableHead>
                        <TableHead className="w-[150px]">Close Date</TableHead>
                        <TableHead className="w-[140px]">Stage</TableHead>
                        <TableHead className="w-[50px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {parsedData.map((row) => (
                        <TableRow key={row.id} className={!row.repId ? "bg-red-50/30 dark:bg-red-900/10" : ""}>
                          <TableCell>
                            <Select value={row.repId} onValueChange={(val) => updateRow(row.id, 'repId', val)}>
                              <SelectTrigger className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent">
                                <SelectValue placeholder="Select rep" />
                              </SelectTrigger>
                              <SelectContent>
                                {Array.isArray(reps) && reps.map(rep => (
                                  <SelectItem key={rep.id} value={rep.id.toString()}>{rep.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
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
                            <Input 
                              type="number" 
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
                            <Input 
                              type="date" 
                              value={row.closeDate} 
                              onChange={(e) => updateRow(row.id, 'closeDate', e.target.value)}
                              className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent"
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
                            <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" onClick={() => removeRow(row.id)}>
                              <Trash className="size-3" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
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
  const { mutate: createDeal, isPending } = useImportDeals();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    repId: "",
    name: "",
    amount: 0,
    currency: workspaceCurrency,
    closeDate: format(new Date(), "yyyy-MM-dd"),
    period: period,
    stage: "closed_won" as any,
    notes: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.repId || !formData.name) return;

    createDeal({ data: { period, deals: [formData] } }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListDealsQueryKey({ period }) });
        toast({ title: "Deal created successfully" });
        setOpen(false);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Briefcase className="mr-2 size-4" />
          Add Deal
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Deal</DialogTitle>
          <DialogDescription>Enter deal details.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="repId">Sales Rep</Label>
            <Select value={formData.repId} onValueChange={(val) => setFormData(prev => ({ ...prev, repId: val }))}>
              <SelectTrigger><SelectValue placeholder="Select a representative" /></SelectTrigger>
              <SelectContent>
                {Array.isArray(reps) && reps.map(rep => (
                  <SelectItem key={rep.id} value={rep.id.toString()}>{rep.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Deal Name</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input id="amount" type="number" value={formData.amount} onChange={(e) => setFormData(prev => ({ ...prev, amount: parseFloat(e.target.value) || 0 }))} required />
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
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save Deal"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ExportDealsButton() {
  const { sub } = useBillingStatus();
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const isGrowth = sub?.plan === "growth" || sub?.plan === "pro" || sub?.isLifetime;

  const handleExport = async () => {
    if (!isGrowth) {
      toast({
        title: "Growth Plan Required",
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