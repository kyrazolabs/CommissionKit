import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, useEffect } from "react";

import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

import { Dashboard } from "@/pages/dashboard";
import { ReportsPage } from "@/pages/reports/reports";

import { PlansPage } from "@/pages/commission/plans";
import { DealsPage } from "@/pages/commission/deals";
import { RunsPage } from "@/pages/commission/runs";
import { RunDetailsPage } from "@/pages/commission/run-details";

import { RepPortal } from "@/pages/portal/rep-portal";
import { PublicRepPortal } from "@/pages/portal/public-portal";

import { SettingsPage } from "@/pages/settings/settings";
import { BillingPage } from "@/pages/settings/billing";

import { TeamPage } from "@/pages/team/team";
import { RepsPage } from "@/pages/team/reps";
import { AcceptInvite } from "@/pages/team/accept-invite";


import { AuthPage } from "@/pages/auth/auth";
import { ResetPasswordPage } from "@/pages/auth/reset-password";
import { EmailVerifiedPage } from "@/pages/auth/email-verified";

import { LandingPage } from "@/pages/landing";

import { PayoutsPage } from "@/pages/payouts/payouts";
import { DisputesPage } from "@/pages/payouts/disputes";

import { PrivacyPage } from "@/pages/legal/privacy";
import { TermsPage } from "@/pages/legal/terms";
import { SecurityPage } from "@/pages/legal/security";

