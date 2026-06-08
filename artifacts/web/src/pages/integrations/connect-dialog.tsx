import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/use-workspace";
import { ConnectorImage } from "./icons";
import { OdooConnectForm, HubspotConnectForm, CustomConnectForm } from "./connect-forms";
import type { Connector } from "./types";

interface Props {
  connector: Connector;
  isConnected: boolean;
}

export function ConnectDialog({ connector, isConnected }: Props) {
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const testMutation = useMutation({
    mutationFn: (data: { connectorName: string; config: Record<string, unknown> }) =>
      apiFetch(`/api/integrations/${activeWorkspace?.id}/test`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (d: any) => setTestResult(d),
  });

  const connectMutation = useMutation({
    mutationFn: (data: { connectorName: string; config: Record<string, unknown> }) =>
      apiFetch(`/api/integrations/${activeWorkspace?.id}/connect`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setOpen(false);
      setConnecting(false);
      setFormValues({});
      setTestResult(null);
    },
    onError: () => setConnecting(false),
  });

  const buildConfig = (): Record<string, unknown> => {
    const config: Record<string, unknown> = { entities: {} };
    for (const [k, v] of Object.entries(formValues)) {
      if (k.startsWith("auth") && !k.startsWith("authType") && k !== "authType") continue;
      if (k === "syncClosedOnly" || k === "writeBackEnabled") continue;
      config[k] = v;
    }
    if (!["hubspot"].includes(connector.name)) {
      const authType = String(formValues.authType || "bearer");
      const auth: Record<string, unknown> = { type: authType };
      if (authType === "apiKey") {
        auth.headerName = formValues.authHeaderName || "X-API-Key";
        auth.apiKey = formValues.authApiKey || "";
      } else if (authType === "bearer") {
        auth.token = formValues.authToken || "";
      } else if (authType === "basic") {
        auth.username = formValues.authUsername || "";
        auth.password = formValues.authPassword || "";
      }
      config.auth = auth;
    }
    return config;
  };

  const handleTest = () => {
    setTesting(true);
    setTestResult(null);
    testMutation.mutate({ connectorName: connector.name, config: buildConfig() }, { onSettled: () => setTesting(false) });
  };

  const handleConnect = () => {
    setConnecting(true);
    connectMutation.mutate({ connectorName: connector.name, config: buildConfig() });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) {
        setFormValues({});
        setTestResult(null);
      }
    }}>
      <DialogTrigger asChild>
        <Button variant={isConnected ? "secondary" : "default"} className="w-full">
          {isConnected ? t("integrations.configure") : t("integrations.setUp")}
          <ArrowRight className="size-3.5 ml-1.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ConnectorImage name={connector.name} className="size-5 object-contain" />
            {t("integrations.connectTo")} {connector.displayName}
          </DialogTitle>
          <DialogDescription>
            {t("integrations.enterCredentials")} {connector.displayName} {t("integrations.credentialsHint")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {connector.name === "odoo" && <OdooConnectForm values={formValues} onChange={setFormValues} />}
          {connector.name === "custom" && <CustomConnectForm values={formValues} onChange={setFormValues} />}
          {connector.name === "hubspot" && <HubspotConnectForm values={formValues} onChange={setFormValues} />}

          {testResult && (
            <div className={cn("rounded-lg p-3 text-sm flex items-center gap-2",
              testResult.success ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" : "bg-destructive/10 text-destructive",
            )}>
              {testResult.success ? <CheckCircle2 className="size-4 shrink-0" /> : <XCircle className="size-4 shrink-0" />}
              {testResult.message || (testResult.success ? t("integrations.connectionSuccessful") : t("integrations.connectionFailed"))}
            </div>
          )}

          {connectMutation.isError && (
            <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {(connectMutation.error as Error)?.message || t("integrations.connectionFailed")}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" onClick={handleTest} disabled={testing} className="flex-1">
              {testing ? t("integrations.testing") : t("integrations.testConnection")}
            </Button>
            <Button onClick={handleConnect} disabled={connecting} className="flex-1">
              {connecting ? t("integrations.connecting") : t("integrations.connect")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
