import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, FileText, Briefcase, PlayCircle,
  Search, Sun, Moon, TrendingUp, ChevronRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/use-theme";

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
];

export function Sidebar() {
  const [location] = useLocation();
  const { theme, toggle } = useTheme();

  return (
    <div className="flex h-full w-60 flex-col bg-sidebar shrink-0 border-r-0" style={{ borderRight: "none" }}>

      {/* Logo */}
      <div className="flex h-[58px] items-center gap-3 px-5 border-b border-sidebar-border">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-sidebar-primary text-white shadow-md">
          <TrendingUp className="h-4 w-4" />
        </div>
        <div>
          <span className="text-[14px] font-bold text-white tracking-tight">CommissionKit</span>
        </div>
      </div>

      {/* Nav groups */}
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-5">
        {navGroups.map((group) => (
          <div key={group.label}>
            <p className="px-2 mb-1.5 text-[10.5px] font-semibold uppercase tracking-widest text-sidebar-muted-foreground select-none">
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
                      "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13.5px] font-medium transition-all duration-100",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-white/5 hover:text-white"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "h-4 w-4 flex-shrink-0 transition-colors",
                        isActive
                          ? "text-sidebar-primary"
                          : "text-sidebar-muted-foreground group-hover:text-sidebar-foreground"
                      )}
                    />
                    <span className="flex-1">{item.name}</span>
                    {isActive && (
                      <ChevronRight className="h-3 w-3 text-sidebar-primary opacity-60" />
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {/* Bottom section */}
      <div className="border-t border-sidebar-border px-3 py-3 space-y-1.5">
        {/* Search */}
        <button className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-[13px] text-sidebar-muted-foreground hover:bg-white/5 hover:text-sidebar-foreground transition-colors">
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] bg-white/8 text-sidebar-muted-foreground rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
        </button>

        {/* User */}
        <div className="flex items-center gap-2.5 rounded-lg px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-sidebar-primary/25 text-sidebar-primary text-[11px] font-bold flex items-center justify-center border border-sidebar-primary/30 shrink-0">
            JS
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-semibold text-white truncate leading-tight">Jane Smith</p>
            <p className="text-[11px] text-sidebar-muted-foreground truncate leading-tight">RevOps Manager</p>
          </div>
          <button
            onClick={toggle}
            className="h-6 w-6 flex items-center justify-center rounded-md text-sidebar-muted-foreground hover:text-white hover:bg-white/8 transition-colors shrink-0"
            title={theme === "dark" ? "Light mode" : "Dark mode"}
          >
            {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
