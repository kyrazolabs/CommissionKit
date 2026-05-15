import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { format } from "date-fns";
import { formatCurrency, formatPercent } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CalendarDays,
  DollarSign,
  Activity,
  Briefcase,
  ShieldAlert,
  Wallet,
  Lock,
  MessageSquare,
  Loader2,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import { CurrencyCell } from "@/components/currency-cell";

// Note: authClient is NOT used in this file.
// Portal auth is completely isolated via a custom JWT stored in localStorage.

// ─── Types ─────────────────────────────────────────────────────────────────

interface DealBreakdown {
  dealId: string;
  dealName: string;
  dealAmount: number;
  closeDate: string;
  rateApplied: number;
  commissionAmount: number;
  currency: string;
  calculationNote: string;
  wsCurrency?: string;
  convertedDealAmount?: number;
  convertedCommission?: number;
  exchangeRateSnapshot?: Record<string, number>;
  rateSnapshotDate?: Date | string;
}

interface CurrencySummary {
  currency: string;
  totalCommission: number;
  totalRevenue: number;
  totalDeals: number;
}

interface MonthlyHistory {
  period: string;
  totalCommission: number;
  totalDeals: number;
}

interface PortalSummary {
  repId: string;
  repName: string;
  email: string;
  planName: string | null;
  period: string;
  totalCommission: number;
  totalRevenue: number;
  totalDeals: number;
  dealBreakdown: DealBreakdown[];
  monthlyHistory: MonthlyHistory[];
  currencySummaries?: CurrencySummary[];
  currency: string;
}

// ─── Portal Auth Helpers ─────────────────────────────────────────────────────

function getPortalToken(accessCode: string): string | null {
  return localStorage.getItem(`portal_token_${accessCode}`);
}

function setPortalToken(accessCode: string, token: string): void {
  localStorage.setItem(`portal_token_${accessCode}`, token);
}

function clearPortalToken(accessCode: string): void {
  localStorage.removeItem(`portal_token_${accessCode}`);
}

function portalFetch(url: string, accessCode: string, init: RequestInit = {}): Promise<Response> {
  const token = getPortalToken(accessCode);
  return fetch(url, {
    ...init,
    headers: {
      ...init.headers,
      ...(token ? { "Authorization": `Bearer ${token}` } : {}),
    },
  });
}

// ─── Login View ─────────────────────────────────────────────────────────────

