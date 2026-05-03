import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";
import { Dashboard } from "@/pages/dashboard";
import { RepsPage } from "@/pages/reps";
import { PlansPage } from "@/pages/plans";
import { DealsPage } from "@/pages/deals";
import { RunsPage } from "@/pages/runs";
import { RunDetailsPage } from "@/pages/run-details";
import { RepPortal } from "@/pages/rep-portal";
import { SettingsPage } from "@/pages/settings";
import { BillingPage } from "@/pages/billing";
import { LoginPage } from "@/pages/login";
import { ThemeProvider } from "@/hooks/use-theme";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { WorkspaceProvider, useWorkspace } from "@/hooks/use-workspace";
import { useState } from "react";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-sidebar">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 overflow-y-auto pr-[8px] pb-[8px]" style={{ background: "hsl(var(--sidebar))", padding: "0 4px 4px 0" }}>
          <div className="bg-card rounded-[18px] border border-card-border min-h-full shadow-xs">
            <main className="mx-auto py-8 px-8 lg:px-10 max-w-6xl">
              {children}
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateWorkspaceScreen() {
  const { createWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    setError("");
    try {
      await createWorkspace(name.trim());
    } catch {
      setError("Failed to create workspace. Please try again.");
      setCreating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar px-4">
      <div className="bg-card border border-card-border rounded-2xl shadow-sm w-full max-w-sm p-8">
        <div className="flex justify-center mb-6">
          <svg width="40" height="40" viewBox="0 0 56 56" fill="none">
            <rect width="56" height="56" rx="14" fill="#111827" />
            <line x1="16" y1="40" x2="40" y2="16" stroke="#0D9488" strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="20" cy="20" r="5" fill="#0D9488" />
            <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" strokeWidth="3" />
            <circle cx="36" cy="36" r="2.5" fill="#0D9488" />
          </svg>
        </div>
        <h1 className="text-[18px] font-bold text-foreground text-center mb-1">Create your workspace</h1>
        <p className="text-[13px] text-muted-foreground text-center mb-6">
          A workspace holds your team's reps, plans, and deals.
        </p>
        <form onSubmit={handleCreate} className="space-y-4">
          <input
            type="text"
            placeholder="e.g. Acme Sales"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-[14px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            autoFocus
          />
          {error && <p className="text-[12px] text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={!name.trim() || creating}
            className="w-full rounded-lg bg-primary text-primary-foreground px-4 py-2.5 text-[14px] font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {creating ? "Creating…" : "Create workspace"}
          </button>
        </form>
      </div>
    </div>
  );
}

function AppLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-sidebar">
      <div className="flex flex-col items-center gap-3">
        <svg width="40" height="40" viewBox="0 0 56 56" fill="none">
          <rect width="56" height="56" rx="14" fill="#111827" />
          <line x1="16" y1="40" x2="40" y2="16" stroke="#0D9488" strokeWidth="3.5" strokeLinecap="round" />
          <circle cx="20" cy="20" r="5" fill="#0D9488" />
          <circle cx="36" cy="36" r="7" fill="none" stroke="#0D9488" strokeWidth="3" />
          <circle cx="36" cy="36" r="2.5" fill="#0D9488" />
        </svg>
        <p className="text-sm text-muted-foreground animate-pulse">Loading…</p>
      </div>
    </div>
  );
}

function ProtectedRouter() {
  const { session, loading: authLoading } = useAuth();
  const { activeWorkspace, loading: wsLoading } = useWorkspace();

  if (authLoading) return <AppLoader />;
  if (!session) return <LoginPage />;
  if (wsLoading) return <AppLoader />;
  if (!activeWorkspace) return <CreateWorkspaceScreen />;

  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/reps" component={RepsPage} />
        <Route path="/plans" component={PlansPage} />
        <Route path="/deals" component={DealsPage} />
        <Route path="/runs" component={RunsPage} />
        <Route path="/runs/:id" component={RunDetailsPage} />
        <Route path="/reps/:id" component={RepPortal} />
        <Route path="/settings" component={SettingsPage} />
        <Route path="/billing" component={BillingPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <WorkspaceProvider>
          <QueryClientProvider client={queryClient}>
            <TooltipProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <ProtectedRouter />
              </WouterRouter>
              <Toaster />
            </TooltipProvider>
          </QueryClientProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
