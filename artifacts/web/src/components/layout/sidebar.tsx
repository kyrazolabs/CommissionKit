import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, FileText, Briefcase, PlayCircle,
  Settings, CreditCard, LogOut, ChevronsUpDown, Check, Plus,
  Building2, Shield, Crown, PieChart, Wallet, AlertOctagon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useWorkspace, type Workspace } from "@/hooks/use-workspace";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRole } from "@/hooks/use-role";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navGroups = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/",      icon: LayoutDashboard },
      { name: "Reports",   href: "/reports",icon: PieChart },
      { name: "Reps",      href: "/reps",   icon: Users },
      { name: "Plans",     href: "/plans",  icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Deals",    href: "/deals",    icon: Briefcase },
      { name: "Runs",     href: "/runs",     icon: PlayCircle },
      { name: "Payouts",  href: "/payouts",  icon: Wallet },
      { name: "Disputes", href: "/disputes", icon: AlertOctagon },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Team",     href: "/team",     icon: Users },
      { name: "Billing",  href: "/billing",  icon: CreditCard },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

const ROLE_ICONS = {
  owner: Crown,
  admin: Shield,
  member: Users,
};

function WorkspaceSwitcher() {
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

  const initial = activeWorkspace.name.slice(0, 1).toUpperCase();

  return (
    <div className="px-3 pt-3 pb-2">
      <Popover open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setShowCreate(false);
          setNewName("");
        }
      }}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center gap-2 p-2 rounded-[10px] hover:bg-muted text-left transition-colors group outline-none">
            <div className="flex size-6 items-center justify-center rounded-md bg-primary text-primary-foreground text-[11px] font-semibold shrink-0">
              {initial}
            </div>
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
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-[196px] p-0 rounded-xl overflow-hidden" align="start" sideOffset={8}>
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
                    Workspaces
                  </p>
                  <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                    {workspaces.map((ws) => (
                      <button
                        key={ws.id}
                        onClick={() => { setActiveWorkspace(ws); setOpen(false); }}
                        className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-muted text-left transition-colors"
                      >
                        <div className="flex size-5 items-center justify-center rounded bg-primary/10 text-primary text-[10px] font-semibold shrink-0">
                          {ws.name.slice(0, 1).toUpperCase()}
                        </div>
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
                    <span className="text-[12.5px] text-muted-foreground">New workspace</span>
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
                  <p className="text-[11px] font-semibold text-foreground">New workspace</p>
                  <Input
                    autoFocus
                    type="text"
                    placeholder="Workspace name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8! text-[12.5px]"
                  />
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => { setShowCreate(false); setNewName(""); }}
                      className="flex-1 h-7 text-[12px]"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="xs"
                      disabled={!newName.trim() || creating}
                      className="flex-1 h-7 text-[12px]"
                    >
                      {creating ? "…" : "Create"}
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

export function Sidebar() {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  return (
    <div className="flex h-full w-[220px] shrink-0 flex-col bg-sidebar">

      {/* Workspace switcher */}
      <WorkspaceSwitcher />

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto px-3 pt-4 space-y-6">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 mb-1.5 text-[11px] font-semibold uppercase tracking-[0.05em] text-sidebar-muted-foreground select-none">
              {group.label}
            </p>
            <nav className="space-y-0.5">
              {group.items.map((item) => {
                const isActive =
                  location === item.href ||
                  (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-[13.5px] transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold border border-sidebar-primary/20"
                        : "text-sidebar-foreground font-normal border border-transparent hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-[15px] w-[15px] shrink-0",
                        isActive
                          ? "text-sidebar-primary"
                          : "text-sidebar-muted-foreground opacity-70"
                      )}
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom: user profile menu */}
      <div className="p-3 border-t border-border mt-2">
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center gap-2 p-2 rounded-[10px] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground text-left transition-colors outline-none group">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-semibold overflow-hidden">
                  {user.image ? (
                    <img src={user.image} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold text-foreground truncate leading-none">
                    {user.name || user.email.split("@")[0]}
                  </p>
                </div>
                <ChevronsUpDown className="size-3.5 text-muted-foreground shrink-0 opacity-60 group-hover:opacity-100 transition-opacity" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[200px] rounded-xl" align="start" side="top" sideOffset={8}>
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
                <Link href="/settings" className="w-full cursor-pointer flex items-center gap-2.5 rounded-lg py-2">
                  <Settings className="size-[15px] opacity-70" />
                  Account Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={signOut}
                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer flex items-center gap-2.5 rounded-lg py-2"
              >
                <LogOut className="size-[15px] opacity-70" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}
