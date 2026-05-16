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

export function RunCalculationDialog({ isProcessing, trigger }: { isProcessing: boolean; trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [period, setPeriod] = useState<string>(() => format(new Date(), "yyyy-MM"));
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreateRun();

  const handleRun = () => {
    createMutation.mutate({ data: { period } }, {
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
            This will process all pending and closed won deals for the specified period and calculate rep commissions.
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
            <p className="text-xs text-muted-foreground mt-1">
              Warning: Running for a period that already has a calculation will create a new run record.
            </p>
          </div>
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
