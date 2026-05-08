import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListDeals, getListDealsQueryKey,
  useDeleteDeal,
  useListReps, getListRepsQueryKey,
  useImportDeals
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Trash, UploadCloud, FileDown, Briefcase } from "lucide-react";
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

export function DealsPage() {
  const [period, setPeriod] = useState<string>(format(new Date(), "yyyy-MM"));
  const [repId, setRepId] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const { can } = useRole();
  const { data: reps } = useListReps({ query: { queryKey: getListRepsQueryKey() } });
  
  const queryParams: any = { period };
  if (repId !== "all") queryParams.repId = repId;
  
  const { data: deals, isLoading } = useListDeals(
    queryParams,
    { query: { queryKey: getListDealsQueryKey(queryParams) } }
  );

  const filteredDeals = Array.isArray(deals) ? deals.filter(deal => 
    deal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    deal.repName.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Deals</h1>
          <p className="text-muted-foreground">Manage revenue events for commission calculation.</p>
        </div>
        <div className="flex gap-2">
          {can("admin") && <ImportDealsDialog period={period} />}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
          <div className="flex flex-1 items-center space-x-2 w-full md:w-auto">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search deals..."
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
              <Input 
                type="month" 
                value={period} 
                onChange={(e) => setPeriod(e.target.value)} 
                className="w-full"
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
              <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Briefcase className="h-6 w-6 text-muted-foreground" />
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
                      {formatCurrency(deal.amount)}
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
                      {can("admin") && <DealDeleteAction deal={deal} queryParams={queryParams} />}
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

function DealDeleteAction({ deal, queryParams }: { deal: any, queryParams: any }) {
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
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
          <Trash className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Delete Deal</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{deal.name}</strong> ({formatCurrency(deal.amount)})? This may affect historical commission calculations.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
            {deleteMutation.isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ImportDealsDialog({ period }: { period: string }) {
  const [open, setOpen] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [parsedData, setParsedData] = useState<any[] | null>(null);
  const [parseError, setParseError] = useState("");
  
  const { data: reps } = useListReps({ query: { queryKey: getListRepsQueryKey() } });
  const importMutation = useImportDeals();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Simple mapping - assuming CSV has: Rep Email, Deal Name, Amount, Close Date, Stage
  const handleParse = () => {
    setParseError("");
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          setParseError(results.errors[0].message);
          setParsedData(null);
          return;
        }
        
        const mapped = results.data.map((row: any) => {
          // Normalize keys to handle variations
          const repEmail = (row['Rep Email'] || row['email'] || row['Rep'] || '').trim();
          const dealName = (row['Deal Name'] || row['Name'] || row['Deal'] || '').trim();
          const amountStr = (row['Amount'] || row['Price'] || '0').toString().replace(/[^0-9.-]+/g, "");
          const closeDateStr = (row['Close Date'] || row['Date'] || '').trim();
          const stageRaw = (row['Stage'] || 'closed_won').toString().trim().toLowerCase().replace(' ', '_');
          const notes = (row['Notes'] || row['Description'] || '').trim();

          const rep = reps?.find(r => 
            r.email.toLowerCase() === repEmail.toLowerCase() || 
            r.name.toLowerCase() === repEmail.toLowerCase()
          );
          
          let stage: 'closed_won' | 'closed_lost' | 'pending' = 'closed_won';
          if (stageRaw.includes('lost')) stage = 'closed_lost';
          else if (stageRaw.includes('pending') || stageRaw.includes('open')) stage = 'pending';
          
          return {
            repId: rep?.id || "",
            repNameFound: !!rep,
            repEmail,
            name: dealName || 'Unknown Deal',
            amount: parseFloat(amountStr) || 0,
            closeDate: closeDateStr || new Date().toISOString().split('T')[0],
            period: period,
            stage,
            notes: notes || null
          };
        });
        
        setParsedData(mapped);
      }
    });
  };

  const handleImport = () => {
    if (!parsedData) return;
    
    // Filter out rows where rep wasn't found
    const validDeals = parsedData
      .filter(d => d.repNameFound)
      .map(({ repNameFound, repEmail, ...deal }) => deal);
    
    if (validDeals.length === 0) {
      toast({ title: "Import failed", description: "No valid deals to import. Check rep emails.", variant: "destructive" });
      return;
    }

    importMutation.mutate({ data: { period, deals: validDeals } }, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getListDealsQueryKey({ period }) });
        toast({ 
          title: "Import complete", 
          description: `Successfully imported ${res.imported} deals. Skipped ${res.skipped}.` 
        });
        setOpen(false);
        setCsvText("");
        setParsedData(null);
      }
    });
  };

  const templateCsv = `
Rep Email,Deal Name,Amount,Close Date,Stage,Notes
jane@example.com,Acme Corp Q3,50000,2023-09-15,closed_won,Enterprise deal
john@example.com,Globex Expansion,25000,2023-09-20,closed_won,SMB expansion
`;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (!val) { setCsvText(""); setParsedData(null); setParseError(""); }
    }}>
      <DialogTrigger asChild>
        <Button>
          <UploadCloud className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Import Deals</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            Import deals for the period <strong>{period}</strong>. 
            <HelpTooltip content="Ensure your CSV headers match the required format: Rep Email, Deal Name, Amount, Close Date, Stage." />
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          {!parsedData ? (
            <>
              <div className="bg-muted p-3 rounded-md text-xs font-mono mb-2">
                <span className="text-muted-foreground block mb-1">Expected CSV format:</span>
                {templateCsv}
              </div>
              <Label>Paste CSV Data</Label>
              <Textarea 
                rows={10} 
                value={csvText} 
                onChange={(e) => setCsvText(e.target.value)} 
                placeholder="Paste CSV data here..."
                className="font-mono text-sm"
              />
              {parseError && <div className="text-destructive text-sm">{parseError}</div>}
              <Button type="button" variant="secondary" onClick={handleParse} disabled={!csvText.trim()}>
                Preview Import
              </Button>
            </>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-muted p-2 rounded">
                <span className="text-sm font-medium">{parsedData.length} rows parsed</span>
                <Button variant="ghost" size="sm" onClick={() => setParsedData(null)}>Edit CSV</Button>
              </div>
              
              <div className="border rounded-md max-h-[40vh] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rep</TableHead>
                      <TableHead>Deal</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className={row.repNameFound ? "text-primary font-medium" : "text-destructive font-medium"}>
                              {row.repNameFound ? "Found" : "Missing Rep"}
                            </span>
                            <span className="text-[10px] text-muted-foreground truncate max-w-[120px]">{row.repEmail}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[150px] truncate">{row.name}</TableCell>
                        <TableCell>{formatCurrency(row.amount)}</TableCell>
                        <TableCell>
                          <span className="capitalize text-xs">{row.stage.replace('_', ' ')}</span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="text-sm text-muted-foreground">
                Found {parsedData.filter(d => d.repNameFound).length} valid deals. Missing reps will be skipped.
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="mt-auto pt-4 border-t">
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          {parsedData && (
            <Button onClick={handleImport} disabled={importMutation.isPending || parsedData.filter(d => d.repNameFound).length === 0}>
              {importMutation.isPending ? "Importing..." : `Import ${parsedData.filter(d => d.repNameFound).length} Deals`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}