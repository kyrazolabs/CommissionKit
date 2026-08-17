import { AlertTriangle } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/format";
import { portalFetch } from "@/lib/portal-fetch";
import { cn } from "@/lib/utils";

interface PayoutInfo {
  id: string;
  period: string;
  commissionAmount: number;
  currency: string;
  status: string;
}

interface PortalDisputeDialogProps {
  payout: PayoutInfo;
  accessCode: string;
  onClose: () => void;
  onSuccess: () => void;
}

const REASON_MIN_LENGTH = 10;

export function PortalDisputeDialog({
  payout,
  accessCode,
  onClose,
  onSuccess,
}: PortalDisputeDialogProps) {
  const { t } = useTranslation();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const reasonTooShort = reason.trim().length > 0 && reason.trim().length < REASON_MIN_LENGTH;
  const canSubmit = reason.trim().length >= REASON_MIN_LENGTH && !loading;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!canSubmit) return;

    setLoading(true);
    try {
      await portalFetch(`/api/portal/${accessCode}/disputes`, accessCode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payoutId: payout.id,
          reason: reason.trim(),
        }),
      });

      onSuccess();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : (t("portal.disputeSubmitError") ?? "Failed to submit dispute. Please try again."),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>{t("portal.disputeTitle") ?? "Submit Dispute"}</DialogTitle>
          <DialogDescription>
            {t("portal.disputeDescription") ??
              "Explain why this payout looks incorrect and our team will review it."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Payout info */}
          <div className="rounded-lg border border-card-border bg-muted/30 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("portal.period") ?? "Period"}
              </span>
              <span className="text-sm font-medium text-foreground">{payout.period}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("portal.amount") ?? "Amount"}
              </span>
              <span className="text-sm font-medium text-foreground tabular-nums">
                {formatCurrency(payout.commissionAmount, payout.currency)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                {t("portal.status") ?? "Status"}
              </span>
              <span className="text-sm font-medium text-foreground capitalize">
                {payout.status}
              </span>
            </div>
          </div>

          {/* Reason textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="dispute-reason">{t("portal.disputeReason") ?? "Reason"}</Label>
              <span
                className={cn(
                  "text-xs tabular-nums",
                  reasonTooShort ? "text-destructive" : "text-muted-foreground",
                )}
              >
                {reason.trim().length}/{REASON_MIN_LENGTH}+
              </span>
            </div>
            <Textarea
              id="dispute-reason"
              placeholder={
                t("portal.disputeReasonPlaceholder") ??
                "Please describe the issue with this payout..."
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className={cn(
                "resize-none",
                reasonTooShort && "border-destructive focus:border-destructive",
              )}
              aria-invalid={reasonTooShort}
            />
            {reasonTooShort && (
              <p className="text-xs text-destructive">
                {t("portal.disputeReasonMin") ??
                  `Reason must be at least ${REASON_MIN_LENGTH} characters.`}
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="size-4" />
              <p className="text-sm">{error}</p>
            </Alert>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {t("common.cancel") ?? "Cancel"}
          </Button>
          <Button
            variant="default"
            onClick={handleSubmit}
            disabled={!canSubmit}
            aria-busy={loading}
          >
            {loading
              ? (t("portal.submitting") ?? "Submitting...")
              : (t("portal.submitDispute") ?? "Submit Dispute")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
