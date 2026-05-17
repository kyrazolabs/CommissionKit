import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/hooks/use-theme";
import { useRole } from "@/hooks/use-role";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import {
  Sun, Moon, Bell, Shield, Users, Building2, Crown, ArrowRight, Save, Loader2, Check, ChevronsUpDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CurrencyCombobox } from "@/components/currency-combobox";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import SettingsRoles from "./settings-roles";
import { apiFetch } from "@/lib/api";

const ROLE_META = {
  owner: { label: "Owner", description: "Full access including billing and workspace deletion.", Icon: Crown, color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30" },
  admin: { label: "Admin", description: "Manage members, plans, deals and calculation runs.", Icon: Shield, color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30" },
  member: { label: "Member", description: "Read-only access to dashboards and reports.", Icon: Users, color: "text-muted-foreground bg-muted border-border" },
};

import { CURRENCIES } from "@/lib/currencies";
import { usePageMeta } from "@/hooks/use-page-meta";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const NOTIFICATION_TYPES: { key: string; label: string; description: string }[] = [
  { key: "commission_run_completed", label: "Commission run completed",   description: "When a calculation run finishes." },
  { key: "new_rep_added",            label: "New rep added",              description: "When a sales rep is created." },
  { key: "deal_imported",            label: "Deals imported",             description: "When a CSV batch import succeeds." },
  { key: "clawback_triggered",       label: "Clawback triggered",         description: "When a deal enters clawback." },
  { key: "member_invited",           label: "Member invited",             description: "When a team invite is sent." },
  { key: "member_role_changed",      label: "Member role changed",        description: "When a member's role is updated." },
  { key: "plan_created",             label: "Plan created",               description: "When a new commission plan is added." },
  { key: "plan_updated",             label: "Plan updated",               description: "When an existing plan is modified." },
];

type NotifPrefs = Record<string, { email: boolean; inApp: boolean }>;

/**
 * Standard Headless UI toggle pattern — no pixel math.
 * Track: h-6 w-11 with border-2 (inner area 40×20px)
 * Thumb: h-5 w-5 inline-block (20×20px)
 * OFF → translate-x-0  (flush left inside border)
 * ON  → translate-x-5  (20px right = 40-20 = flush right inside border)
 */
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full",
        "border-2 border-transparent",
        "transition-colors duration-200 ease-in-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
        on ? "bg-primary" : "bg-muted-foreground/30",
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0",
          "transition-transform duration-200 ease-in-out",
          on ? "translate-x-5" : "translate-x-0",
        )}
      />
    </button>
  );
}


