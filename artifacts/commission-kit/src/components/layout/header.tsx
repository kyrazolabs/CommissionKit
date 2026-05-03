import { Bell, ChevronRight, TrendingUp, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="flex h-14 shrink-0 items-center bg-header px-5 z-10">
      {/* Logo — width matches sidebar */}
      <div className="flex w-[220px] shrink-0 items-center gap-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <TrendingUp className="h-3.5 w-3.5" />
        </div>
        <span className="text-[14.5px] font-bold tracking-tight text-foreground">
          CommissionKit
        </span>
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-4">
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

        {/* Bell */}
        <button className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors">
          <Bell className="h-4 w-4" />
        </button>

        {/* Divider */}
        <div className="h-6 w-px bg-border" />

        {/* User */}
        <div className="flex items-center gap-2 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-muted transition-colors">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-[11px] font-bold">
            JS
          </div>
          <span className="text-[13px] font-medium text-foreground">Jane Smith</span>
          <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
        </div>
      </div>
    </header>
  );
}
