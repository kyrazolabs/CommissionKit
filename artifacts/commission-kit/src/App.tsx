import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Sidebar } from "@/components/layout/sidebar";
import { Dashboard } from "@/pages/dashboard";
import { RepsPage } from "@/pages/reps";
import { PlansPage } from "@/pages/plans";
import { DealsPage } from "@/pages/deals";
import { RunsPage } from "@/pages/runs";
import { RunDetailsPage } from "@/pages/run-details";
import { RepPortal } from "@/pages/rep-portal";
import { ThemeProvider } from "@/hooks/use-theme";

const queryClient = new QueryClient();

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden bg-sidebar">
      <Sidebar />
      <div className="flex-1 overflow-y-auto pt-0 pl-0 pr-1 pb-1">
        <div className="rounded-2xl border border-border bg-card min-h-[calc(100%-0px)] shadow-xs">
          <main className="mx-auto py-8 px-6 lg:px-10 max-w-6xl">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function Router() {
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
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}

export default App;
