import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, FileText, Briefcase, PlayCircle,
  Search, Settings, CreditCard, LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";

const navGroups = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/",      icon: LayoutDashboard },
      { name: "Reps",      href: "/reps",   icon: Users },
      { name: "Plans",     href: "/plans",  icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Deals", href: "/deals", icon: Briefcase },
      { name: "Runs",  href: "/runs",  icon: PlayCircle },
    ],
  },
  {
    label: "Account",
    items: [
      { name: "Billing",  href: "/billing",  icon: CreditCard },
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { user, signOut } = useAuth();

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";

  return (
    <div className="flex h-full w-[220px] shrink-0 flex-col bg-sidebar">

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto px-3 pt-5 space-y-6">
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

      {/* Bottom: user info + sign out */}
      <div className="px-3 pb-4 pt-2 space-y-2 border-t border-border mt-2">
        {user && (
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
              {initials}
            </div>
            <span className="flex-1 text-[12px] text-muted-foreground truncate">{user.email}</span>
          </div>
        )}
        <button
          onClick={signOut}
          className="w-full flex items-center gap-2.5 rounded-[10px] px-2.5 py-[7px] text-[13.5px] text-sidebar-foreground border border-transparent hover:bg-destructive/10 hover:text-destructive transition-colors"
        >
          <LogOut className="h-[15px] w-[15px] shrink-0 opacity-70" />
          Sign out
        </button>
      </div>
    </div>
  );
}
