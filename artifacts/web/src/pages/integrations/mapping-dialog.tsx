import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: (config: Record<string, unknown>) =>
      apiFetch(`/api/integrations/${activeWorkspace?.id}/config`, { method: "PATCH", body: JSON.stringify({ config }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      onOpenChange(false);
      toast({ title: t("integrations.mappingSaved") });
    },
    onError: (err: Error) => onErrorChange(err.message),
  });

  const save = () => {
    onErrorChange(null);
    try {
      const parsed = JSON.parse(json);
      mutation.mutate(parsed.config || parsed);
    } catch (e: any) {
      onErrorChange(e.message || t("integrations.invalidJson"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileCode className="size-5" />{t("integrations.editMappingTitle")}</DialogTitle>
          <DialogDescription>{t("integrations.editMappingDesc")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Textarea value={json} onChange={(e) => { onJsonChange(e.target.value); onErrorChange(null); }} className="min-h-[400px] font-mono text-xs leading-relaxed" placeholder='{ "baseUrl": "...", "auth": { ... }, "entities": { ... } }' />
          {error && <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{error}</div>}
          {mutation.isError && <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">{(mutation.error as Error)?.message || t("integrations.connectionFailed")}</div>}
          <div className="flex gap-2 justify-end">
            <Button variant="secondary" onClick={() => onOpenChange(false)}>{t("integrations.cancel")}</Button>
            <Button onClick={save} disabled={mutation.isPending}>{mutation.isPending ? t("integrations.saving") : t("integrations.save")}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
