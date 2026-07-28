import { Sun, Moon, Cloud, LifeBuoy, LoaderCircle, PanelLeftOpen } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";
import { useAuth } from "@/hooks/use-auth";
import { NotificationBell } from "@/components/notification-bell";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useIsMutating } from "@tanstack/react-query";
import { useSyncStore } from "@/hooks/use-sync-store";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Analytics } from "@/lib/analytics";

function SyncIndicator() {
  const isMutating = useIsMutating();
  const { hasSyncError, setSyncError } = useSyncStore();

  if (hasSyncError) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={() => setSyncError(false)}
            className="flex size-8 items-center justify-center rounded-lg text-destructive hover:bg-destructive/10 transition-colors relative"
          >
            <Cloud className="size-4" />
            <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="end">
          Sync error. Click to clear notification.
        </TooltipContent>
      </Tooltip>
    );
  }

  if (isMutating > 0) {
    return (
      <div className="flex items-center gap-1.5 mr-1">
        <LoaderCircle className="size-3.5 animate-spin text-amber-500 dark:text-amber-400" />
        <span className="text-xs text-muted-foreground">Saving...</span>
      </div>
    );
  }

  return null;
}

export function Header({ onToggleMobileSidebar, isMobile }: { onToggleMobileSidebar?: () => void; isMobile?: boolean }) {
  const { theme, toggle } = useTheme();
  const { user } = useAuth();

  const handleThemeToggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    Analytics.themeToggled(next);
    toggle();
  };

  const initials = user?.email
    ? user.email.slice(0, 2).toUpperCase()
    : "??";
  const displayName = user?.email ?? "";

  return (
    <header className="flex h-14 shrink-0 items-center bg-header px-5 z-10">
      {/* Mobile sidebar toggle */}
      {isMobile && (
        <button
          onClick={onToggleMobileSidebar}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors mr-2 -ml-2"
        >
          <PanelLeftOpen className="size-4" />
        </button>
      )}

      {/* Logo : width matches sidebar */}
      <a href="/dash" className="flex items-center gap-2">
        <img src="/brand/logo-symbol.svg" alt="CommissionKit Logo" className="h-6" />
        <span className="text-lg font-bold text-foreground tracking-tight">Commission<span className="text-primary">Kit</span></span>
      </a>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-2">
        {/* Sync Status Indicator */}
        <SyncIndicator />

        {/* Support */}
        <Tooltip>
          <TooltipTrigger asChild>
            <a
              href="mailto:support@commissionkit.co"
              className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              title="Contact support"
            >
              <LifeBuoy className="size-4" />
            </a>
          </TooltipTrigger>
          <TooltipContent side="bottom" align="end">
            Contact support
          </TooltipContent>
        </Tooltip>

        {/* Theme toggle */}
        <button
          onClick={handleThemeToggle}
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          title={theme === "dark" ? "Light mode" : "Dark mode"}
        >
          {theme === "dark"
            ? <Sun className="size-4" />
            : <Moon className="size-4" />}
        </button>

        {/* Language switcher */}
        <LanguageSwitcher />

        {/* Live notification bell */}
        <NotificationBell />
      </div>
    </header>
  );
}
