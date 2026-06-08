import { useState, useRef, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Bug, BadgeCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
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
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [visibleCards, setVisibleCards] = useState(1);
  const trackRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [slidePx, setSlidePx] = useState(0);

  useEffect(() => {
    const update = () => {
      if (cardRef.current) setSlidePx(cardRef.current.offsetWidth + 16);
      setVisibleCards(window.innerWidth >= 768 ? 2 : 1);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

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

  const sortedConnectors = connectors?.connectors?.slice().sort((a, b) => {
    const aConnected = status?.connectorName === a.name ? 0 : 1;
    const bConnected = status?.connectorName === b.name ? 0 : 1;
    const aCustom = a.name === "custom" ? 2 : aConnected;
    const bCustom = b.name === "custom" ? 2 : bConnected;
    return aCustom - bCustom;
  });

  const maxIndex = Math.max(0, (sortedConnectors?.length || 1) - visibleCards);

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
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">{status?.connected ? "Switch Connector" : "Choose a Connector"}</h2>
          {sortedConnectors && sortedConnectors.length > 1 && (
            <div className="flex gap-1">
              <button onClick={() => setCarouselIndex((i) => Math.max(0, i - 1))} disabled={carouselIndex === 0} className="flex size-8 items-center justify-center rounded-lg border hover:bg-muted disabled:opacity-30 transition-colors">
                <ChevronLeft className="size-4" />
              </button>
              <button onClick={() => setCarouselIndex((i) => Math.min(maxIndex, i + 1))} disabled={carouselIndex >= maxIndex} className="flex size-8 items-center justify-center rounded-lg border hover:bg-muted disabled:opacity-30 transition-colors">
                <ChevronRight className="size-4" />
              </button>
            </div>
          )}
        </div>
        <div className="overflow-hidden" ref={trackRef}>
          <motion.div
            className="flex gap-4"
            animate={{ x: -carouselIndex * slidePx }}
            transition={{ type: "tween", duration: 0.35, ease: "easeInOut" }}
          >
            {sortedConnectors?.map((connector, i) => (
              <motion.div
                key={connector.name}
                ref={i === 0 ? cardRef : undefined}
                animate={{ opacity: i >= carouselIndex && i < carouselIndex + visibleCards ? 1 : 0.4 }}
                transition={{ duration: 0.35 }}
                className="w-full min-w-full md:min-w-[calc(50%-8px)]"
              >
                <ConnectorCard connector={connector} isConnected={status?.connectorName === connector.name} />
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      {!status?.connected && (
        <a
          href="mailto:sales@commissionk.it?subject=Custom Connector Request"
          className="block w-full rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 px-5 py-4 hover:from-primary/15 hover:to-primary/10 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/20">
              <BadgeCheck className="size-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">Need a custom connector?</p>
              <p className="text-xs text-muted-foreground mt-0.5">We build integrations for any ERP or CRM. Contact sales to get started.</p>
            </div>
            <span className="ml-auto text-xs font-medium text-primary group-hover:underline">Contact sales</span>
          </div>
        </a>
      )}

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
