import { Link, useLocation } from "wouter";
import { LayoutDashboard, Users, FileText, Briefcase, PlayCircle, LogOut, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Reps", href: "/reps", icon: Users },
  { name: "Plans", href: "/plans", icon: FileText },
  { name: "Deals", href: "/deals", icon: Briefcase },
  { name: "Runs", href: "/runs", icon: PlayCircle },
];

export function Sidebar() {
  const [location] = useLocation();

  return (
    <div className="flex h-full w-64 flex-col bg-sidebar border-r border-sidebar-border">
      <div className="flex h-14 items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="font-semibold tracking-tight text-sidebar-foreground">CommissionKit</span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                )}
              >
                <item.icon
                  className={cn(
                    "mr-3 h-5 w-5 flex-shrink-0 transition-colors",
                    isActive ? "text-primary" : "text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70"
                  )}
                  aria-hidden="true"
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="border-t border-sidebar-border p-4">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold border border-primary/20">
            JS
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">Jane Smith</span>
            <span className="text-xs text-sidebar-foreground/60">RevOps Manager</span>
          </div>
        </div>
      </div>
    </div>
  );
}
