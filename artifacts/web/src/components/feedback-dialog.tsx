import { MessageSquare, Star, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

const STORAGE_KEY = "ck-feedback-last-shown";

interface FeedbackDialogProps {
  open: boolean;
  onClose: () => void;
}

export function FeedbackDialog({ open, onClose }: FeedbackDialogProps) {
  const { t } = useTranslation();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setRating(0);
    setHoverRating(0);
    setMessage("");
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (rating === 0) {
      setError(t("feedback.ratingRequired"));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await apiFetch("/api/feedback", {
        method: "POST",
        body: JSON.stringify({ rating, message }),
        headers: { "Content-Type": "application/json" },
      });
      toast({ title: t("feedback.thanks") });
      // Don't ask again for 30 days after submitting
      localStorage.setItem(STORAGE_KEY, String(Date.now() + 30 * 24 * 60 * 60 * 1000));
      handleClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || t("feedback.submitFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const displayRating = hoverRating || rating;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <DialogTitle>{t("feedback.title")}</DialogTitle>
          <DialogDescription>{t("feedback.description")}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="flex items-center justify-center gap-1.5 py-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-muted"
                aria-label={`${star} ${t("feedback.stars")}`}
              >
                <Star
                  className={`size-5 transition-colors ${
                    star <= displayRating
                      ? "fill-primary text-primary"
                      : "fill-none text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>

          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={t("feedback.placeholder")}
            rows={4}
            className="resize-none"
          />

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={handleClose}
              disabled={submitting}
              className="flex-1"
            >
              {t("common.cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || rating === 0}
              className="flex-1"
            >
              {submitting ? t("feedback.submitting") : t("feedback.submit")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Smart prompt: subtle banner that respects frequency ────────────────────

export function useFeedbackPrompt() {
  const { t } = useTranslation();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // Check if we should show the prompt (once every 7 days max)
  useEffect(() => {
    const lastShown = localStorage.getItem(STORAGE_KEY);
    if (lastShown && Date.now() < Number(lastShown)) return;
    // Show after a short delay so the page loads first
    const timer = setTimeout(() => setBannerDismissed(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    // Don't show again for 7 days
    localStorage.setItem(STORAGE_KEY, String(Date.now() + 7 * 24 * 60 * 60 * 1000));
    setBannerDismissed(true);
  };

  const handleOpen = () => setDialogOpen(true);

  const banner = !bannerDismissed ? (
    <div className="flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg border border-card-border bg-card text-sm">
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors flex-1 text-left"
      >
        <MessageSquare className="size-3.5 shrink-0 text-primary" />
        <span>{t("feedback.promptBanner")}</span>
      </button>
      <button
        onClick={handleDismiss}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="size-3.5" />
      </button>
    </div>
  ) : null;

  const dialog = <FeedbackDialog open={dialogOpen} onClose={() => setDialogOpen(false)} />;

  return { banner, dialog, openDialog: handleOpen };
}
