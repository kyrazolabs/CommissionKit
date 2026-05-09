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
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || "http://localhost:8088";

const ROLE_META = {
  owner: { label: "Owner", description: "Full access including billing and workspace deletion.", Icon: Crown, color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30" },
  admin: { label: "Admin", description: "Manage members, plans, deals and calculation runs.", Icon: Shield, color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30" },
  member: { label: "Member", description: "Read-only access to dashboards and reports.", Icon: Users, color: "text-muted-foreground bg-muted border-border" },
};

const CURRENCIES: { code: string; name: string }[] = [
  { code: "USD", name: "US Dollar" },
  { code: "EUR", name: "Euro" },
  { code: "GBP", name: "British Pound" },
  { code: "JPY", name: "Japanese Yen" },
  { code: "CAD", name: "Canadian Dollar" },
  { code: "AUD", name: "Australian Dollar" },
  { code: "CHF", name: "Swiss Franc" },
  { code: "CNY", name: "Chinese Yuan" },
  { code: "HKD", name: "Hong Kong Dollar" },
  { code: "NZD", name: "New Zealand Dollar" },
  { code: "SEK", name: "Swedish Krona" },
  { code: "NOK", name: "Norwegian Krone" },
  { code: "DKK", name: "Danish Krone" },
  { code: "SGD", name: "Singapore Dollar" },
  { code: "INR", name: "Indian Rupee" },
  { code: "BRL", name: "Brazilian Real" },
  { code: "MXN", name: "Mexican Peso" },
  { code: "ZAR", name: "South African Rand" },
  { code: "RUB", name: "Russian Ruble" },
  { code: "TRY", name: "Turkish Lira" },
  { code: "KRW", name: "South Korean Won" },
  { code: "THB", name: "Thai Baht" },
  { code: "IDR", name: "Indonesian Rupiah" },
  { code: "MYR", name: "Malaysian Ringgit" },
  { code: "PHP", name: "Philippine Peso" },
  { code: "TWD", name: "Taiwan Dollar" },
  { code: "PLN", name: "Polish Złoty" },
  { code: "CZK", name: "Czech Koruna" },
  { code: "HUF", name: "Hungarian Forint" },
  { code: "RON", name: "Romanian Leu" },
  { code: "BGN", name: "Bulgarian Lev" },
  { code: "HRK", name: "Croatian Kuna" },
  { code: "ISK", name: "Icelandic Króna" },
  { code: "ILS", name: "Israeli Shekel" },
  { code: "SAR", name: "Saudi Riyal" },
  { code: "AED", name: "UAE Dirham" },
  { code: "QAR", name: "Qatari Riyal" },
  { code: "KWD", name: "Kuwaiti Dinar" },
  { code: "BHD", name: "Bahraini Dinar" },
  { code: "OMR", name: "Omani Rial" },
  { code: "JOD", name: "Jordanian Dinar" },
  { code: "EGP", name: "Egyptian Pound" },
  { code: "NGN", name: "Nigerian Naira" },
  { code: "KES", name: "Kenyan Shilling" },
  { code: "GHS", name: "Ghanaian Cedi" },
  { code: "TZS", name: "Tanzanian Shilling" },
  { code: "UGX", name: "Ugandan Shilling" },
  { code: "ETB", name: "Ethiopian Birr" },
  { code: "MAD", name: "Moroccan Dirham" },
  { code: "DZD", name: "Algerian Dinar" },
  { code: "TND", name: "Tunisian Dinar" },
  { code: "PKR", name: "Pakistani Rupee" },
  { code: "BDT", name: "Bangladeshi Taka" },
  { code: "LKR", name: "Sri Lankan Rupee" },
  { code: "NPR", name: "Nepalese Rupee" },
  { code: "MMK", name: "Myanmar Kyat" },
  { code: "VND", name: "Vietnamese Dong" },
  { code: "KHR", name: "Cambodian Riel" },
  { code: "LAK", name: "Lao Kip" },
  { code: "MNT", name: "Mongolian Tögrög" },
  { code: "KZT", name: "Kazakhstani Tenge" },
  { code: "UZS", name: "Uzbekistani Som" },
  { code: "AZN", name: "Azerbaijani Manat" },
  { code: "GEL", name: "Georgian Lari" },
  { code: "AMD", name: "Armenian Dram" },
  { code: "UAH", name: "Ukrainian Hryvnia" },
  { code: "BYN", name: "Belarusian Ruble" },
  { code: "MDL", name: "Moldovan Leu" },
  { code: "ALL", name: "Albanian Lek" },
  { code: "MKD", name: "Macedonian Denar" },
  { code: "RSD", name: "Serbian Dinar" },
  { code: "BAM", name: "Bosnia-Herzegovina Convertible Mark" },
  { code: "HNL", name: "Honduran Lempira" },
  { code: "GTQ", name: "Guatemalan Quetzal" },
  { code: "CRC", name: "Costa Rican Colón" },
  { code: "PAB", name: "Panamanian Balboa" },
  { code: "DOP", name: "Dominican Peso" },
  { code: "JMD", name: "Jamaican Dollar" },
  { code: "TTD", name: "Trinidad and Tobago Dollar" },
  { code: "BBD", name: "Barbadian Dollar" },
  { code: "CLP", name: "Chilean Peso" },
  { code: "COP", name: "Colombian Peso" },
  { code: "PEN", name: "Peruvian Sol" },
  { code: "ARS", name: "Argentine Peso" },
  { code: "BOB", name: "Bolivian Boliviano" },
  { code: "PYG", name: "Paraguayan Guaraní" },
  { code: "UYU", name: "Uruguayan Peso" },
  { code: "VES", name: "Venezuelan Bolívar" },
  { code: "GYD", name: "Guyanese Dollar" },
  { code: "SRD", name: "Surinamese Dollar" },
  { code: "FJD", name: "Fijian Dollar" },
  { code: "PGK", name: "Papua New Guinean Kina" },
  { code: "WST", name: "Samoan Tālā" },
  { code: "TOP", name: "Tongan Paʻanga" },
  { code: "XCD", name: "East Caribbean Dollar" },
  { code: "XOF", name: "West African CFA Franc" },
  { code: "XAF", name: "Central African CFA Franc" },
  { code: "XPF", name: "CFP Franc" },
];
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

function CurrencyCombobox({
  value, onChange, disabled,
}: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const selected = CURRENCIES.find((c) => c.code === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-sm shadow-sm transition-colors",
            "hover:bg-accent focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
            disabled && "cursor-not-allowed opacity-50",
          )}
        >
          <span className="truncate">
            {selected ? <><span className="font-mono font-medium">{selected.code}</span> — {selected.name}</> : "Select currency…"}
          </span>
          <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Search currency…" />
          <CommandList className="max-h-60">
            <CommandEmpty>No currency found.</CommandEmpty>
            <CommandGroup>
              {CURRENCIES.map((c) => (
                <CommandItem
                  key={c.code}
                  value={`${c.code} ${c.name}`}
                  onSelect={() => { onChange(c.code); setOpen(false); }}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <span className="font-mono font-semibold w-10 shrink-0">{c.code}</span>
                  <span className="text-muted-foreground text-sm truncate">{c.name}</span>
                  {value === c.code && <Check className="ml-auto h-3.5 w-3.5 text-primary shrink-0" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { role } = useRole();
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const roleMeta = ROLE_META[role];
  const isAdmin = role === "admin" || role === "owner";

  // ─── Workspace settings state ───────────────────────────────────────────────
  const [currency, setCurrency] = useState("USD");
  const [fiscalYear, setFiscalYear] = useState("January");
  const [wsLoading, setWsLoading] = useState(false);
  const [wsSaving, setWsSaving] = useState(false);
  const [wsSaved, setWsSaved] = useState(false);

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    setWsLoading(true);
    fetch(`${API}/api/workspaces/${activeWorkspace.id}/settings`, {
      credentials: "include",
      headers: { "x-workspace-id": activeWorkspace.id },
    })
      .then((r) => r.json())
      .then((d) => { setCurrency(d.currency ?? "USD"); setFiscalYear(d.fiscalYearStart ?? "January"); })
      .catch(console.error)
      .finally(() => setWsLoading(false));
  }, [activeWorkspace?.id]);

  const saveWorkspaceSettings = async () => {
    if (!activeWorkspace?.id) return;
    setWsSaving(true);
    try {
      await fetch(`${API}/api/workspaces/${activeWorkspace.id}/settings`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json", "x-workspace-id": activeWorkspace.id },
        body: JSON.stringify({ currency, fiscalYearStart: fiscalYear }),
      });
      setWsSaved(true);
      toast({ title: "Workspace settings saved" });
      setTimeout(() => setWsSaved(false), 2000);
    } catch {
      toast({ title: "Failed to save settings", variant: "destructive" });
    } finally {
      setWsSaving(false);
    }
  };

  // ─── Notification prefs state ───────────────────────────────────────────────
  const [prefs, setPrefs] = useState<NotifPrefs>(() =>
    Object.fromEntries(NOTIFICATION_TYPES.map((t) => [t.key, { email: true, inApp: true }])),
  );
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsSaved, setPrefsSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/users/me/notification-prefs`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => d.prefs && setPrefs(d.prefs))
      .catch(console.error);
  }, []);

  const saveNotifPrefs = async () => {
    setPrefsSaving(true);
    try {
      await fetch(`${API}/api/users/me/notification-prefs`, {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prefs }),
      });
      setPrefsSaved(true);
      toast({ title: "Notification preferences saved" });
      setTimeout(() => setPrefsSaved(false), 2000);
    } catch {
      toast({ title: "Failed to save preferences", variant: "destructive" });
    } finally {
      setPrefsSaving(false);
    }
  };

  const setTypePref = (key: string, field: "email" | "inApp", value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [field]: value } }));
  };

  return (
    <div className="space-y-7 max-w-2xl">
      <div>
        <p className="text-[12px] font-semibold text-primary mb-1">Configuration</p>
        <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">Settings</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Manage your workspace and personal preferences.</p>
      </div>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Users className="h-4 w-4 text-primary" /> Account</CardTitle>
          <CardDescription>Your identity in this workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-muted-foreground mt-0.5">{user?.email ?? "—"}</p>
            </div>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-border">
            <div>
              <p className="text-sm font-medium">Your role</p>
              <p className="text-sm text-muted-foreground mt-0.5">Access level in <span className="font-medium text-foreground">{activeWorkspace?.name}</span></p>
            </div>
            <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold", roleMeta.color)}>
              <roleMeta.Icon className="h-3.5 w-3.5" />{roleMeta.label}
            </span>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-border">
            <div>
              <p className="text-sm font-medium">Team members</p>
              <p className="text-sm text-muted-foreground mt-0.5">Invite members, manage roles and access.</p>
            </div>
            <Button variant="outline" size="sm" asChild className="gap-1.5">
              <Link href="/team">Manage <ArrowRight className="h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Sun className="h-4 w-4 text-primary" /> Appearance</CardTitle>
          <CardDescription>Control how CommissionKit looks for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <p className="text-sm text-muted-foreground mt-0.5">Currently using <span className="font-medium text-foreground">{theme === "dark" ? "dark" : "light"}</span> mode.</p>
            </div>
            <Button variant="outline" size="sm" onClick={toggle} className="gap-2">
              {theme === "dark" ? <><Sun className="h-4 w-4" /> Light mode</> : <><Moon className="h-4 w-4" /> Dark mode</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workspace settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Building2 className="h-4 w-4 text-primary" /> Workspace</CardTitle>
          <CardDescription>Organisation-level settings.{!isAdmin && " Admin or above required to edit."}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Currency</Label>
              <CurrencyCombobox value={currency} onChange={setCurrency} disabled={!isAdmin || wsLoading} />
              <p className="text-xs text-muted-foreground">Used for all amount formatting.</p>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Fiscal year start</Label>
              <Select value={fiscalYear} onValueChange={setFiscalYear} disabled={!isAdmin || wsLoading}>
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
              <Button size="sm" onClick={saveWorkspaceSettings} disabled={wsSaving || wsLoading} className="gap-2">
                {wsSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : wsSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
                {wsSaved ? "Saved!" : "Save workspace settings"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Bell className="h-4 w-4 text-primary" /> Notifications</CardTitle>
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
            <Button size="sm" onClick={saveNotifPrefs} disabled={prefsSaving} className="gap-2">
              {prefsSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : prefsSaved ? <Check className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
              {prefsSaved ? "Saved!" : "Save preferences"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base"><Shield className="h-4 w-4 text-primary" /> Security</CardTitle>
          <CardDescription>Account access and data controls.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Session timeout</p>
              <p className="text-sm text-muted-foreground">Automatically sign out after inactivity.</p>
            </div>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">8 hours</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
