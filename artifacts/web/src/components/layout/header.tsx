import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "@/components/notification-bell";

export function Header() {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";
  const displayName = user?.email ?? "";

  return (
    <header className="flex h-14 shrink-0 items-center bg-header px-5 z-10">
      {/* Logo — width matches sidebar */}
      <div className="flex w-[220px] shrink-0 items-center gap-2.5">
        <svg width="28" height="28" viewBox="0 0 56 56" fill="none" className="shrink-0">
          <rect width="56" height="56" rx="14" fill="#111827" />
          <line x1="16" y1="40" x2="40" y2="16" stroke="#0D9488" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="20" cy="20" r="5" fill="#0D9488" />
          <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" strokeWidth="3" />
          <circle cx="36" cy="36" r="2.5" fill="#0D9488" />
        </svg>
        <span className="text-[14.5px] font-bold tracking-tight text-foreground">
          Commission<span className="text-primary">Kit</span>
        </span>
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark"
            ? <Sun className="h-4 w-4" />
            : <Moon className="h-4 w-4" />}
        </button>

        {/* Live notification bell */}
        <NotificationBell />

        {/* Divider */}
        <div className="h-6 w-px bg-border mx-2" />

        {/* User avatar */}
        <div className="flex items-center gap-2 rounded-lg px-2 py-1.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
            {initials}
          </div>
          {displayName && (
            <span className="text-[13px] font-medium text-foreground max-w-[160px] truncate">
              {displayName}
            </span>
          )}
        </div>
      </div>
    </header>
  );
}
