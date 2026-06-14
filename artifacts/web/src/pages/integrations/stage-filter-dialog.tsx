import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Filter, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import type { StageOption } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  connectorName: string;
}

export function StageFilterDialog({ open, onOpenChange, connectorName }: Props) {
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<StageOption[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setLoadError(null);
    apiFetch(`/api/integrations/${activeWorkspace?.id}/${connectorName}/stages`)
      .then((data) => {
        setStages(data.stages || []);
        // Load existing filter
        apiFetch(`/api/integrations/${activeWorkspace?.id}/config`)
          .then((cfg) => {
            const filter = (cfg as any)?.metadata?.stageFilter || [];
            setSelected(filter.length > 0 ? filter : (data.stages || []).map((s: StageOption) => s.id));
          })
          .catch(() => setSelected((data.stages || []).map((s: StageOption) => s.id)));
      })
      .catch((err) => setLoadError(err.message || "Failed to load stages"))
      .finally(() => setLoading(false));
  }, [open, activeWorkspace?.id, connectorName]);

  const toggle = (id: string) => {
    setSelected((prev) => prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]);
  };

  const selectAll = () => setSelected(stages.map((s) => s.id));
  const clearAll = () => setSelected([]);

  const save = async () => {
    try {
      await apiFetch(`/api/integrations/${activeWorkspace?.id}/connector/settings`, {
        method: "PATCH",
        body: JSON.stringify({ stageFilter: selected }),
      });
      onOpenChange(false);
      toast({ title: "Stage filter saved" });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Filter className="size-5" />Stage Filter</DialogTitle>
          <DialogDescription>Select which stages to import. Unchecked stages are skipped during sync.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[300px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>
          ) : loadError ? (
            <p className="text-sm text-destructive text-center py-8">{loadError}</p>
          ) : stages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No stages found.</p>
          ) : (
            <>
              <div className="flex gap-2 mb-2">
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={selectAll}>Select All</Button>
                <Button variant="ghost" size="sm" className="text-xs h-7" onClick={clearAll}>Clear All</Button>
              </div>
              {stages.map((stage) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <Checkbox id={`sf-${stage.id}`} checked={selected.includes(stage.id)} onCheckedChange={() => toggle(stage.id)} />
                  <Label htmlFor={`sf-${stage.id}`} className="flex-1 cursor-pointer">
                    <p className="text-sm font-medium">{stage.label}</p>
                    {stage.pipeline && <p className="text-[11px] text-muted-foreground">{stage.pipeline}</p>}
                  </Label>
                </div>
              ))}
            </>
          )}
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={loading}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
