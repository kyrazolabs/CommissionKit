import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { format } from "date-fns";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DollarSign, FolderKanban, FileText, ShieldAlert, Wallet, Lock, MessageSquare, Loader2, LogOut, User } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip } from "recharts";
import { MonthPicker } from "@/components/ui/month-picker";
import { cn } from "@/lib/utils";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

const PAYOUT_STATUS: Record<string, { label: string; class: string }> = {
  pending:  { label: "Pending",  class: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200/50" },
  approved: { label: "Approved", class: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200/50" },
  paid:     { label: "Paid",     class: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200/50" },
  disputed: { label: "Disputed", class: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200/50" },
  on_hold:  { label: "On Hold",  class: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400 border-gray-200/50" },
};

export function EnterprisePublicRepPortal() {
  const params = useParams();
  const accessCode = params.accessCode || "";
  const { toast } = useToast();
  const [token, setToken] = useState<string | null>(localStorage.getItem(`ck_portal_${accessCode}`));
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const [repData, setRepData] = useState<any>(null);
  const [workspaceName, setWorkspaceName] = useState("");
  const [period, setPeriod] = useState(format(new Date(), "yyyy-MM"));
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [disputeForm, setDisputeForm] = useState({ payoutId: "", reason: "" });
  const [disputing, setDisputing] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);

  const fetchWithToken = async (url: string, opts: RequestInit = {}) => {
    const res = await fetch(`${API_URL}${url}`, { ...opts, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers } });
    if (res.status === 401) { localStorage.removeItem(`ck_portal_${accessCode}`); setToken(null); throw new Error("Session expired"); }
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  };

  useEffect(() => {
    if (!token) { setLoading(false); return; }
    (async () => {
      try {
        const d = await fetchWithToken(`/api/portal/me`);
        setRepData(d);
        const s = await fetchWithToken(`/api/enterprise/reps/${d.repId}/summary?period=${period}`);
        setSummary(s);
        if (s.workspaceName) setWorkspaceName(s.workspaceName);
        const p = await fetchWithToken(`/api/payouts?repId=${d.repId}`);
        setPayouts(p || []);
      } catch {}
      setLoading(false);
    })();
  }, [token, period]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthenticating(true);
    setAuthError("");
    try {
      const res = await fetch(`${API_URL}/api/portal/${encodeURIComponent(accessCode)}/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: accessCode, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Invalid credentials");
      localStorage.setItem(`ck_portal_${accessCode}`, data.token);
      if (data.workspaceName) setWorkspaceName(data.workspaceName);
      setToken(data.token);
    } catch (err: any) { setAuthError(err.message); }
    finally { setAuthenticating(false); }
  };

  const handleLogout = () => {
    localStorage.removeItem(`ck_portal_${accessCode}`);
    setToken(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    if (profileForm.newPassword !== profileForm.confirmPassword) { setProfileError("Passwords do not match"); return; }
    if (profileForm.newPassword.length < 6) { setProfileError("Password must be at least 6 characters"); return; }
    setProfileSaving(true);
    try {
      await fetchWithToken(`/api/portal/${accessCode}/change-password`, {
        method: "POST", body: JSON.stringify({ currentPassword: profileForm.currentPassword, newPassword: profileForm.newPassword }),
      });
      toast({ title: "Password changed successfully" });
      setShowProfile(false);
      setProfileForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err: any) { setProfileError(err.message); }
    finally { setProfileSaving(false); }
  };

  const handleDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    setDisputing(true);
    try {
      await fetchWithToken(`/api/disputes`, { method: "POST", body: JSON.stringify(disputeForm) });
      toast({ title: "Dispute filed" });
      setDisputeForm({ payoutId: "", reason: "" });
    } catch (err: any) { toast({ title: "Failed", description: err.message, variant: "destructive" }); }
    finally { setDisputing(false); }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-sidebar px-4">
        <Card className="w-full max-w-sm border border-card-border rounded-2xl shadow-sm">
          <CardHeader className="pb-2 text-center">
            <div className="flex justify-center mb-4"><Lock className="size-10 text-primary" /></div>
            <CardTitle>Rep Portal</CardTitle>
            <CardDescription>Enter your portal password to view your commissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2"><Label>Password</Label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm" required autoFocus /></div>
              {authError && <p className="text-[12px] text-destructive">{authError}</p>}
              <Button type="submit" className="w-full" disabled={authenticating}>{authenticating ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Sign In</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <div className="max-w-4xl w-full p-6 space-y-6">
        <div className="flex justify-between"><div className="flex items-center gap-4"><div className="size-12 rounded-full bg-muted" /><div className="space-y-2"><div className="h-5 w-32 bg-muted rounded" /><div className="h-4 w-48 bg-muted rounded" /></div></div></div>
        <div className="grid gap-4 md:grid-cols-4">{[1,2,3,4].map(i=><div key={i} className="h-28 bg-muted rounded-2xl" />)}</div>
        <div className="h-64 bg-muted rounded-2xl" />
      </div>
    </div>
  );
  if (!summary) return <div className="min-h-screen flex items-center justify-center bg-sidebar"><p className="text-muted-foreground">No data available.</p></div>;

  const currency = repData?.currency || "SAR";

  return (
    <div className="min-h-screen bg-sidebar">
      {token && !loading && summary && (
        <div className="max-w-4xl mx-auto px-6 pt-6 flex items-center justify-between">
          <p className="text-xs text-muted-foreground">
            <span>{workspaceName || repData?.workspaceName || "Workspace"}</span>
            <span className="mx-1">·</span>
            <a href="https://commissionk.it" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">CommissionKit</a>
          </p>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" onClick={() => setShowProfile(true)} className="h-7 text-xs gap-1 text-muted-foreground"><User className="size-3" /> Password</Button>
            <span className="text-muted-foreground/30">|</span>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="h-7 text-xs gap-1 text-muted-foreground"><LogOut className="size-3" /> Sign Out</Button>
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-6">
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-1">
              <div className="size-12 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xl font-semibold border border-primary/20">{repData?.name?.charAt(0) || "?"}</div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{repData?.name}</h1>
                <p className="text-muted-foreground">{repData?.email}</p>
              </div>
            </div>
            <MonthPicker value={period} onChange={setPeriod} placeholder="Pick a month" className="w-40 h-9" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: "Commission", value: formatCurrency(summary.totalCommission, currency), icon: DollarSign, className: "bg-primary text-primary-foreground border-primary-foreground/10" },
            { label: "Projects", value: summary.totalProjects, icon: FolderKanban },
            { label: "Invoices", value: summary.totalInvoices, icon: FileText },
            { label: "Value", value: formatCurrency(summary.totalValue, currency), icon: DollarSign },
          ].map((stat, i) => (
            <Card key={i} className={stat.className}>
              <CardHeader className="pb-2"><CardTitle className={cn("text-sm font-medium flex items-center gap-1", stat.className ? "text-primary-foreground/80" : "text-muted-foreground")}><stat.icon className="size-4" />{stat.label}</CardTitle></CardHeader>
              <CardContent><div className="text-2xl font-semibold">{stat.value}</div></CardContent>
            </Card>
          ))}
        </div>

        {summary.monthlyHistory?.length > 0 && (
          <Card>
            <CardHeader><CardTitle>Earnings History</CardTitle></CardHeader>
            <CardContent>
              <div className="h-[220px] w-full">
                <ResponsiveContainer>
                  <BarChart data={summary.monthlyHistory} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                    <XAxis dataKey="period" tickFormatter={v => format(new Date(v+"-01"),"MMM")} fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis tickFormatter={v => `$${(v/1000).toFixed(0)}k`} fontSize={12} tickLine={false} axisLine={false} />
                    <RechartsTooltip formatter={(v: number) => [formatCurrency(v, currency), "Commission"]} />
                    <Bar dataKey="totalCommission" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent>
            {!summary.projectBreakdown?.length ? (
              <div className="text-center py-10"><p className="text-muted-foreground">No projects for this period.</p></div>
            ) : (
              <Table>
                <TableHeader><TableRow>{["Project","Value","GM%","Invoices","Commission"].map(h=><TableHead key={h} className={h==="Commission"?"text-right":""}>{h}</TableHead>)}</TableRow></TableHeader>
                <TableBody>{summary.projectBreakdown.map((p: any, i: number) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="font-medium">{formatCurrency(p.value, p.currency)}</TableCell>
                    <TableCell className="text-emerald-600 font-medium">{p.gm}%</TableCell>
                    <TableCell>{p.invoiceCount}</TableCell>
                    <TableCell className="text-right font-semibold text-primary">{p.commission > 0 ? formatCurrency(p.commission, p.currency) : "—"}</TableCell>
                  </TableRow>
                ))}</TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><div className="flex items-center gap-2"><Wallet className="size-4 text-primary" /><CardTitle className="text-base">Payouts</CardTitle></div></CardHeader>
          <CardContent className="p-0">
            {payouts.length === 0 ? <div className="text-center py-10"><p className="text-sm text-muted-foreground">No payouts yet.</p></div>
            : <Table><TableHeader><TableRow>{["Period","Commission","Final","Status"].map(h=><TableHead key={h}>{h}</TableHead>)}</TableRow></TableHeader>
              <TableBody>{payouts.map((p: any) => {const cfg=PAYOUT_STATUS[p.status]??PAYOUT_STATUS.pending;return <TableRow key={p.id}>
                <TableCell className="text-sm text-muted-foreground">{format(new Date(p.periodStart),"MMM d")}–{format(new Date(p.periodEnd),"MMM d, yyyy")}</TableCell>
                <TableCell className="text-sm">{formatCurrency(p.commissionAmount,p.currency)}</TableCell>
                <TableCell className="text-sm font-semibold">{formatCurrency(p.finalAmount,p.currency)}</TableCell>
                <TableCell><span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",cfg.class)}>{cfg.label}</span></TableCell>
              </TableRow>})}</TableBody></Table>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><div className="flex items-center gap-2"><ShieldAlert className="size-4 text-primary" /><CardTitle className="text-base">File a Dispute</CardTitle></div></CardHeader>
          <CardContent>
            <form onSubmit={handleDispute} className="space-y-4">
              <div className="space-y-2"><Label>Reason</Label><Textarea value={disputeForm.reason} onChange={e => setDisputeForm(p => ({...p, reason: e.target.value}))} rows={3} required /></div>
              <Button type="submit" disabled={disputing}>{disputing ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MessageSquare className="mr-2 size-4" />}Submit Dispute</Button>
            </form>
          </CardContent>
        </Card>

        <Dialog open={showProfile} onOpenChange={setShowProfile}>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader><DialogTitle>Change Password</DialogTitle><DialogDescription>Update your portal password.</DialogDescription></DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4 py-4">
              <div className="space-y-2"><Label>Current Password</Label><Input type="password" value={profileForm.currentPassword} onChange={e => setProfileForm(p => ({...p, currentPassword: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>New Password</Label><Input type="password" value={profileForm.newPassword} onChange={e => setProfileForm(p => ({...p, newPassword: e.target.value}))} required /></div>
              <div className="space-y-2"><Label>Confirm Password</Label><Input type="password" value={profileForm.confirmPassword} onChange={e => setProfileForm(p => ({...p, confirmPassword: e.target.value}))} required /></div>
              {profileError && <p className="text-[12px] text-destructive">{profileError}</p>}
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowProfile(false)}>Cancel</Button>
                <Button type="submit" disabled={profileSaving}>{profileSaving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}Change Password</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
