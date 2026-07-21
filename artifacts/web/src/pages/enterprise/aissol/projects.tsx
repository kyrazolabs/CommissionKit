import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/number-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthPicker } from "@/components/ui/month-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Plus, Search, Trash2, UploadCloud, FileDown, FolderKanban, Loader2, Download } from "lucide-react";
import { CurrencyCombobox } from "@/components/currency-combobox";
import { RepCombobox } from "@/components/rep-combobox";
import { useRepSearch } from "@/hooks/use-rep-search";
import { HelpTooltip } from "@/components/help-tooltip";
import Papa from "papaparse";
import * as XLSX from "xlsx";

function toCSV(headers: string[], rows: string[][]): string {
  return [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
}

export function AissolProjectsPage() {
  usePageMeta({ title: "Projects", description: "Manage enterprise projects", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = useRole();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", totalValue: "", totalCost: "", repId: "", period: format(new Date(), "yyyy-MM"), currency: activeWorkspace?.currency || "SAR" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRep, setFilterRep] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<any>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["aissol-projects", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/enterprise/projects`).catch(() => []),
    enabled: !!activeWorkspace?.id && activeWorkspace?.commissionEngine === "aissol",
    staleTime: 0,
  });

  const { data: repsRaw } = useQuery({
    queryKey: ["reps-list", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/reps?limit=500`),
    enabled: !!activeWorkspace?.id && activeWorkspace?.commissionEngine === "aissol",
  });
  const reps = (repsRaw as any)?.data ?? (Array.isArray(repsRaw) ? repsRaw : []);
  const { reps: searchReps, searching: repSearching, onSearch: onRepSearch } = useRepSearch(activeWorkspace?.id);

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiFetch(`/api/enterprise/projects`, {
        method: "POST",
        body: JSON.stringify({
          name: data.name, totalValue: Number(data.totalValue), totalCost: Number(data.totalCost),
          repId: data.repId, period: data.period, currency: data.currency,
        }),
      }),
    onMutate: async (data: typeof form) => {
      await queryClient.cancelQueries({ queryKey: ["aissol-projects"] });
      const previous = queryClient.getQueryData(["aissol-projects", activeWorkspace?.id]);
      const rep = searchReps?.find((r: any) => String(r.id) === String(data.repId));
      const optimistic = {
        _id: `temp-${Date.now()}`,
        name: data.name,
        repId: data.repId,
        totalValue: Number(data.totalValue),
        totalCost: Number(data.totalCost),
        currency: data.currency,
        period: data.period,
        status: "active",
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData(["aissol-projects", activeWorkspace?.id], (old: any) =>
        old ? [optimistic, ...old] : [optimistic],
      );
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["aissol-projects", activeWorkspace?.id], context.previous);
      }
      toast({ title: "Failed to create project", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-projects"] });
    },
    onSuccess: () => {
      setShowCreate(false);
      setForm(p => ({ ...p, name: "", totalValue: "", totalCost: "", repId: "" }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/enterprise/projects/${id}`, { method: "DELETE" }),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["aissol-projects"] });
      const previous = queryClient.getQueryData(["aissol-projects", activeWorkspace?.id]);
      queryClient.setQueryData(["aissol-projects", activeWorkspace?.id], (old: any) =>
        old ? old.filter((p: any) => p._id !== id) : [],
      );
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["aissol-projects", activeWorkspace?.id], context.previous);
      }
      toast({ title: "Failed to delete project", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-projects"] });
    },
  });

  const importMutation = useMutation({
    mutationFn: (data: any[]) =>
      Promise.all(data.map((p: any) =>
        apiFetch(`/api/enterprise/projects`, { method: "POST", body: JSON.stringify(p) })
      )),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-projects"] });
      toast({ title: `Imported ${importMutation.variables?.length ?? 0} projects` });
    },
    onError: () => toast({ title: "Import failed", variant: "destructive" }),
  });

  const repMap = new Map((searchReps as any[])?.map((r: any) => [String(r.id), r.name]) ?? []);

  const handleExportProjects = () => {
    const arr = Array.isArray(projects) ? projects : [];
    const blob = new Blob([toCSV(
      ["Name", "Rep", "Total Value", "Total Cost", "Currency", "Period", "Status", "GM%"],
      arr.map((p: any) => [
        p.name, repMap.get(String(p.repId)) || "Unknown", String(p.totalValue), String(p.totalCost), p.currency, p.period, p.status,
        p.totalValue > 0 ? ((p.totalValue - p.totalCost) / p.totalValue * 100).toFixed(2) : "0.00",
      ]),
    )], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `projects-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (activeWorkspace?.commissionEngine !== "aissol") {
    setLocation("/dash");
    return null;
  }

  const filtered = (Array.isArray(projects) ? projects : [])
    .filter((p: any) => {
      if (filterRep !== "all" && p.repId !== filterRep) return false;
      if (filterPeriod !== "all" && p.period !== filterPeriod) return false;
      if (searchTerm && !p.name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Operations</p>
          <h1 className="text-3xl font-semibold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage projects and track invoice-level commissions.</p>
        </div>
        <div className="flex gap-2">
          {hasPermission("deals", "create") && (
            <>
              <Button variant="outline" onClick={handleExportProjects} className="gap-1.5">
                <Download className="size-4" /> Export CSV
              </Button>
              <ImportProjectsDialog
                workspaceId={activeWorkspace?.id ?? ""}
                period={filterPeriod}
                defaultCurrency={activeWorkspace?.currency || "SAR"}
                onImport={(data: any[]) => importMutation.mutate(data)}
                importing={importMutation.isPending}
              />
              <Button onClick={() => setShowCreate(true)} disabled={showCreate}>
                <Plus className="mr-2 size-4" /> New Project
              </Button>
            </>
          )}
        </div>
      </div>

      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>Enter project details for commission calculation.</DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(form); }} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="proj-name">Project Name</Label>
                <Input id="proj-name" value={form.name} onChange={(e) => setForm(p => ({ ...p, name: e.target.value }))} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="proj-rep">Sales Rep</Label>
                <RepCombobox
                  reps={searchReps}
                  onSearch={onRepSearch}
                  searching={repSearching}
                  value={form.repId}
                  onChange={(v) => setForm(p => ({ ...p, repId: v }))}
                  placeholder={t("enterprise.projects.selectRep")}
                />
              </div>
              <div className="space-y-2"><Label htmlFor="proj-value">Total Value</Label><NumberInput id="proj-value" value={form.totalValue} onChange={(e) => setForm(p => ({ ...p, totalValue: e.target.value }))} required /></div>
              <div className="space-y-2"><Label htmlFor="proj-cost">Total Cost</Label><NumberInput id="proj-cost" value={form.totalCost} onChange={(e) => setForm(p => ({ ...p, totalCost: e.target.value }))} required /></div>
              <div className="space-y-2"><Label>Period</Label><MonthPicker value={form.period} onChange={(v) => setForm(p => ({ ...p, period: v }))} /></div>
              <div className="space-y-2"><Label htmlFor="proj-currency">Currency</Label><CurrencyCombobox value={form.currency} onChange={(v) => setForm(p => ({ ...p, currency: v }))} /></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              <Button type="submit" disabled={createMutation.isPending}>{createMutation.isPending ? "Creating..." : "Create Project"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader className="pb-3 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input placeholder={t("enterprise.projects.searchProjects")} className="pl-8" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          <div className="flex flex-wrap gap-2">
            <div className="w-40">
              <RepCombobox
                reps={searchReps}
                onSearch={onRepSearch}
                searching={repSearching}
                value={filterRep}
                onChange={setFilterRep}
                includeAll
                allLabel={t("enterprise.projects.allReps")}
              />
            </div>
            <div className="w-40">
              <Select value={filterPeriod} onValueChange={setFilterPeriod}>
                <SelectTrigger><SelectValue placeholder={t("enterprise.projects.allPeriods")} /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Periods</SelectItem>
                  {[...new Set((Array.isArray(projects) ? projects : []).map((p: any) => p.period).filter(Boolean))].map((p: any) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">{[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12">
              <div className="bg-muted size-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <FolderKanban className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium">No projects found</h3>
              <p className="text-sm text-muted-foreground mt-1">{searchTerm || filterRep !== "all" ? "No projects match your filters." : "Create your first project to get started."}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <div className="flex items-center gap-1.5">
                      Project Name
                      <HelpTooltip content="The name of the project." />
                    </div>
                  </TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Rep</TableHead>
                  <TableHead>GM%</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p: any) => {
                  const gm = p.totalValue > 0 ? ((p.totalValue - p.totalCost) / p.totalValue * 100).toFixed(1) : "0.0";
                  const repName = repMap.get(String(p.repId)) || "Unknown";
                  return (
                    <TableRow key={p._id} className="cursor-pointer hover:bg-muted/30" onClick={() => setLocation(`/dash/enterprise/projects/${p._id}`)}>
                      <TableCell className="font-medium">{p.name}</TableCell>
                      <TableCell className="font-medium text-primary">{formatCurrency(Number(p.totalValue), p.currency)}</TableCell>
                      <TableCell>{repName}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800/30">
                          {gm}%
                        </span>
                      </TableCell>
                      <TableCell>{p.period}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${p.status === "active" ? "bg-primary/10 text-primary border-primary/20" : p.status === "completed" ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800/30" : "bg-muted text-muted-foreground border-border"}`}>
                          {(p.status || "active").toUpperCase()}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteConfirmProject(p); }}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!deleteConfirmProject}
        onOpenChange={(v) => { if (!v) setDeleteConfirmProject(null); }}
        title="Delete Project"
        description={<>Are you sure you want to delete <strong>{deleteConfirmProject?.name}</strong>? All associated invoices will also be removed.</>}
        confirmLabel="Delete Project"
        onConfirm={() => {
          deleteMutation.mutate(deleteConfirmProject._id);
          setDeleteConfirmProject(null);
        }}
      />
    </div>
  );
}

