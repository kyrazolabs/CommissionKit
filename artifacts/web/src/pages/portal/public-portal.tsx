import { format } from "date-fns";
import { ChevronDown, KeyRound, Loader2, LogOut, ShieldAlert, User } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "wouter";
import { PortalAuth } from "@/components/portal/portal-auth";
import { PortalChangePassword } from "@/components/portal/portal-change-password";
import {
  type Payout,
  PortalDashboard,
  type PortalSummary,
} from "@/components/portal/portal-dashboard";
import { PortalDisputeDialog } from "@/components/portal/portal-dispute-dialog";
import { RepAvatar } from "@/components/rep-avatar";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonthPicker } from "@/components/ui/month-picker";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { clearPortalToken, portalFetch, setPortalToken } from "@/lib/portal-fetch";
import { cn } from "@/lib/utils";

// ─── Skeleton ───────────────────────────────────────────────────────────────

function PortalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex gap-4 items-center">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <Skeleton className="size-10 w-40" />
      </div>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-75 w-full" />
      <Skeleton className="h-100 w-full" />
    </div>
  );
}

// ─── Change Password Dialog (inside orchestrator for profile access) ─────────

function ChangePasswordDialog({
  accessCode,
  open,
  onClose,
}: {
  accessCode: string;
  open: boolean;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const base = import.meta.env.VITE_API_URL ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.next !== form.confirm) {
      setError(t("portal.public.passwordsDoNotMatch"));
      return;
    }
    if (form.next.length < 8) {
      setError(t("portal.public.passwordMinLength"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await portalFetch(
        `${base}/api/portal/${encodeURIComponent(accessCode)}/change-password`,
        accessCode,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: form.current, newPassword: form.next }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("portal.public.failedToUpdatePassword"));
      if (data.token) setPortalToken(accessCode, data.token);
      toast({ title: t("portal.public.passwordChanged") });
      setForm({ current: "", next: "", confirm: "" });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(set) => (!set ? onClose() : null)}>
      <DialogContent className="w-[90vw] sm:max-w-100 rounded-lg">
        <DialogHeader>
          <DialogTitle>{t("portal.public.changePassword")}</DialogTitle>
          <DialogDescription>{t("portal.public.changePasswordDescription")}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="cp-current">{t("portal.public.currentPassword")}</Label>
            <Input
              id="cp-current"
              type="password"
              value={form.current}
              onChange={(e) => setForm((f) => ({ ...f, current: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-next">{t("portal.public.newPassword")}</Label>
            <Input
              id="cp-next"
              type="password"
              value={form.next}
              onChange={(e) => setForm((f) => ({ ...f, next: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cp-confirm">{t("portal.public.confirmPassword")}</Label>
            <Input
              id="cp-confirm"
              type="password"
              value={form.confirm}
              onChange={(e) => setForm((f) => ({ ...f, confirm: e.target.value }))}
              required
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <div className="flex justify-between w-full!">
              <Button type="button" variant="outline" className="w-fit" onClick={onClose}>
                {t("common.cancel")}
              </Button>
              <Button type="submit" className="w-fit" disabled={loading}>
                {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                {t("portal.public.updatePassword")}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Orchestrator ─────────────────────────────────────────────────────────

export function PublicRepPortal() {
  const { t } = useTranslation();
  const params = useParams<{ accessCode: string }>();
  const accessCode = params.accessCode ?? "";

  const [period, setPeriod] = useState(() => format(new Date(), "yyyy-MM"));
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [tempPassword, setTempPassword] = useState("");
  const tempPasswordRef = useRef("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<Payout | null>(null);
  const [workspaceName, setWsName] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const base = import.meta.env.VITE_API_URL ?? "";

  const refreshData = () => {
    if (!accessCode) return;
    // Don't try to fetch portal data while the user needs to change their password
    if (mustChangePassword) return;
    setLoading(true);
    setError(null);
    setPasswordRequired(false);

    portalFetch(`${base}/api/portal/${encodeURIComponent(accessCode)}?period=${period}`, accessCode)
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 401 && data.passwordRequired) {
          clearPortalToken(accessCode);
          setPasswordRequired(true);
          return null;
        }
        if (res.status === 403 && data.mustChangePassword) {
          setMustChangePassword(true);
          return null;
        }
        if (!res.ok) throw new Error(data.error ?? "Failed to load portal");
        if (data.workspaceName) setWsName(data.workspaceName);
        return data;
      })
      .then((data) => {
        if (data) setSummary(data);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)))
      .finally(() => setLoading(false));

    portalFetch(`${base}/api/portal/${encodeURIComponent(accessCode)}/payouts`, accessCode)
      .then(async (res) => {
        if (res.status === 401) return [];
        if (!res.ok) return [];
        const data = await res.json();
        return data.map((item: Payout & { periodStart: string; periodEnd: string }) => ({
          ...item,
          period: `${new Date(item.periodStart).toLocaleDateString("en", { month: "short", day: "2-digit" })} - ${new Date(item.periodEnd).toLocaleString("en", { month: "short", day: "2-digit" })}`,
        }));
      })
      .then((data: Payout[]) => setPayouts(data ?? []))
      .catch(() => setPayouts([]));
  };

  useEffect(() => {
    refreshData();
  }, [accessCode, period]);

  const handleLogout = () => {
    clearPortalToken(accessCode);
    setPasswordRequired(true);
    setSummary(null);
    setPayouts([]);
    tempPasswordRef.current = "";
  };

  const handleLogin = (username: string, pwd: string, mustChange: boolean, wsName: string) => {
    setTempPassword(pwd);
    tempPasswordRef.current = pwd;
    setWsName(wsName);
    if (mustChange) {
      setPasswordRequired(false);
      setMustChangePassword(true);
    } else {
      refreshData();
    }
  };

  const handlePasswordComplete = () => {
    setMustChangePassword(false);
    refreshData();
  };

  return (
    <div className="min-h-screen bg-sidebar">
      {/* Header — shown once authenticated */}
      {!loading && !passwordRequired && !mustChangePassword && !error && summary && (
        <header className="border-b border-sidebar-border bg-sidebar">
          <div className="max-w-5xl mx-auto px-2 h-14 flex items-center gap-4">
            {/* Logo + brand */}
            <div className="flex items-center gap-2.5 shrink-0">
              <img src="/brand/logo-symbol.svg" alt="CommissionKit" className="h-8" />
              <span className="text-2xl font-semibold tracking-tight text-foreground">
                CKit <span className="text-primary">Portal</span>
              </span>
            </div>

            {/* Divider */}
            <div className="flex-1 min-w-px max-w-px h-5 bg-sidebar-border" />

            {/* Avatar + Welcome + workspace */}
            <div className="flex-1 min-w-0 flex items-center gap-3">
              <div className="min-w-0">
                <p className="text-sm/tight font-medium text-foreground truncate">
                  {t("portal.public.welcomeBack") ?? "Welcome back"},{" "}
                  {summary.repName.split(" ")[0]}
                </p>
                <p className="text-xs/tight text-muted-foreground truncate">
                  {workspaceName || t("portal.public.workspace")}
                </p>
              </div>
            </div>

            {/* Period picker */}
            <div className="hidden sm:block h-8 w-34 shrink-0">
              <MonthPicker value={period} onChange={setPeriod} className="h-8 shadow-none" />
            </div>

            {/* User menu toggle */}
            <Button
              variant="ghost"
              size="md"
              className="h-8 gap-2 text-sm text-muted-foreground shrink-0 px-2"
              onClick={() => setUserMenuOpen(!userMenuOpen)}
            >
              <RepAvatar name={summary.repName} size={24} className="rounded-full shrink-0" />
              <ChevronDown
                className={cn("size-3 transition-transform", userMenuOpen && "rotate-180")}
              />
            </Button>
          </div>
        </header>
      )}

      {/* Expandable user panel */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          maxHeight: userMenuOpen && summary ? 300 : 0,
          opacity: userMenuOpen && summary ? 1 : 0,
        }}
      >
        <div className="bg-sidebar">
          <div className="max-w-5xl mx-auto px-6 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            {/* Avatar + info */}
            <div className="flex items-center gap-3 sm:flex-1 min-w-0">
              <RepAvatar
                name={summary?.repName ?? ""}
                size={45}
                className="rounded-full shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{summary?.repName}</p>
                <p className="text-xs text-muted-foreground truncate">{summary?.email}</p>
                {summary?.planName && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Plan: <span className="text-foreground font-medium">{summary.planName}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Period picker — only on small screens */}
            <div className="sm:hidden">
              <MonthPicker value={period} onChange={setPeriod} className="h-8 shadow-none w-full" />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 sm:shrink-0">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowProfile(true)}
                className="h-8 gap-1.5 text-xs"
              >
                <KeyRound className="size-3.5" />
                {t("portal.public.changePassword")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLogout}
                className="h-8 gap-1.5 text-xs text-destructive"
              >
                <LogOut className="size-3.5" />
                {t("sidebar.signOut")}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto p-6">
        {loading && <PortalSkeleton />}

        {!loading && passwordRequired && !mustChangePassword && (
          <PortalAuth accessCode={accessCode} onLogin={handleLogin} />
        )}

        {!loading && mustChangePassword && (
          <PortalChangePassword
            accessCode={accessCode}
            currentPassword={tempPassword || tempPasswordRef.current}
            onComplete={handlePasswordComplete}
          />
        )}

        {!loading && !passwordRequired && error && !mustChangePassword && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="size-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              {t("portal.public.portalNotFoundTitle")}
            </h1>
            <p className="text-muted-foreground max-w-sm">
              {error}. {t("portal.public.portalNotFoundDescription")}
            </p>
          </div>
        )}

        {!loading && !passwordRequired && !mustChangePassword && !summary && !error && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="size-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">
              {t("portal.public.portalNotFoundTitle")}
            </h1>
            <p className="text-muted-foreground max-w-sm">
              {t("portal.public.portalNotFoundDescription")}
            </p>
            <Button variant="outline" onClick={refreshData}>
              {t("common.retry")}
            </Button>
          </div>
        )}

        {!loading && !passwordRequired && !error && !mustChangePassword && summary && (
          <PortalDashboard
            summary={summary}
            payouts={payouts}
            period={period}
            onPeriodChange={setPeriod}
            onDispute={(p) => setDisputeTarget(p)}
          />
        )}
      </main>

      {/* Dispute modal */}
      {disputeTarget && (
        <PortalDisputeDialog
          payout={disputeTarget}
          accessCode={accessCode}
          onClose={() => setDisputeTarget(null)}
          onSuccess={() => {
            setDisputeTarget(null);
            refreshData();
          }}
        />
      )}

      {/* Profile password change */}
      <ChangePasswordDialog
        accessCode={accessCode}
        open={showProfile}
        onClose={() => setShowProfile(false)}
      />
    </div>
  );
}
