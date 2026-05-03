import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Users, FileText, Briefcase, PlayCircle,
  Search, Settings
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    label: "Settings",
    items: [
      { name: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function Sidebar() {
  const [location] = useLocation();

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

      {/* Search at bottom */}
      <div className="px-3 pb-4 pt-3">
        <button className="w-full flex items-center gap-2 rounded-[10px] px-2.5 py-2 bg-muted cursor-pointer hover:bg-muted/80 transition-colors">
          <Search className="h-[13px] w-[13px] text-sidebar-muted-foreground shrink-0" />
          <span className="flex-1 text-left text-[12.5px] text-sidebar-muted-foreground">Search...</span>
          <kbd className="text-[10.5px] text-muted-foreground bg-border rounded px-1.5 py-0.5 font-mono">⌘K</kbd>
        </button>
      </div>
    </div>
  );
}