function ImportProjectsDialog({ workspaceId, period, defaultCurrency, onImport, importing }: { workspaceId: string; period: string; defaultCurrency: string; onImport: (data: any[]) => void; importing: boolean }) {
  const [open, setOpen] = useState(false);
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { reps: searchReps, searching: repSearching, onSearch: onRepSearch } = useRepSearch(workspaceId);

  const downloadProjectTemplate = (type: "csv" | "xlsx") => {
    const data = [
      ["Project Name", "Rep", "Total Value", "Total Cost", "Period", "Currency"],
      ["AISSOL Alpha", "John Doe", 300000, 204000, "2025-06", "SAR"],
      ["AISSOL Beta", "Jane Smith", 150000, 100000, "2025-07", "SAR"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Projects Template");
    XLSX.writeFile(wb, `CommissionKit_Projects_Template.${type}`, { bookType: type === "csv" ? "csv" : undefined } as any);
  };

  const processData = (data: any[]) => {
    const mapped = data.map((row: any) => {
      const repName = (row['Rep'] || row['Sales Rep'] || row['rep'] || '').trim();
      const rep = searchReps?.find((r: any) => r.name.toLowerCase() === repName.toLowerCase() || r.email?.toLowerCase() === repName.toLowerCase());
      return {
        id: Math.random().toString(36).substr(2, 9),
        name: (row['Project Name'] || row['Name'] || row['Project'] || '').trim() || 'Unnamed Project',
        repId: rep?.id || "",
        repName: rep?.name || repName,
        totalValue: parseFloat((row['Total Value'] || row['Value'] || '0').toString().replace(/[^0-9.-]+/g, '')) || 0,
        totalCost: parseFloat((row['Total Cost'] || row['Cost'] || '0').toString().replace(/[^0-9.-]+/g, '')) || 0,
        period: (row['Period'] || row['period'] || period || '').trim(),
        currency: (row['Currency'] || row['currency'] || defaultCurrency).trim().toUpperCase(),
        status: 'active',
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
        Papa.parse(event.target?.result as string, { header: true, skipEmptyLines: true, complete: (r) => { processData(r.data); setIsParsing(false); } });
      };
      reader.readAsText(file);
    } else {
      reader.onload = (event) => {
        const wb = XLSX.read(new Uint8Array(event.target?.result as ArrayBuffer), { type: 'array' });
        processData(XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]));
        setIsParsing(false);
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const updateRow = (id: string, field: string, value: any) => {
    setParsedData(prev => prev ? prev.map(r => r.id === id ? { ...r, [field]: value } : r) : null);
  };

  const removeRow = (id: string) => {
    setParsedData(prev => prev ? prev.filter(r => r.id !== id) : null);
  };

  const handleImport = () => {
    if (!parsedData) return;
    const invalid = parsedData.filter(d => !d.repId);
    if (invalid.length > 0) {
      toast({ title: "Validation error", description: `Missing rep for ${invalid.length} rows.`, variant: "destructive" });
      return;
    }
    onImport(parsedData.map(({ id, repName, ...rest }) => rest));
    setOpen(false);
    setParsedData(null);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setParsedData(null); }}>
      <DialogTrigger asChild><Button variant="outline"><UploadCloud className="mr-2 size-4" /> Bulk Import</Button></DialogTrigger>
      <DialogContent className="sm:max-w-[95vw] md:max-w-[80vw] lg:max-w-[1000px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle>Import Projects</DialogTitle>
              <DialogDescription>Upload CSV or XLSX. Columns: Project Name, Rep, Total Value, Total Cost, Period, Currency.</DialogDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => downloadProjectTemplate("csv")} className="text-xs gap-1">
                <FileDown className="size-3" /> CSV
              </Button>
              <Button variant="outline" size="sm" onClick={() => downloadProjectTemplate("xlsx")} className="text-xs gap-1">
                <FileDown className="size-3" /> XLSX
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto py-4 min-h-0">
          {!parsedData ? (
            <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-12 text-center bg-muted/30">
              <div className="bg-primary/10 p-4 rounded-full mb-4"><UploadCloud className="size-8 text-primary" /></div>
              <h3 className="text-lg font-medium">Upload project data</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm">Drop CSV or XLSX file here, or click to browse.</p>
              <input type="file" ref={fileInputRef} onChange={handleFileUpload} accept=".csv,.xlsx" className="hidden" />
              <Button onClick={() => fileInputRef.current?.click()} disabled={isParsing} className="w-full max-w-xs">{isParsing ? "Parsing…" : "Select File"}</Button>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center bg-muted/40 p-2 rounded-lg border">
                <span className="text-sm font-medium px-2"><span className="text-primary">{parsedData.length}</span> rows detected</span>
                <Button variant="ghost" size="sm" onClick={() => setParsedData(null)}>Clear and re-upload</Button>
              </div>
              <div className="border rounded-xl overflow-x-auto bg-background">
                <Table>
                  <TableHeader className="bg-muted/50 sticky top-0 z-10"><TableRow>
                    <TableHead className="w-[200px]">Project Name</TableHead>
                    <TableHead className="w-[200px]">Sales Rep</TableHead>
                    <TableHead className="w-[120px]">Value</TableHead>
                    <TableHead className="w-[120px]">Cost</TableHead>
                    <TableHead className="w-[120px]">Period</TableHead>
                    <TableHead className="w-[120px]">Currency</TableHead>
                    <TableHead className="w-[50px]" />
                  </TableRow></TableHeader>
                  <TableBody>
                    {parsedData.map((row: any) => (
                      <TableRow key={row.id} className={!row.repId ? "bg-red-50/30 dark:bg-red-900/10" : ""}>
                        <TableCell><Input value={row.name} onChange={(e) => updateRow(row.id, 'name', e.target.value)} className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent" /></TableCell>
                        <TableCell>
                          <RepCombobox
                            reps={searchReps}
                            onSearch={onRepSearch}
                            searching={repSearching}
                            value={row.repId}
                            onChange={(v) => updateRow(row.id, 'repId', v)}
                            className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent shadow-none"
                          />
                          {!row.repId && <p className="text-[10px] text-destructive mt-0.5 ml-2">Unknown: {row.repName}</p>}
                        </TableCell>
                        <TableCell><NumberInput value={row.totalValue} onChange={(e) => updateRow(row.id, 'totalValue', e.target.value)} className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent" /></TableCell>
                        <TableCell><NumberInput value={row.totalCost} onChange={(e) => updateRow(row.id, 'totalCost', e.target.value)} className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent" /></TableCell>
                        <TableCell><MonthPicker value={row.period} onChange={(v) => updateRow(row.id, 'period', v)} className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent shadow-none" /></TableCell>
                        <TableCell><CurrencyCombobox value={row.currency} onChange={(v) => updateRow(row.id, 'currency', v)} className="h-8 text-xs border-transparent hover:border-input focus:border-input bg-transparent shadow-none hover:bg-muted/50" /></TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" onClick={() => removeRow(row.id)}><Trash2 className="size-3" /></Button></TableCell>
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
          {parsedData && <Button onClick={handleImport} disabled={importing}>{importing ? <><Loader2 className="mr-2 size-4 animate-spin" /> Importing…</> : `Import ${parsedData.length} projects`}</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
