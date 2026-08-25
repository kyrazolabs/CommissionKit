import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useTranslation } from "react-i18next";
import { Route, Switch, useLocation, useParams, Router as WouterRouter } from "wouter";
import { CurrencyCombobox } from "@/components/currency-combobox";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { SettingsDialog } from "@/components/settings/settings-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { usePageTrack } from "@/hooks/use-page-track";
import { ThemeProvider } from "@/hooks/use-theme";
import { useWorkspace, WorkspaceProvider } from "@/hooks/use-workspace";
import { Analytics } from "@/lib/analytics";
import { cn } from "@/lib/utils";
import AuditLogPage from "@/pages/audit-log/audit-log";
import { AuthPage } from "@/pages/auth/auth";
import { EmailVerifiedPage } from "@/pages/auth/email-verified";
import { ResetPasswordPage } from "@/pages/auth/reset-password";
import { CareersPage } from "@/pages/careers";
import { CareersJobPage } from "@/pages/careers-job";
import { DealsPage } from "@/pages/commission/deals";
import { PlansPage } from "@/pages/commission/plans";
import { RunDetailsPage } from "@/pages/commission/run-details";
import { RunsPage } from "@/pages/commission/runs";
import { CommissionCalculator } from "@/pages/commission-calculator";
import { ContactPage } from "@/pages/contact";
import { Dashboard } from "@/pages/dashboard";
import { AissolMatrixPage } from "@/pages/enterprise/aissol/matrix";
import { AissolProjectDetailPage } from "@/pages/enterprise/aissol/project-detail";
import { AissolProjectsPage } from "@/pages/enterprise/aissol/projects";
import { EnterprisePublicRepPortal } from "@/pages/enterprise/aissol/public-portal";
import { EnterpriseRepPortal } from "@/pages/enterprise/aissol/rep-portal";
import { AissolReportsPage } from "@/pages/enterprise/aissol/reports";
import { EnterpriseRunDetailsPage } from "@/pages/enterprise/aissol/run-details";
import { EnterpriseRunsPage } from "@/pages/enterprise/aissol/runs";
import { FeaturesPage } from "@/pages/features";
import { CustomIntegrationPage } from "@/pages/integrations/custom";
import { HubspotIntegrationPage } from "@/pages/integrations/hubspot";
import { IntegrationsPage } from "@/pages/integrations/integrations";
import { OdooIntegrationPage } from "@/pages/integrations/odoo";
import { SalesforceIntegrationPage } from "@/pages/integrations/salesforce";
import { LandingPage } from "@/pages/landing";
import { PrivacyPage } from "@/pages/legal/privacy";
import { SecurityPage } from "@/pages/legal/security";
import { TermsPage } from "@/pages/legal/terms";
import NotFound from "@/pages/not-found";
import { DisputesPage } from "@/pages/payouts/disputes";
import { PayoutsPage } from "@/pages/payouts/payouts";
import { PublicRepPortal } from "@/pages/portal/public-portal";
import { RepPortal } from "@/pages/portal/rep-portal";
import { PricingPage } from "@/pages/pricing";
import { RepPortalLanding } from "@/pages/rep-portal-landing";
import { ReportsPage } from "@/pages/reports/reports";
import { BillingPage } from "@/pages/settings/billing";
import { SolutionsPage } from "@/pages/solutions";
import { AcceptInvite } from "@/pages/team/accept-invite";
import { RepsPage } from "@/pages/team/reps";
import { TeamPage } from "@/pages/team/team";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 0, // Always refetch for fresh data
      gcTime: 1000 * 60 * 10,
      refetchOnWindowFocus: true,
    },
  },
});

function SettingsRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/dash", { replace: true });
  }, [navigate]);
  return null;
}

