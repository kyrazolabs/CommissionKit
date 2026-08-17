import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bell,
  Building2,
  Check,
  ChevronsUpDown,
  Crown,
  Loader2,
  Moon,
  Save,
  Shield,
  Sun,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { useRole } from "@/hooks/use-role";
import { useTheme } from "@/hooks/use-theme";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { SUPPORTED_LANGS } from "@/i18n";
import { apiFetch } from "@/lib/api";
import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import SettingsApiKeys from "./settings-api-keys";
import SettingsRoles from "./settings-roles";

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: Users,
} as const;

const ROLE_STYLES = {
  owner:
    "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30",
  admin:
    "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30",
  member: "text-muted-foreground bg-muted border-border",
} as const;

import { usePageMeta } from "@/hooks/use-page-meta";
import { CURRENCIES } from "@/lib/currencies";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const NOTIFICATION_KEYS = [
  {
    key: "commission_run_completed",
    i18nKey: "settings.notifications.types.commissionRunCompleted",
    i18nDescKey: "settings.notifications.types.commissionRunCompletedDesc",
  },
  {
    key: "new_rep_added",
    i18nKey: "settings.notifications.types.newRepAdded",
    i18nDescKey: "settings.notifications.types.newRepAddedDesc",
  },
  {
    key: "deal_imported",
    i18nKey: "settings.notifications.types.dealImported",
    i18nDescKey: "settings.notifications.types.dealImportedDesc",
  },
  {
    key: "clawback_triggered",
    i18nKey: "settings.notifications.types.clawbackTriggered",
    i18nDescKey: "settings.notifications.types.clawbackTriggeredDesc",
  },
  {
    key: "member_invited",
    i18nKey: "settings.notifications.types.memberInvited",
    i18nDescKey: "settings.notifications.types.memberInvitedDesc",
  },
  {
    key: "member_role_changed",
    i18nKey: "settings.notifications.types.memberRoleChanged",
    i18nDescKey: "settings.notifications.types.memberRoleChangedDesc",
  },
  {
    key: "plan_created",
    i18nKey: "settings.notifications.types.planCreated",
    i18nDescKey: "settings.notifications.types.planCreatedDesc",
  },
  {
    key: "plan_updated",
    i18nKey: "settings.notifications.types.planUpdated",
    i18nDescKey: "settings.notifications.types.planUpdatedDesc",
  },
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
  const { t, i18n } = useTranslation();
  usePageMeta({
    title: t("settings.title"),
    description: t("settings.description"),
    robots: "noindex, nofollow",
  });
  const { theme, toggle } = useTheme();
  const { role, hasPermission, isLoading: roleLoading } = useRole();
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { toast } = useToast();
  const [wsState, setWsState] = useState({
    currency: "USD",
    fiscalYear: "January",
    commissionEngine: "standard",
    loading: false,
    saving: false,
    saved: false,
  });

  const [profileState, setProfileState] = useState({
    name: "",
    image: "",
    saving: false,
    saved: false,
  });

  useEffect(() => {
    if (user) {
      setProfileState((prev) => ({
        ...prev,
        name: user.name || "",
        image: user.image || "",
      }));
    }
  }, [user]);

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      // Increased to 5MB since we compress it anyway
      toast({
        title: t("settings.account.imageTooLarge"),
        description: t("settings.account.imageMaxSize"),
        variant: "destructive",
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_SIZE = 250;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_SIZE) {
            height = Math.round((height * MAX_SIZE) / width);
            width = MAX_SIZE;
          }
        } else {
          if (height > MAX_SIZE) {
            width = Math.round((width * MAX_SIZE) / height);
            height = MAX_SIZE;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        // Compress to highly optimized webp base64 (usually <15kb)
        const compressedBase64 = canvas.toDataURL("image/webp", 0.8);
        setProfileState((prev) => ({ ...prev, image: compressedBase64 }));
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    setProfileState((prev) => ({ ...prev, saving: true }));
    try {
      const { error } = await authClient.updateUser({
        name: profileState.name,
        image: profileState.image,
      });
      if (error) throw error;
      setProfileState((prev) => ({ ...prev, saving: false, saved: true }));
      toast({ title: t("settings.account.profileUpdated") });
      setTimeout(() => setProfileState((prev) => ({ ...prev, saved: false })), 2000);
      setTimeout(() => window.location.reload(), 500); // Reload to update auth context across app
    } catch (err: any) {
      toast({
        title: t("settings.account.profileUpdateFailed"),
        description: err.message,
        variant: "destructive",
      });
      setProfileState((prev) => ({ ...prev, saving: false }));
    }
  };

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
        title: t("settings.account.redirectingToGoogle"),
        description: t("settings.account.googleAuthDescription"),
      });
    } catch (err: any) {
      toast({
        title: t("settings.account.linkingFailed"),
        description: err.message || t("settings.account.linkingFailed"),
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
        title: t("settings.account.googleDisconnected"),
        description: t("settings.account.googleDisconnectedDescription"),
      });
      await fetchLinkedAccounts();
    } catch (err: any) {
      toast({
        title: t("settings.account.unlinkingFailed"),
        description: err.message || t("settings.account.unlinkingFailed"),
        variant: "destructive",
      });
    } finally {
      setUnlinkingProvider(null);
    }
  };

  useEffect(() => {
    if (!activeWorkspace?.id) return;
    setWsState((prev) => ({ ...prev, loading: true }));
    apiFetch(`/api/workspaces/${activeWorkspace.id}/settings`)
      .then((d) => {
        setWsState((prev) => ({
          ...prev,
          currency: d.currency ?? "USD",
          fiscalYear: d.fiscalYearStart ?? "January",
          commissionEngine: d.commissionEngine ?? "standard",
          loading: false,
        }));
      })
      .catch((err) => {
        console.error(err);
        setWsState((prev) => ({ ...prev, loading: false }));
      });
  }, [activeWorkspace?.id]);

  const saveWorkspaceSettings = async () => {
    if (!activeWorkspace?.id) return;
    setWsState((prev) => ({ ...prev, saving: true }));
    try {
      await apiFetch(`/api/workspaces/${activeWorkspace.id}/settings`, {
        method: "PATCH",
        body: JSON.stringify({ fiscalYearStart: wsState.fiscalYear }),
      });
      setWsState((prev) => ({ ...prev, saving: false, saved: true }));
      toast({ title: t("settings.workspace.workspaceSettingsSaved") });
      setTimeout(() => setWsState((prev) => ({ ...prev, saved: false })), 2000);
    } catch {
      toast({ title: t("settings.workspace.failedToSaveSettings"), variant: "destructive" });
      setWsState((prev) => ({ ...prev, saving: false }));
    }
  };

  const [prefs, setPrefs] = useState<NotifPrefs>(() =>
    Object.fromEntries(NOTIFICATION_KEYS.map((t) => [t.key, { email: true, inApp: true }])),
  );
  const [prefsState, setPrefsState] = useState({ saving: false, saved: false });

  useEffect(() => {
    apiFetch(`/api/users/me/notification-prefs`)
      .then((d) => d.prefs && setPrefs(d.prefs))
      .catch(console.error);
  }, []);

  if (roleLoading) {
    return (
      <div className="space-y-7 max-w-2xl">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2 pb-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-8 w-24 rounded-full" />
          ))}
        </div>
        <Skeleton className="h-64 w-full rounded-2xl" />
        <Skeleton className="h-48 w-full rounded-2xl" />
      </div>
    );
  }

  const RoleIcon = role ? ROLE_ICONS[role as keyof typeof ROLE_ICONS] : Users;
  const roleStyle = role
    ? ROLE_STYLES[role as keyof typeof ROLE_STYLES]
    : "text-muted-foreground bg-muted border-border";
  const isAdmin = hasPermission("workspace", "edit");

  const saveNotifPrefs = async () => {
    setPrefsState((prev) => ({ ...prev, saving: true }));
    try {
      await apiFetch(`/api/users/me/notification-prefs`, {
        method: "PATCH",
        body: JSON.stringify({ prefs }),
      });
      setPrefsState((prev) => ({ ...prev, saving: false, saved: true }));
      toast({ title: t("settings.notifications.preferencesSaved") });
      setTimeout(() => setPrefsState((prev) => ({ ...prev, saved: false })), 2000);
    } catch {
      toast({ title: t("settings.notifications.failedToSavePreferences"), variant: "destructive" });
      setPrefsState((prev) => ({ ...prev, saving: false }));
    }
  };

  const setTypePref = (key: string, field: "email" | "inApp", value: boolean) => {
    setPrefs((p) => ({ ...p, [key]: { ...p[key], [field]: value } }));
  };

  return (
    <div className="space-y-7 max-w-3xl">
      <div>
        <p className="text-[12px] font-semibold text-primary mb-1">{t("settings.configuration")}</p>
        <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">
          {t("settings.title")}
        </h1>
        <p className="text-[14px] text-muted-foreground mt-1">{t("settings.description")}</p>
      </div>

      <Tabs defaultValue="account" className="w-full">
        <TabsList className="mb-6 bg-muted/50 w-full sm:w-auto overflow-x-auto justify-start gap-1 flex">
          <TabsTrigger value="account" className="min-w-fit px-4">
            {t("settings.tabs.account")}
          </TabsTrigger>
          <TabsTrigger value="appearance" className="min-w-fit px-4">
            {t("settings.tabs.appearance")}
          </TabsTrigger>
          {hasPermission("workspace", "edit") && (
            <TabsTrigger value="workspace" className="min-w-fit px-4">
              {t("settings.tabs.workspace")}
            </TabsTrigger>
          )}
          <TabsTrigger value="notifications" className="min-w-fit px-4">
            {t("settings.tabs.notifications")}
          </TabsTrigger>
          <TabsTrigger value="security" className="min-w-fit px-4">
            {t("settings.tabs.security")}
          </TabsTrigger>
          {hasPermission("roles", "read") && (
            <TabsTrigger value="roles" className="min-w-fit px-4">
              {t("settings.tabs.roles")}
            </TabsTrigger>
          )}
          {hasPermission("workspace", "edit") && (
            <TabsTrigger value="api-keys" className="min-w-fit px-4">
              {t("settings.tabs.apiKeys")}
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="account" className="outline-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-7"
          >
            {/* Account */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="size-4 text-primary" /> {t("settings.account.title")}
                </CardTitle>
                <CardDescription>{t("settings.account.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex flex-col md:flex-row gap-8 pb-4 border-b border-border">
                  <div className="flex flex-col items-center gap-3 shrink-0">
                    <div className="relative group size-20 rounded-full overflow-hidden bg-primary/10 flex items-center justify-center text-primary text-xl font-semibold border border-border">
                      {profileState.image ? (
                        <img
                          src={profileState.image}
                          alt="Avatar"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        user?.email?.slice(0, 2).toUpperCase() || "??"
                      )}
                      <div
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                        onClick={() => document.getElementById("avatar-upload")?.click()}
                      >
                        <span className="text-white text-[11px] font-semibold">
                          {t("common.upload")}
                        </span>
                      </div>
                    </div>
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                    />
                    {profileState.image && (
                      <button
                        type="button"
                        onClick={() => setProfileState((prev) => ({ ...prev, image: "" }))}
                        className="text-[11px] font-medium text-destructive hover:underline"
                      >
                        {t("common.remove")}
                      </button>
                    )}
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="profile-name">{t("settings.account.fullName")}</Label>
                      <Input
                        id="profile-name"
                        value={profileState.name}
                        onChange={(e) =>
                          setProfileState((prev) => ({ ...prev, name: e.target.value }))
                        }
                        placeholder={t("settings.account.namePlaceholder")}
                        className="max-w-md"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label>{t("settings.account.email")}</Label>
                      <Input value={user?.email || ""} disabled className="bg-muted max-w-md" />
                      <p className="text-[11px] text-muted-foreground">
                        {t("settings.account.emailCannotBeChanged")}
                      </p>
                    </div>
                    <div className="pt-2">
                      <Button
                        onClick={saveProfile}
                        disabled={profileState.saving}
                        className="gap-2"
                      >
                        {profileState.saving ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : profileState.saved ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Save className="size-3.5" />
                        )}
                        {profileState.saved ? t("common.saved") : t("settings.account.saveProfile")}
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-1 border-t border-border mt-4">
                  <div>
                    <p className="text-sm font-medium">{t("settings.account.yourRole")}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t("settings.account.accessLevelIn", { workspace: activeWorkspace?.name })}
                    </p>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-semibold",
                      roleStyle,
                    )}
                  >
                    <RoleIcon className="size-3.5" />
                    {t(`settings.roles.${role}`)}
                  </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-1 border-t border-border">
                  <div>
                    <p className="text-sm font-medium">{t("settings.account.language")}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t("settings.account.languageDescription")}
                    </p>
                  </div>
                  <Select value={i18n.language} onValueChange={(v) => i18n.changeLanguage(v)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SUPPORTED_LANGS.map((l) => (
                        <SelectItem key={l.code} value={l.code}>
                          {l.nativeLabel} ({l.label})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-1 border-t border-border">
                  <div>
                    <p className="text-sm font-medium">{t("settings.account.teamMembers")}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t("settings.account.teamMembersDescription")}
                    </p>
                  </div>
                  <Button variant="outline" asChild className="gap-1.5">
                    <Link href="/dash/team">
                      {t("settings.account.manage")} <ArrowRight className="size-3.5" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Linked Accounts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <svg
                    className="size-4 text-primary"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  {t("settings.account.connectedAccounts")}
                </CardTitle>
                <CardDescription>
                  {t("settings.account.connectedAccountsDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 py-1">
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
                      {linkedAccounts.some((acc) => acc.providerId === "google") ? (
                        <p className="text-xs text-emerald-500 flex items-center gap-1 font-medium mt-0.5">
                          <Check className="size-3" /> {t("settings.account.connected")}
                        </p>
                      ) : (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {t("settings.account.notConnected")}
                        </p>
                      )}
                    </div>
                  </div>
                  {loadingAccounts ? (
                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                  ) : linkedAccounts.some((acc) => acc.providerId === "google") ? (
                    <Button
                      variant="outline"
                      onClick={handleUnlinkGoogle}
                      disabled={unlinkingProvider === "google"}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 border-border/50 transition-colors"
                    >
                      {unlinkingProvider === "google" && (
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      )}
                      {t("settings.account.disconnect")}
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={handleLinkGoogle}
                      disabled={linkingProvider === "google"}
                      className="hover:bg-muted transition-colors"
                    >
                      {linkingProvider === "google" && (
                        <Loader2 className="size-3.5 animate-spin mr-1.5" />
                      )}
                      {t("settings.account.linkGoogle")}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="appearance" className="outline-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-7"
          >
            {/* Appearance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Sun className="size-4 text-primary" /> {t("settings.appearance.title")}
                </CardTitle>
                <CardDescription>{t("settings.appearance.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <Label className="text-sm font-medium">{t("settings.appearance.theme")}</Label>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {t("settings.appearance.currentlyUsing", {
                        mode:
                          theme === "dark"
                            ? t("settings.appearance.darkMode")
                            : t("settings.appearance.lightMode"),
                      })}
                    </p>
                  </div>
                  <Button variant="outline" onClick={toggle} className="gap-2">
                    {theme === "dark" ? (
                      <>
                        <Sun className="size-4" /> {t("settings.appearance.lightMode")}
                      </>
                    ) : (
                      <>
                        <Moon className="size-4" /> {t("settings.appearance.darkMode")}
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {hasPermission("workspace", "edit") && (
          <TabsContent value="workspace" className="outline-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-7"
            >
              {/* Workspace settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="size-4 text-primary" /> {t("settings.workspace.title")}
                  </CardTitle>
                  <CardDescription>
                    {t("settings.workspace.description")}
                    {!isAdmin && ` ${t("settings.workspace.adminRequired")}`}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("settings.workspace.currency")}
                      </Label>
                      <div className="flex h-9 items-center rounded-md border bg-muted/50 px-3 text-sm text-muted-foreground">
                        {CURRENCIES.find((c) => c.code === wsState.currency)?.code ??
                          wsState.currency}{" "}
                        —{" "}
                        {CURRENCIES.find((c) => c.code === wsState.currency)?.name ??
                          "United States Dollar"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.workspace.currencyImmutable")}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        {t("settings.workspace.fiscalYearStart")}
                      </Label>
                      <Select
                        value={wsState.fiscalYear}
                        onValueChange={(v) => setWsState((prev) => ({ ...prev, fiscalYear: v }))}
                        disabled={!isAdmin || wsState.loading}
                      >
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {t("settings.workspace.fiscalYearHelp")}
                      </p>
                    </div>
                  </div>
                  {isAdmin && (
                    <div className="flex justify-end pt-1">
                      <Button
                        onClick={saveWorkspaceSettings}
                        disabled={wsState.saving || wsState.loading}
                        className="gap-2"
                      >
                        {wsState.saving ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : wsState.saved ? (
                          <Check className="size-3.5" />
                        ) : (
                          <Save className="size-3.5" />
                        )}
                        {wsState.saved
                          ? t("common.saved")
                          : t("settings.workspace.saveWorkspaceSettings")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </TabsContent>
        )}

        <TabsContent value="notifications" className="outline-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-7"
          >
            {/* Notifications */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Bell className="size-4 text-primary" /> {t("settings.notifications.title")}
                </CardTitle>
                <CardDescription>{t("settings.notifications.description")}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                {/* Column headers */}
                <div className="flex items-center pb-2 border-b border-border">
                  <div className="flex-1" />
                  <div className="flex gap-6 pr-1">
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-10 text-center">
                      {t("settings.notifications.email")}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide w-10 text-center">
                      {t("settings.notifications.inApp")}
                    </span>
                  </div>
                </div>

                {NOTIFICATION_KEYS.map((tItem, i) => (
                  <div
                    key={tItem.key}
                    className={cn(
                      "flex items-center py-3",
                      i < NOTIFICATION_KEYS.length - 1 && "border-b border-border/50",
                    )}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium">{t(tItem.i18nKey)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{t(tItem.i18nDescKey)}</p>
                    </div>
                    <div className="flex gap-6 pr-1">
                      <div className="w-10 flex justify-center">
                        <Toggle
                          on={prefs[tItem.key]?.email ?? true}
                          onChange={(v) => setTypePref(tItem.key, "email", v)}
                        />
                      </div>
                      <div className="w-10 flex justify-center">
                        <Toggle
                          on={prefs[tItem.key]?.inApp ?? true}
                          onChange={(v) => setTypePref(tItem.key, "inApp", v)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <div className="flex justify-end pt-4">
                  <Button onClick={saveNotifPrefs} disabled={prefsState.saving} className="gap-2">
                    {prefsState.saving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : prefsState.saved ? (
                      <Check className="size-3.5" />
                    ) : (
                      <Save className="size-3.5" />
                    )}
                    {prefsState.saved
                      ? t("common.saved")
                      : t("settings.notifications.savePreferences")}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="security" className="outline-none">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-7"
          >
            {/* Security */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Shield className="size-4 text-primary" /> {t("settings.security.title")}
                </CardTitle>
                <CardDescription>{t("settings.security.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium">{t("settings.security.sessionTimeout")}</p>
                    <p className="text-sm text-muted-foreground">
                      {t("settings.security.sessionTimeoutDescription")}
                    </p>
                  </div>
                  <span className="text-sm text-muted-foreground bg-muted p-3 rounded-md">
                    {t("settings.security.eightHours")}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {isAdmin && (
          <TabsContent value="roles" className="outline-none mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-7"
            >
              <SettingsRoles />
            </motion.div>
          </TabsContent>
        )}
        {isAdmin && (
          <TabsContent value="api-keys" className="outline-none mt-0">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-7"
            >
              <SettingsApiKeys />
            </motion.div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