import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { WorkspaceProvider, useWorkspace } from "@/hooks/use-workspace";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyCombobox } from "@/components/currency-combobox";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      refetchOnWindowFocus: false, // Prevents distracting background refetch on refocus
    },
  },
});

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sidebar">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col pr-3 pb-3 overflow-hidden" style={{ background: "hsl(var(--sidebar))" }}>
          <div className="bg-card rounded-2xl border border-card-border flex-1 flex flex-col overflow-hidden shadow-xs">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <main className="mx-auto p-8 lg:px-10 max-w-6xl min-h-full">
                {children}
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateWorkspaceScreen() {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      await createWorkspace(name.trim(), currency);
    } catch {
      setError("Failed to create workspace. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar px-4">
      <Card className="w-full max-w-sm border border-card-border rounded-2xl shadow-sm">
        <CardHeader className="pb-4">
          <div className="flex justify-center mb-4">
            <svg width="40" height="40" viewBox="0 0 56 56" fill="none">
              <rect width="56" height="56" rx="14" fill="#111827" />
              <line x1="16" y1="40" x2="40" y2="16" stroke="#0D9488" strokeWidth="3.5" strokeLinecap="round" />
              <circle cx="20" cy="20" r="5" fill="#0D9488" />
              <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" strokeWidth="3" />
              <circle cx="36" cy="36" r="2.5" fill="#0D9488" />
            </svg>
          </div>
          <CardTitle className="text-[18px] font-semibold text-center mb-1">Create your workspace</CardTitle>
          <CardDescription className="text-[13px] text-center">
            A workspace holds your team's reps, plans, and deals.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Workspace Name</Label>
              <Input
                type="text"
                placeholder="e.g. Acme Sales"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Currency</Label>
              <CurrencyCombobox value={currency} onChange={setCurrency} />
              <p className="text-xs text-muted-foreground">Used for all amount formatting.</p>
            </div>
            {error && <p className="text-[12px] text-destructive">{error}</p>}
            <Button
              type="submit"
              disabled={!name.trim() || creating}
              className="w-full font-semibold"
            >
              {creating ? "Creating…" : "Create workspace"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AppLoader() {
  return (

    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <style>{`
      @keyframes textShimmer {
    0% {
        background-position: 200% center;
    }
    100% {
        background-position: -200% center;
    }
}

.animate-shimmer-text {
    background: linear-gradient(
        90deg,
        currentColor 0%,
        color-mix(in srgb, currentColor, transparent 60%) 50%,
        currentColor 100%
    );
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: textShimmer 2s linear infinite;
}
@keyframes fadeInUpSmall {
    from {
        opacity: 0;
        transform: translateY(4px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-message-fade {
    animation: fadeInUpSmall 0.3s ease-out forwards;
}

.loader-container {
    interpolate-size: allow-keywords;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}
      `}</style>
      <div className="flex flex-col items-center gap-3">
        {/* <svg width="24" height="24" viewBox="11 11 34 34" fill="none" xmlns="http://www.w3.org/2000/svg">
          <line x1="16" y1="40" x2="40" y2="16" stroke="#0D9488" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="20" cy="20" r="5" fill="#0D9488"/>
          <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" stroke-width="3"/>
          <circle cx="36" cy="36" r="2.5" fill="#0D9488"/>
        </svg> */}
        <p className="text-base font-semibold animate-shimmer-text animate-pulse">Loading…</p>
      </div>
    </div>
  );
}

function PublicOrRedirectLanding() {
  const { session, loading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && session) {
      setLocation("/dash");
    }
  }, [session, loading, setLocation]);

  if (loading) return <AppLoader />;
  if (session) return <AppLoader />;

  return <LandingPage />;
}

function ProtectedRouter() {
  const { session, loading: authLoading } = useAuth();
  const { activeWorkspace, loading: wsLoading } = useWorkspace();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && session) {
      if (location === "/" || location === "" || location === "/home" || location === "/login" || location === "/register") {
        setLocation("/dash");
      }
    }
  }, [session, authLoading, location, setLocation]);

  if (authLoading) return <AppLoader />;
  if (!session) {
    if (location === "/" || location === "" || location === "/home") return <LandingPage />;
    if (location === "/register") return <AuthPage initialMode="signup" />;
    return <AuthPage initialMode="login" />;
  }

  if (location === "/login" || location === "/register" || location === "/home" || location === "/" || location === "") {
    return <AppLoader />;
  }
  if (wsLoading) return <AppLoader />;
  if (!activeWorkspace) return <CreateWorkspaceScreen />;

  return (
    <Layout>
      <Switch>
        <Route path="/dash" component={Dashboard} />
        <Route path="/dash/reps" component={RepsPage} />
        <Route path="/dash/plans" component={PlansPage} />
        <Route path="/dash/deals" component={DealsPage} />
        <Route path="/dash/runs" component={RunsPage} />
        <Route path="/dash/runs/:id" component={RunDetailsPage} />
        <Route path="/dash/reports" component={ReportsPage} />
        <Route path="/dash/reps/:id" component={RepPortal} />
        <Route path="/dash/team" component={TeamPage} />
        <Route path="/dash/settings" component={SettingsPage} />
        <Route path="/dash/billing" component={BillingPage} />
        <Route path="/dash/payouts" component={PayoutsPage} />
        <Route path="/dash/disputes" component={DisputesPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}


function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            {/* Public routes : no auth required directly here */}
            <Switch>
              <Route path="/portal/:accessCode" component={PublicRepPortal} />
              <Route path="/accept-invite" component={AcceptInvite} />
              <Route path="/home" component={() => (
                <AuthProvider>
                  <PublicOrRedirectLanding />
                </AuthProvider>
              )} />
              <Route path="/privacy" component={PrivacyPage} />
              <Route path="/terms" component={TermsPage} />
              <Route path="/security" component={SecurityPage} />
              <Route path="/forgot-password" component={() => (
                <AuthProvider>
                  <AuthPage initialMode="forgot" />
                </AuthProvider>
              )} />
              <Route path="/reset-password" component={() => (
                <AuthProvider>
                  <ResetPasswordPage />
                </AuthProvider>
              )} />
              <Route path="/email-verified" component={() => (
                <AuthProvider>
                  <EmailVerifiedPage />
                </AuthProvider>
              )} />
              <Route path="/login" component={() => (
                <AuthProvider>
                  <ProtectedRouter />
                </AuthProvider>
              )} />
              <Route path="/register" component={() => (
                <AuthProvider>
                  <ProtectedRouter />
                </AuthProvider>
              )} />
              <Route path="/" component={() => (
                <AuthProvider>
                  <PublicOrRedirectLanding />
                </AuthProvider>
              )} />
              {/* All other routes go through the authenticated provider stack */}
              <Route>
                <AuthProvider>
                  <WorkspaceProvider>
                    <ProtectedRouter />
                  </WorkspaceProvider>
                </AuthProvider>
              </Route>
            </Switch>
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
