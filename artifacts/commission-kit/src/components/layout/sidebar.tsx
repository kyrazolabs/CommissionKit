import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, FileText, Briefcase, PlayCircle,
  Search, Sun, Moon, BarChart2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

const navGroups = [
  {
    label: "Main",
    items: [
      { name: "Dashboard", href: "/", icon: LayoutDashboard },
      { name: "Reps", href: "/reps", icon: Users },
      { name: "Plans", href: "/plans", icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Deals", href: "/deals", icon: Briefcase },
      { name: "Runs", href: "/runs", icon: PlayCircle },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-full w-60 flex-col bg-sidebar border-r border-sidebar-border">
      {/* Logo — no bottom border, blends with sidebar */}
      <div className="flex h-14 items-center px-4 gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <BarChart2 className="h-4 w-4" />
        </div>
        <span className="font-semibold tracking-tight text-sidebar-foreground text-sm">CommissionKit</span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-3 pt-2">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-5">
            <p className="px-2 mb-1 text-[10.5px] font-semibold uppercase tracking-widest text-sidebar-foreground/40">
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
                      "group flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground border border-sidebar-accent-border"
                        : "text-sidebar-foreground/60 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground border border-transparent"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-sidebar-primary"
                          : "text-sidebar-foreground/35 group-hover:text-sidebar-foreground/60"
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom: search + theme toggle + user */}
      <div className="px-3 pb-4 space-y-3 border-t border-sidebar-border pt-3">
        {/* Search */}
        <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-sidebar-foreground/5 cursor-pointer hover:bg-sidebar-foreground/8 transition-colors">
          <Search className="h-3.5 w-3.5 text-sidebar-foreground/40" />
          <span className="text-xs text-sidebar-foreground/40 flex-1">Search...</span>
          <span className="text-[10px] text-sidebar-foreground/25 bg-sidebar-foreground/8 rounded px-1.5 py-0.5">⌘K</span>
        </div>

        {/* User + theme toggle */}
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold border border-primary/20 flex-shrink-0">
            JS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-sidebar-foreground truncate">Jane Smith</p>
            <p className="text-[10.5px] text-sidebar-foreground/45 truncate">RevOps Manager</p>
          </div>
          <button
            onClick={toggle}
            className="h-7 w-7 flex items-center justify-center rounded-lg text-sidebar-foreground/40 hover:text-sidebar-foreground hover:bg-sidebar-foreground/8 transition-colors flex-shrink-0"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