export function SettingsPage() {
  usePageMeta({ title: "Settings", description: "Configure your workspace and personal preferences.", robots: "noindex, nofollow" });
  const { theme, toggle } = useTheme();
  const { role, hasPermission, isLoading: roleLoading } = useRole();
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const [wsState, setWsState] = useState({
    currency: "USD",
    fiscalYear: "January",
    loading: false,
    saving: false,
    saved: false
  });

  const [linkedAccounts, setLinkedAccounts] = useState<any[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  const [unlinkingProvider, setUnlinkingProvider] = useState<string | null>(null);

  const fetchLinkedAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const res = await authClient.listAccounts();
      // Better Auth returns { data: [...], error } — not a raw array
      const accounts = (res as any)?.data ?? res;
      if (Array.isArray(accounts)) {
        setLinkedAccounts(accounts);
      }
    } catch (err) {
      console.error("Failed to load linked accounts:", err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  useEffect(() => {
    fetchLinkedAccounts();
  }, []);

  const handleLinkGoogle = async () => {
    setLinkingProvider("google");
    try {
      await authClient.linkSocial({
        provider: "google",
        callbackURL: window.location.href,
      });
      toast({
        title: "Redirecting to Google...",
        description: "Please authenticate to link your account.",
      });
    } catch (err: any) {
      toast({
        title: "Linking failed",
        description: err.message || "Failed to link Google account.",
        variant: "destructive",
      });
      setLinkingProvider(null);
    }
  };

  const handleUnlinkGoogle = async () => {
    setUnlinkingProvider("google");
    try {
      await authClient.unlinkAccount({
        providerId: "google",
      });
      toast({
        title: "Google disconnected",
        description: "Your Google account has been unlinked successfully.",
      });
      await fetchLinkedAccounts();
    } catch (err: any) {
      toast({
        title: "Unlinking failed",
        description: err.message || "Failed to unlink Google account.",
        variant: "destructive",
      });
    } finally {
      setUnlinkingProvider(null);
    }
  };

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    setWsState(prev => ({ ...prev, loading: true }));
    apiFetch(`/api/workspaces/${activeWorkspace.id}/settings`)
      .then((d) => {
        setWsState(prev => ({
          ...prev,
          currency: d.currency ?? "USD",
          fiscalYear: d.fiscalYearStart ?? "January",
          loading: false
        }));
      })
      .catch((err) => {
        console.error(err);
        setWsState(prev => ({ ...prev, loading: false }));
      });
  }, [activeWorkspace?.id]);

  const saveWorkspaceSettings = async () => {
    if (!activeWorkspace?.id) return;
    setWsState(prev => ({ ...prev, saving: true }));
    try {
      await apiFetch(`/api/workspaces/${activeWorkspace.id}/settings`, {
        method: "PATCH",
        body: JSON.stringify({ currency: wsState.currency, fiscalYearStart: wsState.fiscalYear }),
      });
      setWsState(prev => ({ ...prev, saving: false, saved: true }));
      toast({ title: "Workspace settings saved" });
      setTimeout(() => setWsState(prev => ({ ...prev, saved: false })), 2000);
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
      setWsState(prev => ({ ...prev, saving: false }));
    }
  };

  const [prefs, setPrefs] = useState<NotifPrefs>(() =>
    Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t.key, { email: true, inApp: true }])),
  );
  const [prefsState, setPrefsState] = useState({ saving: false, saved: false });

  useEffect(() => {
    apiFetch(`/api/users/me/notification-prefs`)
      .then((d) => d.prefs && setPrefs(d.prefs))
      .catch(console.error);
  }, []);

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="size-10" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const roleMeta = ROLE_META[role];
  const isAdmin = hasPermission("workspace", "edit");

  const saveNotifPrefs = async () => {
    setPrefsState(prev => ({ ...prev, saving: true }));
    try {
      await apiFetch(`/api/users/me/notification-prefs`, {
        method: "PATCH",
        body: JSON.stringify({ prefs }),
      });
      setPrefsState(prev => ({ ...prev, saving: false, saved: true }));
      toast({ title: "Notification preferences saved" });
      setTimeout(() => setPrefsState(prev => ({ ...prev, saved: false })), 2000);
    } catch {
      toast({ title: "Failed to save preferences", variant: "destructive" });
      setPrefsState(prev => ({ ...prev, saving: false }));
    }
  };

  const setTypePref = (key: string, field: "email" | "inApp", value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [field]: value } }));
  };

  return (
    <div className="space-y-7 max-w-2xl">
      <div>
        <p className="text-[12px] font-semibold text-primary mb-1">Configuration</p>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Settings</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Manage your workspace and personal preferences.</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-6 bg-muted/50 w-full sm:w-auto overflow-x-auto justify-start flex">
          <TabsTrigger value="account" className="min-w-fit px-4">Account</TabsTrigger>
          <TabsTrigger value="appearance" className="min-w-fit px-4">Appearance</TabsTrigger>
          <TabsTrigger value="workspace" className="min-w-fit px-4">Workspace</TabsTrigger>
          <TabsTrigger value="notifications" className="min-w-fit px-4">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="min-w-fit px-4">Security</TabsTrigger>
          {hasPermission("roles", "read") && (
            <TabsTrigger value="roles" className="min-w-fit px-4">Roles & Permissions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="account" className="outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-7">
          {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Users className="size-4 text-primary" /> Account</CardTitle>
          <CardDescription>Your identity in this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email ?? ":"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-border">
            <div>
              <p className="text-sm font-medium">Your role</p>
              <p className="text-sm text-muted-foreground mt-0.5">Access level in <span className="font-medium text-foreground">{activeWorkspace?.name}</span></p>
            </div>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold", roleMeta.color)}>
              <roleMeta.Icon className="size-3.5" />{roleMeta.label}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-border">
            <div>
              <p className="text-sm font-medium">Team members</p>
              <p className="text-sm text-muted-foreground mt-0.5">Invite members, manage roles and access.</p>
            </div>
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href="/team">Manage <ArrowRight className="size-3.5" /></Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Linked Accounts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <svg className="size-4 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
            Connected Accounts
          </CardTitle>
          <CardDescription>Link your CommissionKit account with external authentication providers.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-foreground/80" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium">Google</p>
                {linkedAccounts.some(acc => acc.providerId === "google") ? (
                  <p className="text-xs text-emerald-500 flex items-center gap-1 font-medium mt-0.5">
                    <Check className="size-3" /> Connected
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground mt-0.5">Not connected</p>
                )}
              </div>
            </div>
            {loadingAccounts ? (
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            ) : linkedAccounts.some(acc => acc.providerId === "google") ? (
              <Button
                variant="outline"
                size="sm"
                onClick={handleUnlinkGoogle}
                disabled={unlinkingProvider === "google"}
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-border/50 transition-colors"
              >
                {unlinkingProvider === "google" && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                Disconnect
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={handleLinkGoogle}
                disabled={linkingProvider === "google"}
                className="hover:bg-muted transition-colors"
              >
                {linkingProvider === "google" && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                Link Google
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="appearance" className="outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-7">
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Sun className="size-4 text-primary" /> Appearance</CardTitle>
          <CardDescription>Control how CommissionKit looks for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <p className="text-sm text-muted-foreground mt-0.5">Currently using <span className="font-medium text-foreground">{theme === "dark" ? "dark" : "light"}</span> mode.</p>
            </div>
            <Button variant="outline" size="sm" onClick={toggle} className="gap-2">
              {theme === "dark" ? <><Sun className="size-4" /> Light mode</> : <><Moon className="size-4" /> Dark mode</>}
            </Button>
          </div>
        </CardContent>
      </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="workspace" className="outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-7">
      {/* Workspace settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Building2 className="size-4 text-primary" /> Workspace</CardTitle>
          <CardDescription>Organisation-level settings.{!isAdmin && " Admin or above required to edit."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Currency</Label>
              <CurrencyCombobox value={wsState.currency} onChange={(v) => setWsState(prev => ({ ...prev, currency: v }))} disabled={!isAdmin || wsState.loading} />
              <p className="text-xs text-muted-foreground">Used for all amount formatting.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fiscal year start</Label>
              <Select value={wsState.fiscalYear} onValueChange={(v) => setWsState(prev => ({ ...prev, fiscalYear: v }))} disabled={!isAdmin || wsState.loading}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MONTHS.map((m) => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Used for YTD calculations.</p>
            </div>
          </div>
          {isAdmin && (
            <div className="flex justify-end pt-1">
              <Button size="sm" onClick={saveWorkspaceSettings} disabled={wsState.saving || wsState.loading} className="gap-2">
                {wsState.saving ? <Loader2 className="size-3.5 animate-spin" /> : wsState.saved ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
                {wsState.saved ? "Saved!" : "Save workspace settings"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="notifications" className="outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-7">
      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Bell className="size-4 text-primary" /> Notifications</CardTitle>
          <CardDescription>Choose which events trigger alerts for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1">
          {/* Column headers */}
          <div className="flex items-center pb-2 border-b border-border">
            <div className="flex-1" />
            <div className="flex gap-6 pr-1">
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-10 text-center">Email</span>
              <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-10 text-center">In-app</span>
            </div>
          </div>

          {NOTIFICATION_TYPES.map((t, i) => (
            <div
              key={t.key}
              className={cn(
                "flex items-center py-3",
                i < NOTIFICATION_TYPES.length - 1 && "border-b border-border/50",
              )}
            >
              <div className="flex-1">
                <p className="text-sm font-medium">{t.label}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>
              </div>
              <div className="flex gap-6 pr-1">
                <div className="w-10 flex justify-center">
                  <Toggle on={prefs[t.key]?.email ?? true} onChange={(v) => setTypePref(t.key, "email", v)} />
                </div>
                <div className="w-10 flex justify-center">
                  <Toggle on={prefs[t.key]?.inApp ?? true} onChange={(v) => setTypePref(t.key, "inApp", v)} />
                </div>
              </div>
            </div>
          ))}

          <div className="flex justify-end pt-4">
            <Button size="sm" onClick={saveNotifPrefs} disabled={prefsState.saving} className="gap-2">
              {prefsState.saving ? <Loader2 className="size-3.5 animate-spin" /> : prefsState.saved ? <Check className="size-3.5" /> : <Save className="size-3.5" />}
              {prefsState.saved ? "Saved!" : "Save preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security" className="outline-none">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-7">
      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Shield className="size-4 text-primary" /> Security</CardTitle>
          <CardDescription>Account access and data controls.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Session timeout</p>
              <p className="text-sm text-muted-foreground">Automatically sign out after inactivity.</p>
            </div>
            <span className="text-sm text-muted-foreground bg-muted p-3 rounded-md">8 hours</span>
          </div>
        </CardContent>
      </Card>
          </motion.div>
        </TabsContent>

      {isAdmin && (
        <TabsContent value="roles" className="outline-none mt-0">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="space-y-7">
            <SettingsRoles />
          </motion.div>
        </TabsContent>
      )}
      </Tabs>
    </div>
  );
}
