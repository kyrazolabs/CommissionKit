import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GitBranch, LoaderCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import type { StageOption } from "./types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function StageMappingDialog({ open, onOpenChange }: Props) {
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stages, setStages] = useState<StageOption[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await apiFetch(`/api/integrations/${activeWorkspace?.id}/hubspot/stages`);
      setStages(data.stages || []);
      setMapping(data.mapping || {});
    } catch (err: any) {
      setLoadError(err.message || "Failed to fetch stages");
      setStages([]);
      setMapping({});
    }
    finally { setLoading(false); }
  };

  const save = async () => {
    try {
      await apiFetch(`/api/integrations/${activeWorkspace?.id}/hubspot/stages`, { method: "PATCH", body: JSON.stringify({ mapping }) });
      onOpenChange(false);
      toast({ title: "Stage mapping saved" });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  const handleOpen = (o: boolean) => {
    onOpenChange(o);
    if (o) load();
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><GitBranch className="size-5" />Stage Mapping</DialogTitle>
          <DialogDescription>Map HubSpot pipeline stages to CommissionKit stages.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8"><LoaderCircle className="size-5 animate-spin text-muted-foreground" /></div>
          ) : loadError ? (
            <p className="text-sm text-destructive text-center py-8">{loadError}</p>
          ) : stages.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No stages found.</p>
          ) : (
            stages.map((stage) => (
              <div key={stage.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{stage.label}</p>
                  <p className="text-[11px] text-muted-foreground">{stage.pipeline}</p>
                </div>
                <Select value={mapping[stage.id] || ""} onValueChange={(v) => setMapping((prev) => ({ ...prev, [stage.id]: v }))}>
                  <SelectTrigger className="w-36 h-8 text-xs"><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="closed_won">closed_won</SelectItem>
                    <SelectItem value="closed_lost">closed_lost</SelectItem>
                    <SelectItem value="pending">pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))
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
