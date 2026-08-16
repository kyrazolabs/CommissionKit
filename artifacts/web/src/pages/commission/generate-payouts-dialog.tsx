import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/format";
import { apiFetch } from "@/lib/api";
import { DollarSign, Loader2, Users, FileText } from "lucide-react";

interface RepTotal {
  repId: string;
  repName: string;
  dealCount: number;
  totalCommission: number;
}

interface GeneratePayoutsDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  runId: string;
  repTotals: RepTotal[];
  totalCommission: number;
  currency: string;
}

export function GeneratePayoutsDialog({
  open,
  setOpen,
  runId,
  repTotals,
  totalCommission,
  currency,
}: GeneratePayoutsDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedRepIds, setSelectedRepIds] = useState<Set<string>>(
    () => new Set(repTotals.map((r) => r.repId))
  );
  const [lastOpenRepTotalsKey, setLastOpenRepTotalsKey] = useState("");

  // Reset selection when dialog opens with new repTotals data
  const repTotalsKey = JSON.stringify(repTotals.map((r) => r.repId));
  if (open && repTotalsKey !== lastOpenRepTotalsKey) {
    setLastOpenRepTotalsKey(repTotalsKey);
    setSelectedRepIds(new Set(repTotals.map((r) => r.repId)));
  }

  const toggleRep = (repId: string) => {
    setSelectedRepIds((prev) => {
      const next = new Set(prev);
      if (next.has(repId)) {
        next.delete(repId);
      } else {
        next.add(repId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedRepIds.size === repTotals.length) {
      setSelectedRepIds(new Set());
    } else {
      setSelectedRepIds(new Set(repTotals.map((r) => r.repId)));
    }
  };

  const selectedSum = useMemo(
    () =>
      repTotals
        .filter((r) => selectedRepIds.has(r.repId))
        .reduce((sum, r) => sum + r.totalCommission, 0),
    [repTotals, selectedRepIds]
  );

  const selectedCount = selectedRepIds.size;

  const mutation = useMutation({
    mutationFn: async () => {
      return apiFetch(`/api/runs/${runId}/generate-payouts`, {
        method: "POST",
        body: JSON.stringify({
          repIds: Array.from(selectedRepIds),
        }),
      });
    },
    onSuccess: (data: any) => {
      const created = data?.created?.length ?? 0;
      const skipped = data?.skipped?.length ?? 0;
      toast({
        title: `Created ${created} payout${created !== 1 ? "s" : ""}`,
        description: skipped
          ? `${skipped} already existed`
          : undefined,
      });
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["payouts"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/dashboard/summary"],
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Failed to generate payouts",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate Payouts</DialogTitle>
          <DialogDescription>
            Create payouts for reps from this commission run.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="size-4 shrink-0" />
            <span>
              This run covers{" "}
              <span className="font-semibold text-foreground">
                {repTotals.length} rep{repTotals.length !== 1 ? "s" : ""}
              </span>{" "}
              with{" "}
              <span className="font-semibold text-primary tabular-nums">
                {formatCurrency(totalCommission, currency)}
              </span>{" "}
              in total commissions
            </span>
          </div>

          {/* Select All toggle */}
          <button
            type="button"
            onClick={toggleAll}
            className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {selectedRepIds.size === repTotals.length
              ? "Deselect All"
              : "Select All"}
          </button>

          {/* Rep list */}
          <div className="max-h-64 overflow-y-auto space-y-1">
            {repTotals.map((rep) => (
              <label
                key={rep.repId}
                className="flex items-center gap-3 rounded-md px-2 py-1.5 hover:bg-muted/40 cursor-pointer transition-colors"
              >
                <Checkbox
                  checked={selectedRepIds.has(rep.repId)}
                  onCheckedChange={() => toggleRep(rep.repId)}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {rep.repName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {rep.dealCount} deal{rep.dealCount !== 1 ? "s" : ""}
                  </p>
                </div>
                <span className="text-sm font-semibold text-primary tabular-nums shrink-0">
                  {formatCurrency(rep.totalCommission, currency)}
                </span>
              </label>
            ))}
          </div>

          {/* Selection summary */}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Users className="size-3.5 shrink-0" />
            <span>
              {selectedCount} of {repTotals.length} reps selected —{" "}
              <span className="font-medium text-primary tabular-nums">
                {formatCurrency(selectedSum, currency)}
              </span>
            </span>
          </div>

          {/* Info note */}
          <p className="text-xs text-muted-foreground">
            Payouts will be created as pending and can be reviewed on the
            Payouts page.
          </p>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={mutation.isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || selectedCount === 0}
          >
            {mutation.isPending ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <DollarSign className="mr-2 size-4" />
                Generate Payouts
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
