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
      {/* Logo : width matches sidebar */}
      <a href="/home" className="flex items-center gap-2">
        <img src="/brand/logo-symbol.svg" alt="CommissionKit Logo" className="h-6" />
        <span className="text-lg font-bold text-foreground tracking-tight">Commission<span className="text-primary">Kit</span></span>
      </a>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark"
            ? <Sun className="size-4" />
            : <Moon className="size-4" />}
        </button>

        {/* Live notification bell */}
        <NotificationBell />
      </div>
    </header>
  );
}
