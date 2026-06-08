import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  json: string;
  onJsonChange: (json: string) => void;
  error: string | null;
  onErrorChange: (error: string | null) => void;
}

export function MappingDialog({ open, onOpenChange, json, onJsonChange, error, onErrorChange }: Props) {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (config: Record<string, unknown>) =>
      apiFetch(`/api/integrations/${activeWorkspace?.id}/config`, { method: "PATCH", body: JSON.stringify({ config }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      onOpenChange(false);
      toast({ title: "Mapping saved" });
    },
    onError: (err: Error) => onErrorChange(err.message),
  });

  const save = () => {
    onErrorChange(null);
    try {
      const parsed = JSON.parse(json);
      mutation.mutate(parsed.config || parsed);
    } catch (e: any) {
      onErrorChange(e.message || "Invalid JSON");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileCode className="size-5" />Edit Connector Mapping</DialogTitle>
          <DialogDescription>Edit the full connector configuration in JSON. This includes endpoints, field mappings, pagination, and filters.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Textarea value={json} onChange={(e) => { onJsonChange(e.target.value); onErrorChange(null); }} className="min-h-[400px] font-mono text-xs leading-relaxed" placeholder='{ "baseUrl": "...", "auth": { ... }, "entities": { ... } }' />
          {error && <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
          {mutation.isError && <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{(mutation.error as Error)?.message || "Failed to save"}</div>}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={save} disabled={mutation.isPending}>{mutation.isPending ? "Saving..." : "Save"}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
