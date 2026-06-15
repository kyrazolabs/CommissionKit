import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";

const STATUS_OPTIONS = [
  { value: "paid", label: "Paid (default)" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "on_hold", label: "On Hold" },
];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PaymentDefaultsDialog({ open, onOpenChange }: Props) {
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [status, setStatus] = useState("paid");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    apiFetch(`/api/integrations/${activeWorkspace?.id}/config`)
      .then((data) => {
        const meta = (data as any)?.metadata || {};
        setStatus(meta.defaultPaymentStatus || "paid");
      })
      .catch(() => setStatus("paid"))
      .finally(() => setLoading(false));
  }, [open, activeWorkspace?.id]);

  const save = async () => {
    try {
      await apiFetch(`/api/integrations/${activeWorkspace?.id}/connector/settings`, {
        method: "PATCH",
        body: JSON.stringify({ defaultPaymentStatus: status }),
      });
      onOpenChange(false);
      toast({ title: "Payment defaults saved" });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CreditCard className="size-5" />Payment Defaults</DialogTitle>
          <DialogDescription>Set the default payment status for closed-won deals imported from this CRM.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-[11px] text-muted-foreground">CRMs don't track payments. Choose what status to assign to closed-won deals on import.</p>
        </div>
        <div className="flex gap-2 justify-end pt-2">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={save} disabled={loading}>Save</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