function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const isMobile = useIsMobile();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location]);

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sidebar">
      <Header onToggleMobileSidebar={() => setMobileSidebarOpen(true)} isMobile={isMobile} />
      <SettingsDialog />
      <div className="flex flex-1 overflow-hidden">
        {isMobile ? (
          <>
            {/* Backdrop — always rendered, transitions opacity */}
            <div
              className={cn(
                "fixed inset-0 z-40 bg-black/50 transition-opacity duration-200",
                mobileSidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none",
              )}
              onClick={() => setMobileSidebarOpen(false)}
            />
            {/* Sliding sidebar — always rendered, transitions transform */}
            <div
              className={cn(
                "fixed inset-y-0 left-0 z-50 w-55 transition-transform duration-200",
                mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
              )}
            >
              <Sidebar onCloseMobile={() => setMobileSidebarOpen(false)} isMobile />
            </div>
          </>
        ) : (
          <Sidebar />
        )}
        <div
          className="flex-1 flex flex-col ltr:pr-3 rtl:pl-3 pb-3 overflow-hidden"
          style={{ background: "hsl(var(--sidebar))" }}
        >
          <div className="bg-card rounded-2xl border border-card-border flex-1 flex flex-col overflow-hidden shadow-xs">
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <main className="mx-auto px-6 py-6 lg:px-10 lg:py-8 max-w-6xl min-h-full">
                <motion.div
                  key={location}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, ease: [0.34, 1.56, 0.64, 1] }}
                >
                  {children}
                </motion.div>
              </main>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateWorkspaceScreen() {
  const { t } = useTranslation();
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Analytics.workspaceCreateView();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      const ws = await createWorkspace(name.trim(), currency);
      Analytics.workspaceCreated(ws.commissionEngine);
    } catch {
      Analytics.workspaceCreateFailed();
      setError(t("createWorkspace.failedToCreate"));
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
              <line
                x1="16"
                y1="40"
                x2="40"
                y2="16"
                stroke="#0D9488"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="20" cy="20" r="5" fill="#0D9488" />
              <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" strokeWidth="3" />
              <circle cx="36" cy="36" r="2.5" fill="#0D9488" />
            </svg>
          </div>
          <CardTitle className="text-[18px] font-semibold text-center mb-1">
            {t("createWorkspace.title")}
          </CardTitle>
          <CardDescription className="text-[13px] text-center">
            {t("createWorkspace.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("createWorkspace.workspaceName")}</Label>
              <Input
                type="text"
                placeholder={t("createWorkspace.workspaceNamePlaceholder")}
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">{t("createWorkspace.currency")}</Label>
              <CurrencyCombobox value={currency} onChange={setCurrency} />
              <p className="text-xs text-muted-foreground">{t("createWorkspace.currencyHelp")}</p>
            </div>
            {error && <p className="text-[12px] text-destructive">{error}</p>}
            <Button
              type="submit"
              disabled={!name.trim() || creating}
              className="w-full font-semibold"
            >
              {creating ? t("createWorkspace.creating") : t("createWorkspace.createWorkspace")}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function AppLoader() {
  const { t } = useTranslation();
  const messages = [
    t("appLoader.calculatingCommissions"),
    t("appLoader.roundingUpReps"),
    t("appLoader.crunchingNumbers"),
    t("appLoader.preparingWorkspace"),
    t("appLoader.loadingDashboard"),
    t("appLoader.almostThere"),
  ];
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % messages.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <div className="h-5 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.p
            key={idx}
            initial={{ y: 16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -16, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-muted-foreground"
          >
            {messages[idx]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}

function PublicOrRedirectLanding() {
  return <LandingPage />;
}

function EnterprisePlansGuard() {
  const { activeWorkspace } = useWorkspace();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (activeWorkspace?.commissionEngine && activeWorkspace.commissionEngine !== "standard") {
      setLocation("/dash/enterprise/matrix");
    }
  }, [activeWorkspace?.commissionEngine]);
  if (!activeWorkspace || activeWorkspace?.commissionEngine !== "standard") return null;
  return <PlansPage />;
}

function EnterpriseDealsGuard() {
  const { activeWorkspace } = useWorkspace();
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (activeWorkspace?.commissionEngine && activeWorkspace.commissionEngine !== "standard") {
      setLocation("/dash/enterprise/projects");
    }
  }, [activeWorkspace?.commissionEngine]);
  if (!activeWorkspace || activeWorkspace?.commissionEngine !== "standard") return null;
  return <DealsPage />;
}

function EnterpriseRunsListGuard() {
  const { activeWorkspace } = useWorkspace();
  if (!activeWorkspace || activeWorkspace?.commissionEngine !== "standard")
    return <EnterpriseRunsPage />;
  return <RunsPage />;
}

function EnterpriseRunsGuard() {
  const { activeWorkspace } = useWorkspace();
  if (!activeWorkspace || activeWorkspace?.commissionEngine !== "standard")
    return <EnterpriseRunDetailsPage />;
  return <RunDetailsPage />;
}

function EnterpriseRepPortalGuard() {
  const { activeWorkspace } = useWorkspace();
  if (!activeWorkspace || activeWorkspace?.commissionEngine !== "standard")
    return <EnterpriseRepPortal />;
  return <RepPortal />;
}

function ProtectedRouter() {
  const { session, loading: authLoading } = useAuth();
  const { activeWorkspace, loading: wsLoading } = useWorkspace();
  const [location, setLocation] = useLocation();
  const [initialLoadDone, setInitialLoadDone] = useState(false);

  useEffect(() => {
    if (!authLoading && session) {
      if (location === "/login" || location === "/register") {
        setLocation("/dash");
      }
    }
  }, [session, authLoading, location, setLocation]);

  // Show full-screen loader only on first load, not on background refetches
  useEffect(() => {
    if (!authLoading && !wsLoading) setInitialLoadDone(true);
  }, [authLoading, wsLoading]);

  // Render public pages immediately (no auth-wait flash that would replace pre-rendered HTML)
  if (!session) {
    if (authLoading) return <AppLoader />;
    if (location === "/register") return <AuthPage initialMode="signup" />;
    if (location === "/login") return <AuthPage initialMode="login" />;
    if (location === "/" || location === "" || location === "/home") return <LandingPage />;
    return <AuthPage initialMode="login" />;
  }

  if (authLoading || (wsLoading && !initialLoadDone)) return <AppLoader />;
  if (!activeWorkspace) return <CreateWorkspaceScreen />;
  if (location === "/login" || location === "/register") return <AppLoader />;

  return (
    <Layout>
      <Switch>
        <Route path="/dash/enterprise/projects" component={AissolProjectsPage} />
        <Route path="/dash/enterprise/projects/:id" component={AissolProjectDetailPage} />
        <Route path="/dash/enterprise/matrix" component={AissolMatrixPage} />
        <Route path="/dash/enterprise/reports" component={AissolReportsPage} />
        <Route path="/dash" component={Dashboard} />
        <Route path="/dash/reps" component={RepsPage} />
        <Route path="/dash/plans" component={EnterprisePlansGuard} />
        <Route path="/dash/deals" component={EnterpriseDealsGuard} />
        <Route path="/dash/runs" component={EnterpriseRunsListGuard} />
        <Route path="/dash/runs/:id" component={EnterpriseRunsGuard} />
        <Route path="/dash/reports" component={ReportsPage} />
        <Route path="/dash/reps/:id" component={EnterpriseRepPortalGuard} />
        <Route path="/dash/team" component={TeamPage} />
        <Route path="/dash/settings" component={SettingsRedirect} />
        <Route path="/dash/billing" component={BillingPage} />
        <Route path="/dash/payouts" component={PayoutsPage} />
        <Route path="/dash/disputes" component={DisputesPage} />
        <Route path="/dash/audit-log" component={AuditLogPage} />
        <Route path="/dash/integrations" component={IntegrationsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

/**
 * Sets the per-page <link rel="canonical"> via react-helmet-async.
 * Normalises /home → / to avoid duplicate-canonical issues in search consoles.
 */
function CanonicalTag() {
  const [location] = useLocation();
  const canonicalPath = (location === "/home" ? "/" : location).replace(/\/$/, "");
  return (
    <Helmet>
      <link rel="canonical" href={`https://commissionkit.co${canonicalPath}`} />
    </Helmet>
  );
}

function PageTracker() {
  usePageTrack();
  return null;
}

function App() {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <CanonicalTag />
            <PageTracker />
            {/* Public routes : no auth required directly here */}
            <Switch>
              <Route
                path="/portal/:accessCode"
                component={() => {
                  const { accessCode } = useParams();
                  const token = localStorage.getItem(`ck_portal_${accessCode}`);
                  let engine = "standard";
                  if (token) {
                    try {
                      engine = JSON.parse(atob(token.split(".")[1])).commissionEngine || "standard";
                    } catch {}
                  }
                  return engine !== "standard" ? (
                    <EnterprisePublicRepPortal />
                  ) : (
                    <PublicRepPortal />
                  );
                }}
              />
              <Route path="/portal" component={RepPortalLanding} />
              <Route path="/accept-invite" component={AcceptInvite} />
              <Route
                path="/home"
                component={() => (
                  <AuthProvider>
                    <PublicOrRedirectLanding />
                  </AuthProvider>
                )}
              />
              <Route path="/calculator" component={CommissionCalculator} />
              <Route path="/privacy" component={PrivacyPage} />
              <Route path="/terms" component={TermsPage} />
              <Route path="/security" component={SecurityPage} />
              <Route path="/contact" component={ContactPage} />
              <Route path="/features" component={FeaturesPage} />
              <Route path="/solutions" component={SolutionsPage} />
              <Route path="/pricing" component={PricingPage} />
              <Route path="/integrations/odoo" component={OdooIntegrationPage} />
              <Route path="/integrations/hubspot" component={HubspotIntegrationPage} />
              <Route path="/integrations/salesforce" component={SalesforceIntegrationPage} />
              <Route path="/integrations/custom" component={CustomIntegrationPage} />
              <Route path="/careers/:slug" component={CareersJobPage} />
              <Route path="/careers" component={CareersPage} />
              <Route
                path="/forgot-password"
                component={() => (
                  <AuthProvider>
                    <AuthPage initialMode="forgot" />
                  </AuthProvider>
                )}
              />
              <Route
                path="/reset-password"
                component={() => (
                  <AuthProvider>
                    <ResetPasswordPage />
                  </AuthProvider>
                )}
              />
              <Route
                path="/email-verified"
                component={() => (
                  <AuthProvider>
                    <EmailVerifiedPage />
                  </AuthProvider>
                )}
              />
              <Route
                path="/login"
                component={() => (
                  <AuthProvider>
                    <ProtectedRouter />
                  </AuthProvider>
                )}
              />
              <Route
                path="/register"
                component={() => (
                  <AuthProvider>
                    <ProtectedRouter />
                  </AuthProvider>
                )}
              />
              <Route
                path="/"
                component={() => (
                  <AuthProvider>
                    <PublicOrRedirectLanding />
                  </AuthProvider>
                )}
              />
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
