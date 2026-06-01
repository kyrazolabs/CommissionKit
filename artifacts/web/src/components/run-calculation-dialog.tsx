"use client"

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  getListRunsQueryKey,
  useCreateRun
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { PlayCircle, CalendarDays, Loader2 } from "lucide-react";
import { format, parseISO } from "date-fns";
import { HelpTooltip } from "@/components/help-tooltip";
import { useToast } from "@/hooks/use-toast";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/ui/month-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function RunCalculationDialog({ isProcessing, trigger }: { isProcessing: boolean; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<string>(() => format(new Date(), "yyyy-MM"));
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateRun();

  const handleRun = () => {
    const data: any = { period };
    if (paymentStatusFilter !== "all") {
      data.paymentStatuses = [paymentStatusFilter];
    }
    createMutation.mutate({ data }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRunsQueryKey() });
        toast({ title: "Calculation Queued", description: `Commission calculation for ${period} has been started.` });
        setOpen(false);
      },
      onError: (err: any) => {
        toast({ title: "Run failed", description: err.message || "An error occurred", variant: "destructive" });
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button 
            className="bg-primary hover:bg-primary/90 text-primary-foreground" 
            disabled={isProcessing}
          >
            {isProcessing ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Processing…
              </>
            ) : (
              <>
                <PlayCircle className="mr-2 size-4" />
                Run Calculation
              </>
            )}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Trigger Commission Calculation</DialogTitle>
          <DialogDescription className="flex items-center gap-1.5">
            This will process all closed won deals for the specified period and calculate rep commissions.
            <HelpTooltip content="Calculating a run takes a 'snapshot' of current deals and plans. If you add deals later, you'll need to run it again to update totals." />
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="period">Calculation Period (YYYY-MM)</Label>
            <div className="flex items-center gap-2">
              <MonthPicker 
                value={period}
                onChange={setPeriod}
                placeholder="Pick a month"
                className="flex-1"
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="paymentStatus">Payment Status Filter</Label>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="unpaid">Unpaid only</SelectItem>
                <SelectItem value="paid">Paid only</SelectItem>
                <SelectItem value="partial">Partial only</SelectItem>
                <SelectItem value="on_hold">On Hold only</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-1">
              Optionally restrict calculation to deals with a specific payment status.
            </p>
          </div>
          <p className="text-xs text-muted-foreground">
            Warning: Running for a period that already has a calculation will create a new run record.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleRun} disabled={createMutation.isPending}>
            {createMutation.isPending ? "Processing…" : "Start Calculation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
