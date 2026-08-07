import { useState } from "react";
import { ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { portalFetch, setPortalToken } from "@/lib/portal-fetch";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff, LoaderCircle } from "lucide-react";

interface PortalChangePasswordProps {
  accessCode: string;
  currentPassword: string;
  onComplete: () => void;
}

export function PortalChangePassword({
  accessCode,
  currentPassword,
  onComplete,
}: PortalChangePasswordProps) {
  const { t } = useTranslation();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = import.meta.env.VITE_API_URL ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 8) {
      setError(t("portal.passwordMinLength", "Password must be at least 8 characters."));
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("portal.passwordMismatch", "Passwords do not match."));
      return;
    }

    setLoading(true);

    try {
      const res = await portalFetch(`${base}/api/portal/${encodeURIComponent(accessCode)}/change-password`, accessCode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || data.message || t("portal.changePasswordFailed", "Failed to change password."));
      }

      // Save the new token — the backend returns a fresh JWT with mustChangePassword: false
      const data = await res.json();
      if (data.token) {
        setPortalToken(accessCode, data.token);
      }

      onComplete();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("portal.changePasswordFailed", "Failed to change password."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-sm rounded-xl border border-card-border bg-card shadow-card">
      <CardHeader className="pb-4 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-lg bg-primary/10">
          <ShieldAlert className="size-6 text-primary" strokeWidth={2} />
        </div>
        <CardTitle className="text-[15px] font-semibold leading-snug tracking-tight">
          {t("portal.changePassword", "Change Password")}
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground">
          {t("portal.changePasswordDesc", "Set a new password for your rep portal access.")}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="new-password" className="text-sm font-medium">
              {t("portal.newPassword", "New Password")}
            </Label>
            <div className="relative">
              <Input
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="pr-10"
                autoComplete="new-password"
                disabled={loading}
                placeholder={t("portal.newPasswordPlaceholder", "Enter new password")}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showNewPassword ? (
                  <EyeOff className="size-4" strokeWidth={2} />
                ) : (
                  <Eye className="size-4" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-sm font-medium">
              {t("portal.confirmNewPassword", "Confirm New Password")}
            </Label>
            <div className="relative">
              <Input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="pr-10"
                autoComplete="new-password"
                disabled={loading}
                placeholder={t("portal.confirmPasswordPlaceholder", "Confirm new password")}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                tabIndex={-1}
              >
                {showConfirmPassword ? (
                  <EyeOff className="size-4" strokeWidth={2} />
                ) : (
                  <Eye className="size-4" strokeWidth={2} />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading}
          >
            {loading ? (
              <LoaderCircle className="size-4 animate-spin" strokeWidth={2} />
            ) : (
              t("portal.setPassword", "Set Password")
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
