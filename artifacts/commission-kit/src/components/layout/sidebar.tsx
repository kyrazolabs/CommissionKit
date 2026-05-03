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
      { name: "Reps",      href: "/reps", icon: Users },
      { name: "Plans",     href: "/plans", icon: FileText },
    ],
  },
  {
    label: "Operations",
    items: [
      { name: "Deals", href: "/deals", icon: Briefcase },
      { name: "Runs",  href: "/runs",  icon: PlayCircle },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-full w-56 flex-col bg-sidebar border-r border-sidebar-border">

      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BarChart2 className="h-3.5 w-3.5" />
        </div>
        <span className="text-[13.5px] font-semibold tracking-tight text-sidebar-foreground">
          CommissionKit
        </span>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto px-2 pt-1">
        {navGroups.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-[0.06em] text-sidebar-foreground/30 select-none">
              {group.label}
            </p>
            <nav className="space-y-px">
              {group.items.map((item) => {
                const isActive =
                  location === item.href ||
                  (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={cn(
                      "group flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[13px] font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/55 hover:bg-sidebar-foreground/5 hover:text-sidebar-foreground"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-3.5 w-3.5 flex-shrink-0",
                        isActive
                          ? "text-sidebar-primary"
                          : "text-sidebar-foreground/30 group-hover:text-sidebar-foreground/55"
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

      {/* Bottom */}
      <div className="px-2 pb-3 pt-2 border-t border-sidebar-border space-y-2">
        {/* Search */}
        <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-sidebar-foreground/5 cursor-pointer hover:bg-sidebar-foreground/8 transition-colors">
          <Search className="h-3 w-3 text-sidebar-foreground/30 flex-shrink-0" />
          <span className="text-[12px] text-sidebar-foreground/35 flex-1">Search...</span>
          <kbd className="text-[9px] text-sidebar-foreground/25 bg-sidebar-foreground/8 rounded px-1 py-0.5 font-mono">⌘K</kbd>
        </div>

        {/* User row */}
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold border border-primary/25 flex-shrink-0">
            JS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-sidebar-foreground truncate leading-tight">Jane Smith</p>
            <p className="text-[10.5px] text-sidebar-foreground/40 truncate leading-tight">RevOps Manager</p>
          </div>
          <button
            onClick={toggle}
            className="h-6 w-6 flex items-center justify-center rounded-md text-sidebar-foreground/35 hover:text-sidebar-foreground hover:bg-sidebar-foreground/8 transition-colors flex-shrink-0"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark"
              ? <Sun className="h-3 w-3" />
              : <Moon className="h-3 w-3" />}
          </button>
        </div>
      </div>
    </div>
  );
}
