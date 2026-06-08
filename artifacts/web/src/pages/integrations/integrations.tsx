import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Bug } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ConnectorCard } from "./connector-card";
import { ConnectedCard } from "./connected-card";
import { MappingDialog } from "./mapping-dialog";
import { StageMappingDialog } from "./stage-mapping-dialog";
import type { Connector, ConnectionStatus } from "./types";

export function IntegrationsPage() {
  usePageMeta({ title: "Integrations", description: "Connect CommissionKit to your ERP or CRM.", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const { hasPermission } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [mappingOpen, setMappingOpen] = useState(false);
  const [mappingJson, setMappingJson] = useState("");
  const [mappingError, setMappingError] = useState<string | null>(null);
  const [stageMappingOpen, setStageMappingOpen] = useState(false);

  const { data: connectors, isLoading: connectorsLoading } = useQuery<{ connectors: Connector[] }>({
    queryKey: ["integrations", "connectors"],
    queryFn: () => apiFetch("/api/integrations/connectors"),
  });

  const { data: status, isLoading: statusLoading } = useQuery<ConnectionStatus>({
    queryKey: ["integrations", "status", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/integrations/${activeWorkspace?.id}/status`),
    enabled: !!activeWorkspace?.id,
  });

  const openMappingEditor = async () => {
    try {
      const data = await apiFetch(`/api/integrations/${activeWorkspace?.id}/config`);
      setMappingJson(JSON.stringify(data?.config || data, null, 2));
    } catch {
      setMappingJson(JSON.stringify({
        baseUrl: "", auth: { type: "bearer", token: "" },
        entities: {
          reps: { enabled: false, endpoint: "", fields: { externalId: "id", name: "name", email: "email" } },
          deals: { enabled: false, endpoint: "", fields: { externalId: "id", name: "name", amount: "amount", closeDate: "closeDate" } },
        },
      }, null, 2));
    }
    setMappingError(null);
    setMappingOpen(true);
  };

  const isLoading = connectorsLoading || statusLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" /><Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!hasPermission("workspace", "read")) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Card><CardContent className="py-8 text-center"><p className="text-muted-foreground">{t("common.accessDenied")}</p></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-baseline gap-2">
          Integrations <span className="text-base px-1 tracking-[0.07em] font-medium text-primary">Beta</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Connect CommissionKit to your ERP or CRM. Synced reps and deals are ready for commission calculation.</p>
      </div>

      {status?.connected && (
        <ConnectedCard
          status={status}
          onOpenMappingEditor={openMappingEditor}
          onOpenStageMapping={() => setStageMappingOpen(true)}
        />
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">{status?.connected ? "Switch Connector" : "Choose a Connector"}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectors?.connectors?.map((connector) => (
            <ConnectorCard key={connector.name} connector={connector} isConnected={status?.connectorName === connector.name} />
          ))}
        </div>
      </div>

      <div className="mt-8 pt-6 border-t border-border">
        <a href="mailto:support@commissionk.it?subject=Integration Bug Report" className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <Bug className="size-3.5" />Report a bug or request a connector
        </a>
      </div>

      <MappingDialog open={mappingOpen} onOpenChange={setMappingOpen} json={mappingJson} onJsonChange={setMappingJson} error={mappingError} onErrorChange={setMappingError} />
      <StageMappingDialog open={stageMappingOpen} onOpenChange={setStageMappingOpen} />
    </div>
  );
}
