import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Lock, Eye, EyeOff, Loader2, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { portalFetch, setPortalToken } from "@/lib/portal-fetch";

interface PortalAuthProps {
  accessCode: string;
  workspaceName?: string;
  onLogin: (username: string, password: string, mustChangePassword: boolean, workspaceName: string) => void;
}

export function PortalAuth({ accessCode, workspaceName, onLogin }: PortalAuthProps) {
  const { t } = useTranslation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const base = import.meta.env.VITE_API_URL ?? "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const res = await portalFetch(
        `${base}/api/portal/${encodeURIComponent(accessCode)}/login`,
        accessCode,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: username.trim(), password }),
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? t("portal.public.invalidCredentials") ?? "Login failed");
      }

      // Store token for subsequent authenticated requests
      setPortalToken(accessCode, data.token);

      // Notify parent — parent will handle refresh / password-change flow
      onLogin(username.trim(), password, data.mustChangePassword ?? false, data.workspaceName ?? "");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="w-full max-w-md border-card-border bg-card">
        <CardHeader className="space-y-1 text-center pb-2">
          <div className="mx-auto bg-primary/10 text-primary size-12 rounded-lg flex items-center justify-center mb-3">
            <Lock className="size-6" />
          </div>
          <CardTitle className="text-[20px] font-semibold tracking-tight text-foreground">
            {t("portal.public.securePortal")}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {t("portal.public.portalDescription")}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4 pt-4">
            {workspaceName && (
              <div className="text-xs text-muted-foreground text-center pb-1">
                <span className="font-medium text-foreground">{t("portal.public.workspace") ?? "Workspace"}: </span>
                <span>{workspaceName}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium text-foreground">
                {t("portal.public.username") ?? "Username"}
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t("portal.public.usernamePlaceholder") ?? "Enter your portal username"}
                required
                autoComplete="username"
                autoFocus
                className="bg-background border-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-foreground">
                {t("portal.public.password") ?? "Password"}
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t("portal.public.passwordPlaceholder")}
                  required
                  autoComplete="current-password"
                  className="bg-background border-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>
            {error && (
              <div className="text-sm font-medium text-destructive bg-destructive/10 p-3 rounded-md flex items-center gap-2">
                <ShieldAlert className="size-4 shrink-0" />
                {error}
              </div>
            )}
          </CardContent>
          <div className="px-6 pb-6">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !username.trim() || !password.trim()}
            >
              {isLoading ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : null}
              {t("portal.public.accessPortal")}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