function PortalLogin({ accessCode, onLogin }: { accessCode: string; onLogin: (password: string, mustChangePassword: boolean) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = import.meta.env.VITE_API_URL ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${base}/api/portal/${encodeURIComponent(accessCode)}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");

      // Store the portal-scoped JWT in localStorage : NOT a cookie.
      // This never conflicts with the dashboard admin session.
      setPortalToken(accessCode, data.token);
      onLogin(password, data.mustChangePassword);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-20">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary/10 size-12 rounded-full flex items-center justify-center mb-2">
            <Lock className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">Secure Portal</CardTitle>
          <CardDescription>
            This portal is password-protected. Please enter your portal password to continue.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="e.g. john.doe"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md flex items-center gap-2">
                <ShieldAlert className="size-4" />
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Access Portal
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

function ForcePasswordChange({
  accessCode,
  currentPassword: initialCurrentPassword,
  onComplete,
}: {
  accessCode: string;
  currentPassword?: string;
  onComplete: (newToken: string) => void;
}) {
  const [currentPassword, setCurrentPassword] = useState(initialCurrentPassword || "");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const base = import.meta.env.VITE_API_URL ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword) {
      setError("Current password is required");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Call our own isolated endpoint : no Better Auth session needed
      const res = await portalFetch(
        `${base}/api/portal/${encodeURIComponent(accessCode)}/change-password`,
        accessCode,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword, newPassword }),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update password");

      // Replace the stored token with the new one that has mustChangePassword: false
      setPortalToken(accessCode, data.token);
      onComplete(data.token);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center p-20">
      <Card className="w-full max-w-md shadow-lg border-primary/10">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto bg-primary/10 size-12 rounded-full flex items-center justify-center mb-2">
            <Lock className="size-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-semibold">Secure Your Account</CardTitle>
          <CardDescription>
            {initialCurrentPassword 
              ? "You are using a temporary password. Please set a new, secure password to continue."
              : "Please confirm your temporary password and set a new, secure password."}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!initialCurrentPassword && (
              <div className="space-y-2">
                <Label htmlFor="current-password">Current (Temporary) Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md flex items-center gap-2">
                <ShieldAlert className="size-4" />
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button className="w-full" type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              Update Password & Enter
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

// ─── Dispute Modal ──────────────────────────────────────────────────────────

function DisputeModal({ 
  payout, 
  accessCode, 
  onClose, 
  onSuccess 
}: { 
  payout: any; 
  accessCode: string; 
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const base = import.meta.env.VITE_API_URL ?? "";

  const handleSubmit = async () => {
    if (!reason.trim()) return;
    setLoading(true);
    try {
      const res = await portalFetch(`${base}/api/portal/${encodeURIComponent(accessCode)}/disputes`, accessCode, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payoutId: payout.id, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to submit dispute");
      toast({ title: "Dispute submitted", description: "Your manager has been notified." });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Dispute Payout</DialogTitle>
        <DialogDescription>
          Raising a dispute for period {format(new Date(payout.periodStart), "MMM d")} – {format(new Date(payout.periodEnd), "MMM d")}.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid gap-2">
          <Label htmlFor="reason">Reason for dispute</Label>
          <Textarea
            id="reason"
            placeholder="Explain why this payout seems incorrect…"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={loading}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading || !reason.trim()}>
          {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
          Submit Dispute
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}

// ─── Page ───────────────────────────────────────────────────────────────────

export function PublicRepPortal() {
  const params = useParams<{ accessCode: string }>();
  const accessCode = params.accessCode ?? "";
  const [period, setPeriod] = useState<string>(format(new Date(), "yyyy-MM"));
  const [summary, setSummary] = useState<PortalSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [tempPassword, setTempPassword] = useState<string>("");
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [disputeTarget, setDisputeTarget] = useState<any | null>(null);

  const base = import.meta.env.VITE_API_URL ?? "";

  const refreshData = () => {
    if (!accessCode) return;
    setLoading(true);
    setError(null);
    setPasswordRequired(false);

    // Fetch summary : Bearer token attached automatically by portalFetch
    portalFetch(`${base}/api/portal/${encodeURIComponent(accessCode)}?period=${period}`, accessCode)
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 401 && data.passwordRequired) {
          // No valid portal token : show the login form
          clearPortalToken(accessCode);
          setPasswordRequired(true);
          return null;
        }
        if (res.status === 403 && data.mustChangePassword) {
          // Logged in but must set a new password
          setMustChangePassword(true);
          return null;
        }
        if (!res.ok) throw new Error(data.error || "Failed to load portal");
        return data;
      })
      .then((data) => {
        if (data) setSummary(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));

    // Fetch payouts : Bearer token attached automatically
    portalFetch(`${base}/api/portal/${encodeURIComponent(accessCode)}/payouts`, accessCode)
      .then(async (res) => {
        if (res.status === 401) return [];
        if (!res.ok) return [];
        return res.json();
      })
      .then(setPayouts)
      .catch(() => setPayouts([]));
  };

  useEffect(() => {
    refreshData();
  }, [accessCode, period]);

  return (
    <div className="min-h-screen bg-sidebar">
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-5xl mx-auto p-6 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <svg width="32" height="32" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="14" fill="#111827" />
              <line x1="16" y1="40" x2="40" y2="16" stroke="#0D9488" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="20" cy="20" r="5" fill="#0D9488" />
              <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" strokeWidth="3" />
              <circle cx="36" cy="36" r="2.5" fill="#0D9488" />
            </svg>
            <span className="font-semibold text-[15px] text-foreground tracking-tight">
              Commission<span className="text-primary">Kit</span>
            </span>
          </div>

          {!loading && summary && !passwordRequired && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <div className="size-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold border border-primary/20">
                {summary.repName.charAt(0)}
              </div>
              <span className="hidden sm:inline font-medium text-foreground">{summary.repName}</span>
            </div>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-6">
        {loading && <PortalSkeleton />}

        {!loading && passwordRequired && !mustChangePassword && (
          <PortalLogin accessCode={accessCode} onLogin={(pwd, mustChange) => {
            setTempPassword(pwd);
            if (mustChange) {
              setPasswordRequired(false);
              setMustChangePassword(true);
            } else {
              refreshData();
            }
          }} />
        )}

        {!loading && mustChangePassword && (
          <ForcePasswordChange
            accessCode={accessCode}
            currentPassword={tempPassword}
            onComplete={(_newToken) => {
              setMustChangePassword(false);
              refreshData();
            }}
          />
        )}

        {!loading && !passwordRequired && error && (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
            <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <ShieldAlert className="size-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold text-foreground">Portal not found</h1>
            <p className="text-muted-foreground max-w-sm">
              {error}. Please check your link or contact your manager for a new one.
            </p>
          </div>
        )}

        {!loading && !passwordRequired && !error && summary && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between md:items-end gap-4">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold border border-primary/20">
                    {summary.repName.charAt(0)}
                  </div>
                  <div>
                    <h1 className="text-3xl font-semibold tracking-tight">{summary.repName}</h1>
                    <p className="text-muted-foreground text-sm">{summary.email}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {summary.planName && (
                  <Badge variant="outline" className="bg-secondary/50 text-secondary-foreground text-sm py-1">
                    Plan: {summary.planName}
                  </Badge>
                )}
                <div className="flex items-center border rounded-md px-3 bg-background">
                  <CalendarDays className="size-4 text-muted-foreground mr-2" />
                  <Input
                    type="month"
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="border-0 shadow-none focus-visible:ring-0 w-36 px-0 h-9"
                  />
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-primary text-primary-foreground border-primary-foreground/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-primary-foreground/80 flex items-center">
                    <DollarSign className="size-4 mr-1" /> Estimated Commission
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{formatCurrency(summary.totalCommission, summary.currency)}</div>
                  <p className="text-xs text-primary-foreground/70 mt-1">
                    For {format(new Date(period + "-01"), "MMMM yyyy")}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Activity className="size-4 mr-1" /> Total Revenue Closed
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{formatCurrency(summary.totalRevenue, summary.currency)}</div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                    <Briefcase className="size-4 mr-1" /> Deals Won
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-semibold">{summary.totalDeals}</div>
                </CardContent>
              </Card>
            </div>

            {summary.currencySummaries && summary.currencySummaries.length > 1 && (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {summary.currencySummaries.map((c) => (
                  <Card key={c.currency} className="border-l-4 border-l-primary/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {c.currency} Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-2">
                      <div>
                        <p className="text-[10px] text-muted-foreground">Commission</p>
                        <p className="text-sm font-semibold">{formatCurrency(c.totalCommission, c.currency)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-muted-foreground">Deals</p>
                        <p className="text-sm font-semibold">{c.totalDeals}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {summary.monthlyHistory && summary.monthlyHistory.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Earnings History</CardTitle>
                  <CardDescription>Past 6 months of commission payouts.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-[250px] w-full mt-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={summary.monthlyHistory}
                        margin={{ top: 0, right: 0, left: -20, bottom: 0 }}
                      >
                        <XAxis
                          dataKey="period"
                          tickFormatter={(val) => format(new Date(val + "-01"), "MMM")}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <YAxis
                          tickFormatter={(val) => `$${val / 1000}k`}
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                        />
                        <RechartsTooltip
                          formatter={(value: number) => [formatCurrency(value, summary.currency), "Commission"]}
                          labelFormatter={(label) =>
                            format(new Date(label + "-01"), "MMMM yyyy")
                          }
                          contentStyle={{
                            borderRadius: "8px",
                            border: "1px solid var(--border)",
                            backgroundColor: "hsl(var(--background))",
                          }}
                        />
                        <Bar
                          dataKey="totalCommission"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Deal Breakdown</CardTitle>
                <CardDescription>Individual deal commissions for this period.</CardDescription>
              </CardHeader>
              <CardContent>
                {summary.dealBreakdown.length === 0 ? (
                  <div className="text-center py-10 border border-dashed rounded-lg">
                    <p className="text-muted-foreground">No deals found for this period.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Deal</TableHead>
                        <TableHead>Close Date</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                        <TableHead className="text-right">Rate</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary.dealBreakdown.map((deal: any) => {
                        const dealCurrency = deal.currency || summary.currency;
                        return (
                          <TableRow key={deal.dealId}>
                            <TableCell>
                              <div className="font-medium">{deal.dealName}</div>
                              <div className="text-xs text-muted-foreground mt-0.5">
                                {deal.calculationNote}
                              </div>
                              {dealCurrency !== summary.currency && (
                                <Badge variant="outline" className="mt-0.5 text-[10px] p-1.5 h-4">
                                  {dealCurrency}
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {deal.closeDate ? format(new Date(deal.closeDate), "MMM d") : ":"}
                            </TableCell>
                            <TableCell className="text-right">
                              <CurrencyCell
                                amount={deal.dealAmount}
                                currency={dealCurrency}
                                wsCurrency={deal.wsCurrency ?? summary.currency}
                                convertedAmount={deal.convertedDealAmount}
                                exchangeRateSnapshot={deal.exchangeRateSnapshot}
                                rateSnapshotDate={deal.rateSnapshotDate}
                              />
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {formatPercent(deal.rateApplied)}
                            </TableCell>
                            <TableCell className="text-right font-semibold text-primary">
                              <CurrencyCell
                                amount={deal.commissionAmount}
                                currency={dealCurrency}
                                wsCurrency={deal.wsCurrency ?? summary.currency}
                                convertedAmount={deal.convertedCommission}
                                exchangeRateSnapshot={deal.exchangeRateSnapshot}
                                rateSnapshotDate={deal.rateSnapshotDate}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {payouts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <Wallet className="size-4 text-primary" />
                    <CardTitle className="text-base">Payout History</CardTitle>
                  </div>
                  <CardDescription className="text-xs">Your commission payouts managed by your organization.</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Period</TableHead>
                        <TableHead className="text-right">Commission</TableHead>
                        <TableHead className="text-right">Adjustments</TableHead>
                        <TableHead className="text-right">Final</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment Date</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payouts.map((p: any) => {
                        const STATUS_MAP: Record<string, { label: string; class: string }> = {
                          pending:  { label: "Pending",  class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50" },
                          approved: { label: "Approved", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50" },
                          paid:     { label: "Paid",     class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50" },
                          disputed: { label: "Disputed", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50" },
                          on_hold:  { label: "On Hold",  class: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200/50" },
                        };
                        const cfg = STATUS_MAP[p.status] ?? STATUS_MAP.pending;
                        const canDispute = ["pending", "approved"].includes(p.status);

                        return (
                          <TableRow key={p.id}>
                            <TableCell className="text-sm text-muted-foreground">
                              {format(new Date(p.periodStart), "MMM d")}–{format(new Date(p.periodEnd), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell className="text-right text-sm tabular-nums">
                              {formatCurrency(p.commissionAmount, p.currency)}
                            </TableCell>
                            <TableCell className={`text-right text-sm tabular-nums ${p.adjustments < 0 ? "text-red-600" : p.adjustments > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                              {p.adjustments !== 0 ? (p.adjustments > 0 ? "+" : "") + formatCurrency(p.adjustments, p.currency) : ":"}
                            </TableCell>
                            <TableCell className="text-right text-sm font-semibold tabular-nums">
                              {formatCurrency(p.finalAmount, p.currency)}
                            </TableCell>
                            <TableCell>
                              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${cfg.class}`}>
                                {cfg.label}
                              </span>
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {p.actualPaymentDate ? format(new Date(p.actualPaymentDate), "MMM d, yyyy") : ":"}
                            </TableCell>
                            <TableCell className="text-right">
                              {canDispute ? (
                                <Button size="sm" variant="ghost" className="h-8 text-xs text-muted-foreground hover:text-foreground" onClick={() => setDisputeTarget(p)}>
                                  <MessageSquare className="size-3 mr-1" />
                                  Dispute
                                </Button>
                              ) : null}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            <p className="text-center text-xs text-muted-foreground pb-4">
              This is a read-only view of your commission data, provided by{" "}
              <span className="font-medium text-foreground">CommissionKit</span>.
            </p>
          </div>
        )}
      </main>

      <Dialog open={!!disputeTarget} onOpenChange={() => setDisputeTarget(null)}>
        {disputeTarget && (
          <DisputeModal 
            payout={disputeTarget} 
            accessCode={accessCode} 
            onClose={() => setDisputeTarget(null)} 
            onSuccess={refreshData}
          />
        )}
      </Dialog>
    </div>
  );
}

// ─── Skeleton ───────────────────────────────────────────────────────────────

function PortalSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex gap-4 items-center">
          <Skeleton className="size-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="size-8" />
            <Skeleton className="size-4" />
          </div>
        </div>
        <Skeleton className="size-10" />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-28 w-full" />
      </div>
      <Skeleton className="h-[300px] w-full" />
      <Skeleton className="h-[400px] w-full" />
    </div>
  );
}
