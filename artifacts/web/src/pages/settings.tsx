import { useState, useEffect } from "react";
import { useTheme } from "@/hooks/use-theme";
import { useRole } from "@/hooks/use-role";
import { useWorkspace } from "@/hooks/use-workspace";
import { useAuth } from "@/hooks/use-auth";
import {
  Sun, Moon, Bell, Shield, Users, Building2, Crown, ArrowRight, Save, Loader2, Check, ChevronsUpDown,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { CurrencyCombobox } from "@/components/currency-combobox";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import SettingsRoles from "./settings-roles";

const API = import.meta.env.VITE_API_URL || "http://localhost:8088";

const ROLE_META = {
  owner: { label: "Owner", description: "Full access including billing and workspace deletion.", Icon: Crown, color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30" },
  admin: { label: "Admin", description: "Manage members, plans, deals and calculation runs.", Icon: Shield, color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30" },
  member: { label: "Member", description: "Read-only access to dashboards and reports.", Icon: Users, color: "text-muted-foreground bg-muted border-border" },
};

import { CURRENCIES } from "@/lib/currencies";
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

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    setWsState(prev => ({ ...prev, loading: true }));
    fetch(`${API}/api/workspaces/${activeWorkspace.id}/settings`, {
      credentials: "include",
      headers: { "x-workspace-id": activeWorkspace.id },
    })
      .then((r) => r.json())
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
      await fetch(`${API}/api/workspaces/${activeWorkspace.id}/settings`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-workspace-id": activeWorkspace.id },
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
    fetch(`${API}/api/users/me/notification-prefs`, { credentials: "include" })
      .then((r) => r.json())
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
      await fetch(`${API}/api/users/me/notification-prefs`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
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

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="mb-6 bg-muted/50 w-full sm:w-auto overflow-x-auto justify-start flex">
          <TabsTrigger value="general" className="min-w-fit px-4">General</TabsTrigger>
          {hasPermission("roles", "read") && (
            <TabsTrigger value="roles" className="min-w-fit px-4">Roles & Permissions</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="general" className="space-y-7 outline-none">
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
      </TabsContent>

      {isAdmin && (
        <TabsContent value="roles" className="outline-none mt-0">
          <SettingsRoles />
        </TabsContent>
      )}
      </Tabs>
    </div>
  );
}
