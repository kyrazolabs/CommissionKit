import { useTheme } from "@/hooks/use-theme";
import { Sun, Moon, Bell, Shield, Users, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

export function SettingsPage() {
  const { theme, toggle } = useTheme();

  return (
    <div className="space-y-7 max-w-2xl">
      <div>
        <p className="text-[12px] font-semibold text-primary mb-1">Configuration</p>
        <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">Settings</h1>
        <p className="text-[14px] text-muted-foreground mt-1">Manage your workspace preferences.</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sun className="h-4 w-4 text-primary" /> Appearance
          </CardTitle>
          <CardDescription>Control how CommissionKit looks for you.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-sm font-medium">Theme</Label>
              <p className="text-sm text-muted-foreground mt-0.5">
                Currently using <span className="font-medium text-foreground">{theme === "dark" ? "dark" : "light"}</span> mode.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={toggle} className="gap-2">
              {theme === "dark"
                ? <><Sun className="h-4 w-4" /> Light mode</>
                : <><Moon className="h-4 w-4" /> Dark mode</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Workspace */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Building2 className="h-4 w-4 text-primary" /> Workspace
          </CardTitle>
          <CardDescription>Organisation-level settings for your team.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between py-1">
            <div>
              <p className="text-sm font-medium">Currency</p>
              <p className="text-sm text-muted-foreground">All amounts shown in USD.</p>
            </div>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">USD $</span>
          </div>
          <div className="flex items-center justify-between py-1 border-t border-border">
            <div>
              <p className="text-sm font-medium">Fiscal year start</p>
              <p className="text-sm text-muted-foreground">Used for YTD calculations.</p>
            </div>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">January</span>
          </div>
        </CardContent>
      </Card>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4 text-primary" /> Notifications
          </CardTitle>
          <CardDescription>Choose when you receive alerts.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "Commission run completed", desc: "Notify when a calculation run finishes." },
            { label: "New rep added",            desc: "Alert when a team member is created." },
            { label: "Clawback triggered",       desc: "Alert when a deal enters clawback." },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-1 border-b border-border last:border-0">
              <div>
                <p className="text-sm font-medium">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
              <div className="h-5 w-9 rounded-full bg-primary flex items-center justify-end pr-0.5 cursor-pointer">
                <div className="h-4 w-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4 text-primary" /> Security
          </CardTitle>
          <CardDescription>Account access and data controls.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Session timeout</p>
              <p className="text-sm text-muted-foreground">Automatically sign out after inactivity.</p>
            </div>
            <span className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded-md">8 hours</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
