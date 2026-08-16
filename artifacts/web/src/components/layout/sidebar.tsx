import { Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import {
  LayoutDashboard, Users, FileText, Briefcase, PlayCircle,
  Settings, CreditCard, LogOut, ChevronsUpDown, Check, Plus,
  Building2, Shield, Crown, PieChart, Wallet, AlertOctagon, FolderKanban, Grid3X3, Plug,
  ScrollText, PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace, type Workspace } from "@/hooks/use-workspace";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/hooks/use-role";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { WorkspaceAvatar } from "@/components/workspace-avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { apiFetch } from "@/lib/api";
import { Analytics } from "@/lib/analytics";

const ICON_MAP: Record<string, any> = {
  LayoutDashboard, Users, FileText, Briefcase, PlayCircle,
  Settings, CreditCard, PieChart, Wallet, AlertOctagon, FolderKanban, Building2, Grid3X3, ScrollText, Plug,
};

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: Users,
};

function WorkspaceSwitcher({ collapsed }: { collapsed: boolean }) {
  const { t } = useTranslation();
  const { workspaces, activeWorkspace, setActiveWorkspace, createWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    try {
      await createWorkspace(newName.trim());
      setShowCreate(false);
      setNewName("");
      setOpen(false);
    } finally {
      setCreating(false);
    }
  };

  if (!activeWorkspace) return null;

  return (
    <div className={cn("pt-3 pb-2 transition-all duration-200", collapsed ? "px-1.5" : "px-3")}>
      <Popover open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setShowCreate(false);
          setNewName("");
        }
      }}>
        <PopoverTrigger asChild>
          <button className={cn(
            "flex items-center gap-2 p-2 rounded-[10px] hover:bg-muted text-left transition-all duration-200 group outline-none click",
            collapsed ? "w-full justify-start" : "w-full",
          )}>
            <WorkspaceAvatar name={activeWorkspace.name} size={28} className="size-7 shrink-0 rounded-md" />
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate leading-none">{activeWorkspace.name}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {(() => {
                      const RoleIcon = ROLE_ICONS[activeWorkspace.role] ?? Users;
                      return <RoleIcon className="size-2.5 text-muted-foreground" />;
                    })()}
                    <p className="text-[10px] text-muted-foreground capitalize">{activeWorkspace.role}</p>
                  </div>
                </div>
                <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-49 p-0 rounded-xl overflow-hidden" align="start" sideOffset={8}>
          <AnimatePresence mode="wait">
            {!showCreate ? (
              <motion.div
                key="list"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="px-2 pt-2 pb-1">
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1.5 pb-1">
                    {t("sidebar.workspaces")}
                  </p>
                  <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => { setActiveWorkspace(ws); setOpen(false); }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-left transition-colors"
                      >
                        <WorkspaceAvatar name={ws.name} size={20} className="size-5 shrink-0 rounded" />
                        <span className="flex-1 text-[13px] text-foreground truncate">{ws.name}</span>
                        {activeWorkspace.id === ws.id && (
                          <Check className="size-3.5 text-primary shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="border-t border-border p-2">
                  <button
                    onClick={() => setShowCreate(true)}
                    className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-left transition-colors"
                  >
                    <Plus className="size-3.5 text-muted-foreground" />
                    <span className="text-[12.5px] text-muted-foreground">{t("sidebar.newWorkspace")}</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="create"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.2 }}
              >
                <form onSubmit={handleCreate} className="p-3 space-y-3">
                  <p className="text-[11px] font-semibold text-foreground">{t("sidebar.newWorkspace")}</p>
                  <Input
                    autoFocus
                    type="text"
                    placeholder={t("sidebar.workspaceNamePlaceholder")}
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8! text-[12.5px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => { setShowCreate(false); setNewName(""); }}
                      className="flex-1 h-7 text-[12px]"
                    >
                      {t("common.cancel")}
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={!newName.trim() || creating}
                      className="flex-1 h-7 text-[12px]"
                    >
                      {creating ? "…" : t("common.create")}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function Sidebar({ onCloseMobile, isMobile }: { onCloseMobile?: () => void; isMobile?: boolean }) {
  const { t } = useTranslation();
  const [location] = useLocation();
  const { user, signOut } = useAuth();
  const { activeWorkspace, engineNavItems, loading: wsLoading } = useWorkspace();
  const { can, hasPermission } = useRole();

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem("ck_sidebar_collapsed") === "true"; } catch { return false; }
  });

  const toggleCollapsed = () => {
    setCollapsed(prev => {
      const next = !prev;
      try { localStorage.setItem("ck_sidebar_collapsed", String(next)); } catch {}
      return next;
    });
  };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  const handleSignOut = () => {
    Analytics.authSignOut();
    signOut();
  };

  const replaceMap = new Map(engineNavItems.map(item => [item.replaces, item]));

  const navGroups = [
    {
      label: t("sidebar.main"),
      items: [
        { name: t("layout.dashboard"), href: "/dash",             icon: "LayoutDashboard",     permission: { resource: "dashboard", action: "read" } },
        { name: t("layout.reports"),   href: "/dash/reports",     icon: "PieChart",     permission: { resource: "reports", action: "read" } },
        { name: t("layout.reps"),      href: "/dash/reps",        icon: "Users",     permission: { resource: "reps", action: "read" } },
        { name: t("layout.plans"),     href: "/dash/plans",       icon: "FileText",     permission: { resource: "plans", action: "read" } },
      ],
    },
    {
      label: t("sidebar.operations"),
      items: [
        { name: t("layout.deals"),    href: "/dash/deals",         icon: "Briefcase",     permission: { resource: "deals", action: "read" } },
        { name: t("layout.runs"),     href: "/dash/runs",          icon: "PlayCircle",     permission: { resource: "calculations", action: "read" } },
        { name: t("layout.payouts"), href: "/dash/payouts",       icon: "Wallet",     permission: { resource: "payouts", action: "read" } },
        { name: t("layout.disputes"), href: "/dash/disputes",       icon: "AlertOctagon",     permission: { resource: "disputes", action: "read" } },
        { name: "Audit Log",          href: "/dash/audit-log",      icon: "ScrollText",    permission: { resource: "audit_log", action: "read" } },
      ],
    },
    {
      label: t("sidebar.account"),
      items: [
        { name: t("layout.team"),     href: "/dash/team",     icon: "Users",   permission: { resource: "team", action: "read" }  },
        { name: t("layout.billing"),        href: "/dash/billing",        icon: "CreditCard",   permission: { resource: "billing", action: "read" } },
        { name: t("layout.integrations"),   href: "/dash/integrations",   icon: "Plug",   permission: { resource: "workspace", action: "read" } },
        { name: t("layout.settings"), href: "/dash/settings", icon: "Settings" },
      ],
    },
  ];

  const allGroups = navGroups.map(g => ({
    ...g,
    items: g.items.map(item => replaceMap.get(item.href) ?? item),
  }));

  const filteredGroups = allGroups
    .map(g => ({
      ...g,
      items: g.items.filter(item => {
        if (!(item as any).permission) return true;
        return hasPermission((item as any).permission.resource, (item as any).permission.action);
      }),
    }))
    .filter(g => g.items.length > 0);

  const effectiveCollapsed = isMobile ? false : collapsed;

  return (
    <div className={cn(
      "flex h-full shrink-0 flex-col bg-sidebar transition-all duration-200",
      isMobile ? "w-55" : collapsed ? "w-14" : "w-50",
    )}>

      {/* Workspace switcher */}
      <WorkspaceSwitcher collapsed={effectiveCollapsed} />

      {/* Nav groups */}
      <div className={cn("flex-1 overflow-y-auto", effectiveCollapsed ? "px-1.5 pt-4 space-y-4" : "px-3 pt-4 space-y-6")}>
        {filteredGroups.map((group) => (
          <div key={group.label}>
            <p
              className={cn(
                "px-2 mb-1.5 text-xs font-semibold uppercase tracking-wider",
                "text-sidebar-muted-foreground select-none truncate",
                "overflow-hidden transition-all duration-50 ease-in-out",
                effectiveCollapsed
                  ? "max-h-0 opacity-0 py-0 mb-0"
                  : "max-h-6 opacity-100"
              )}
            >
              {group.label}
            </p>
            <nav className={effectiveCollapsed ? "space-y-1" : "space-y-0.5"}>
              {group.items.map((item: any) => {
                const IconComponent = typeof item.icon === "string" ? ICON_MAP[item.icon] : item.icon;
                const isActive =
                  location === item.href ||
                  (item.href !== "/dash" && location.startsWith(item.href));

                const linkContent = (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-lg text-sm transition-colors click truncate",
                      effectiveCollapsed ? "justify-center size-9 mx-1 p-0" : "px-2.5 py-1.75",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border border-transparent"
                        : "text-sidebar-foreground font-normal border border-transparent hover:bg-muted hover:text-foreground"
                    )}
                    onClick={() => Analytics.navClick(group.label, item.href, item.name)}
                  >
                    {IconComponent && (
                      <IconComponent
                        className={cn(
                          effectiveCollapsed ? "size-4" : "h-3.75 w-3.75",
                          "shrink-0",
                          isActive
                            ? "text-sidebar-primary"
                            : "text-sidebar-muted-foreground opacity-70"
                        )}
                      />
                    )}
                    {!effectiveCollapsed && item.name}
                  </Link>
                );

                if (effectiveCollapsed) {
                  return (
                    <Tooltip key={item.name} delayDuration={0}>
                      <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                      <TooltipContent side="right" sideOffset={12} className="text-xs">
                        {item.name}
                      </TooltipContent>
                    </Tooltip>
                  );
                }
                return linkContent;
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Toggle button */}
      <div className={cn("flex transition-all duration-200", effectiveCollapsed ? "justify-start pt-2" : "px-3 pt-2")}>
        <button
          onClick={isMobile ? onCloseMobile : toggleCollapsed}
          className={cn(
            "flex items-center gap-2.5 rounded-[10px] text-sm text-sidebar-muted-foreground hover:bg-muted hover:text-foreground transition-all duration-200 click",
            effectiveCollapsed ? "justify-center size-9 p-0 ml-1" : "w-full px-2.5 py-1.75",
          )}
        >
          {effectiveCollapsed ? (
            <PanelLeftOpen className="size-4 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="size-3.75 shrink-0 opacity-70" />
              {isMobile ? "Close" : "Collapse"}
            </>
          )}
        </button>
      </div>

      {/* Bottom: user profile menu */}
      <div className={cn("border-t border-border transition-all duration-200", effectiveCollapsed ? "p-1.5 mt-2" : "p-3 mt-2")}>
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={cn(
                "flex items-center justify-start gap-2 p-2 rounded-md hover:bg-sidebar-accent text-left transition-all duration-200 outline-none group",
                effectiveCollapsed ? "w-full justify-start" : "w-full",
              )}>
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-semibold overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                {!effectiveCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-foreground truncate leading-none">
                        {user.name || user.email.split("@")[0]}
                      </p>
                    </div>
                    <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
                  </>
                )}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-50 rounded-xl" align="start" side="top" sideOffset={8}>
              <div className="flex items-center gap-2.5 p-2">
                <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-[12px] font-semibold shrink-0 overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0 justify-center items-center">
                  <p className="text-[13px] font-semibold text-foreground truncate leading-none">
                    {user.name || user.email.split("@")[0]}
                  </p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dash/settings" className="w-full cursor-pointer flex items-center gap-2.5 rounded-lg py-2">
                  <Settings className="size-3.75 opacity-70" />
                  {t("sidebar.accountSettings")}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleSignOut}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2.5 rounded-lg py-2"
              >
                <LogOut className="size-[15px] opacity-70" />
                {t("sidebar.signOut")}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
