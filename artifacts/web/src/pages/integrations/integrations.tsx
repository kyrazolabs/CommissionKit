import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell,
  TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plug, Sprout, Cable, CheckCircle2, XCircle,
  AlertTriangle, RefreshCw, Trash2, ArrowRight, Ellipsis, LoaderCircle, Bug, FileCode, GitBranch,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const CONNECTOR_ICONS: Record<string, any> = {
  custom: Cable,
  hubspot: Sprout,
};

const ICON_SRC: Record<string, string> = {
  odoo: "/plugins/odoo.webp",
  hubspot: "/plugins/hubspot.webp",
};

function ConnectorImage({ name, className }: { name: string; className?: string }) {
  const src = ICON_SRC[name];
  if (src) {
    return <img src={src} alt={name} className={className} />;
  }
  const Icon = CONNECTOR_ICONS[name] || Plug;
  return <Icon className={className} />;
}

interface Connector {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  category: string;
  features: string[];
  version: string;
}

interface ConnectionStatus {
  connected: boolean;
  connectorName?: string;
  connectorDisplayName?: string;
  status?: string;
  lastSyncedAt?: string;
  syncSchedule?: { reps: string; deals: string };
  writeBackEnabled?: boolean;
  lastError?: string;
  recentSyncs?: Array<{
    id: string;
    entityType: string;
    status: string;
    trigger: string;
    stats: { total: number; created: number; updated: number; skipped: number; failed: number };
    completedAt: string;
  }>;
}

export function IntegrationsPage() {
  usePageMeta({ title: "Integrations", description: "Connect CommissionKit to your ERP or CRM.", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const { hasPermission } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [selectedConnector, setSelectedConnector] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Form state
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
  const [mappingOpen, setMappingOpen] = useState(false);
  const [mappingJson, setMappingJson] = useState("");
  const [mappingError, setMappingError] = useState<string | null>(null);

  const [stageMappingOpen, setStageMappingOpen] = useState(false);
  const [stageOptions, setStageOptions] = useState<Array<{ id: string; label: string; pipeline: string }>>([]);
  const [stageMapping, setStageMapping] = useState<Record<string, string>>({});
  const [stageMappingLoading, setStageMappingLoading] = useState(false);

  const { data: connectors, isLoading: connectorsLoading } = useQuery<{ connectors: Connector[] }>({
    queryKey: ["integrations", "connectors"],
    queryFn: () => apiFetch("/api/integrations/connectors"),
  });

  const { data: status, isLoading: statusLoading } = useQuery<ConnectionStatus>({
    queryKey: ["integrations", "status", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/integrations/${activeWorkspace?.id}/status`),
    enabled: !!activeWorkspace?.id,
    refetchInterval: 10000,
    refetchOnWindowFocus: false,
  });

  const testMutation = useMutation({
    mutationFn: (data: { connectorName: string; config: Record<string, unknown> }) =>
      apiFetch(`/api/integrations/${activeWorkspace?.id}/test`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: (data: any) => {
      setTestResult(data);
    },
  });

  const connectMutation = useMutation({
    mutationFn: (data: { connectorName: string; config: Record<string, unknown> }) =>
      apiFetch(`/api/integrations/${activeWorkspace?.id}/connect`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setSelectedConnector(null);
      setConnecting(false);
      setFormValues({});
      setTestResult(null);
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/integrations/${activeWorkspace?.id}/disconnect`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Disconnected", description: "Integration has been disconnected." });
    },
  });

  const syncRepsMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/integrations/${activeWorkspace?.id}/sync/reps`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Sync started", description: "Rep sync has been enqueued." });
    },
  });

  const syncDealsMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/integrations/${activeWorkspace?.id}/sync/deals`, { method: "POST" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      toast({ title: "Sync started", description: "Deal sync has been enqueued." });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: (schedule: { reps: string; deals: string }) =>
      apiFetch(`/api/integrations/${activeWorkspace?.id}/config`, {
        method: "PATCH",
        body: JSON.stringify({ syncSchedule: schedule }),
      }),
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      const labels: Record<string, string> = { realtime: "Every 10 min", hourly: "Hourly", daily: "Daily", manual: "Manual only" };
      toast({ title: "Auto sync updated", description: `Now syncing ${labels[vars.reps] || vars.reps}.` });
    },
  });

  const configMutation = useMutation({
    mutationFn: (config: Record<string, unknown>) =>
      apiFetch(`/api/integrations/${activeWorkspace?.id}/config`, {
        method: "PATCH",
        body: JSON.stringify({ config }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["integrations"] });
      setMappingOpen(false);
      toast({ title: "Mapping saved", description: "Connector configuration updated." });
    },
    onError: (err: Error) => {
      setMappingError(err.message);
    },
  });

  const openStageMapping = async () => {
    setStageMappingLoading(true);
    setStageMappingOpen(true);
    try {
      const data = await apiFetch(`/api/integrations/${activeWorkspace?.id}/hubspot/stages`);
      setStageOptions(data.stages || []);
      setStageMapping(data.mapping || {});
    } catch {
      setStageOptions([]);
      setStageMapping({});
    } finally {
      setStageMappingLoading(false);
    }
  };

  const saveStageMapping = async () => {
    try {
      await apiFetch(`/api/integrations/${activeWorkspace?.id}/hubspot/stages`, {
        method: "PATCH",
        body: JSON.stringify({ mapping: stageMapping }),
      });
      setStageMappingOpen(false);
      toast({ title: "Stage mapping saved" });
    } catch (err: any) {
      toast({ title: "Failed to save", description: err.message, variant: "destructive" });
    }
  };

  const openMappingEditor = async () => {
    try {
      const data = await apiFetch(`/api/integrations/${activeWorkspace?.id}/config`);
      setMappingJson(JSON.stringify(data?.config || data, null, 2));
    } catch {
      setMappingJson(JSON.stringify({
        baseUrl: "",
        auth: { type: "bearer", token: "" },
        entities: {
          reps: { enabled: false, endpoint: "", fields: { externalId: "id", name: "name", email: "email" } },
          deals: { enabled: false, endpoint: "", fields: { externalId: "id", name: "name", amount: "amount", closeDate: "closeDate" } },
        },
      }, null, 2));
    }
    setMappingError(null);
    setMappingOpen(true);
  };

  const saveMapping = () => {
    setMappingError(null);
    try {
      const parsed = JSON.parse(mappingJson);
      // Unwrap "config" key if user pasted the full API payload
      const config = parsed.config || parsed;
      configMutation.mutate(config);
    } catch (e: any) {
      setMappingError(e.message || "Invalid JSON");
    }
  };

  const syncPending = syncRepsMutation.isPending || syncDealsMutation.isPending;

  const handleTest = async (connectorName: string) => {
    setTesting(true);
    setTestResult(null);
    const config = buildConfig();
    testMutation.mutate({ connectorName, config }, { onSettled: () => setTesting(false) });
  };

  const handleConnect = async (connectorName: string) => {
    setConnecting(true);
    const config = buildConfig();
    connectMutation.mutate({ connectorName, config }, { onSettled: () => setConnecting(false) });
  };

  const buildConfig = (): Record<string, unknown> => {
    const config: Record<string, unknown> = {
      entities: {},
    };
    for (const [k, v] of Object.entries(formValues)) {
      if (k.startsWith("auth") && !k.startsWith("authType") && k !== "authType") continue;
      if (k === "syncClosedOnly" || k === "writeBackEnabled") continue;
      config[k] = v;
    }
    // Build auth object
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
    return config;
  };

  const isLoading = connectorsLoading || statusLoading;

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-96" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-48" />
        </div>
      </div>
    );
  }

  if (!hasPermission("workspace", "read")) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-8">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">{t("common.accessDenied")}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const ConnectorIcon = status?.connected
    ? CONNECTOR_ICONS[status.connectorName || ""] || Plug
    : null;

  const connectorImgSrc = status?.connected ? ICON_SRC[status.connectorName || ""] : null;

  return (
    <div className="mx-auto max-w-4xl px-6 py-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-baseline gap-2">
          Integrations
          <span className="text-base px-1 tracking-[0.07em] font-medium text-primary">Beta</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Connect CommissionKit to your ERP or CRM. Synced reps and deals are ready for commission calculation.
        </p>
      </div>

      {/* Connection status */}
      {status?.connected && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {connectorImgSrc && (
                  <div className="flex size-10 items-center justify-center rounded-xl bg-teal-600/10 p-1.5">
                    <img src={connectorImgSrc} alt={status.connectorName} className="size-full object-contain" />
                  </div>
                )}
                {!connectorImgSrc && ConnectorIcon && (
                  <div className="flex size-10 items-center justify-center rounded-xl bg-teal-600/10 text-teal-600">
                    <ConnectorIcon className="size-5" />
                  </div>
                )}
                <div>
                  <CardTitle className="text-base">
                    Connected to {status.connectorDisplayName || status.connectorName}
                  </CardTitle>
                  <CardDescription>
                    {status.status === "connected" ? (
                      <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        Connected
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-amber-600">
                        <AlertTriangle className="size-3.5" />
                        {status.status}
                      </span>
                    )}
                  </CardDescription>
                </div>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-9 w-9 p-0">
                    <Ellipsis className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
                    Actions
                  </DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() => syncRepsMutation.mutate()}
                    disabled={syncPending}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={cn("size-3.5", syncRepsMutation.isPending && "animate-spin")} />
                    Sync Reps
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => syncDealsMutation.mutate()}
                    disabled={syncPending}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className={cn("size-3.5", syncDealsMutation.isPending && "animate-spin")} />
                    Sync Deals
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <Label className="text-[11px] text-muted-foreground">Auto Sync</Label>
                    <Select
                      value={status.syncSchedule?.deals || "hourly"}
                      onValueChange={(v) =>
                        scheduleMutation.mutate({ reps: v, deals: v })
                      }
                    >
                      <SelectTrigger className="h-8 mt-1 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Every 10 min</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="manual">Manual only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <DropdownMenuSeparator />
                  {status?.connectorName === "custom" && (
                    <>
                      <DropdownMenuItem onClick={openMappingEditor} className="flex items-center gap-2">
                        <FileCode className="size-3.5" />
                        Edit Mapping
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  {status?.connectorName === "hubspot" && (
                    <>
                      <DropdownMenuItem onClick={openStageMapping} className="flex items-center gap-2">
                        <GitBranch className="size-3.5" />
                        Stage Mapping
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <DropdownMenuItem
                        onSelect={(e) => e.preventDefault()}
                        className="flex items-center gap-2 text-destructive focus:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        Disconnect
                      </DropdownMenuItem>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect from {status.connectorDisplayName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will stop syncing data. Your existing reps and deals will remain in CommissionKit.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => disconnectMutation.mutate()}>
                          Disconnect
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>

          <CardContent className="space-y-4">
            {status.lastSyncedAt && (
              <p className="text-xs text-muted-foreground">
                Last synced: {new Date(status.lastSyncedAt).toLocaleString()}
              </p>
            )}

            {status.lastError && (
              <div className="flex items-center justify-between rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                <div className="flex items-center gap-2 min-w-0">
                  <AlertTriangle className="size-4 shrink-0" />
                  <span className="truncate">{status.lastError}</span>
                </div>
                <Button
                  variant="ghost"
                  className="h-6 text-xs shrink-0 ml-2 hover:bg-destructive/20"
                  onClick={async () => {
                    await apiFetch(`/api/integrations/${activeWorkspace?.id}/dismiss-error`, { method: "POST" });
                    queryClient.setQueryData(["integrations", "status", activeWorkspace?.id], (old: any) =>
                      old ? { ...old, lastError: undefined } : old,
                    );
                    await queryClient.refetchQueries({ queryKey: ["integrations", "status", activeWorkspace?.id] });
                  }}
                >
                  Dismiss
                </Button>
              </div>
            )}

            {/* Recent syncs */}
            {status.recentSyncs && status.recentSyncs.length > 0 && (
              <div>
                <p className="text-sm font-medium mb-2">Recent Syncs</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">Type</TableHead>
                      <TableHead className="text-xs">Trigger</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Stats</TableHead>
                      <TableHead className="text-xs">Completed</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {status.recentSyncs.map((sync) => (
                      <TableRow key={sync.id}>
                        <TableCell className="text-xs font-medium">{sync.entityType}</TableCell>
                        <TableCell className="text-xs capitalize">{sync.trigger}</TableCell>
                        <TableCell className="text-xs">
                          {sync.status === "running" ? (
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400">
                              <LoaderCircle className="size-3 animate-spin" />
                              running
                            </span>
                          ) : (
                            <Badge variant={
                              sync.status === "completed" ? "default"
                              : sync.status === "partial" ? "secondary"
                              : "destructive"
                            } className="text-[10px]">
                              {sync.status}
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <span className="text-[11px] font-semibold tabular-nums">{sync.stats.created}</span>
                              <span className="text-[10px]">new</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <span className="text-[11px] font-semibold tabular-nums">{sync.stats.updated}</span>
                              <span className="text-[10px]">updated</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-muted-foreground">
                              <span className="text-[11px] font-semibold tabular-nums">{sync.stats.skipped}</span>
                              <span className="text-[10px]">skipped</span>
                            </span>
                            {sync.stats.failed > 0 && (
                              <span className="inline-flex items-center gap-1 text-destructive">
                                <span className="text-[11px] font-semibold tabular-nums">{sync.stats.failed}</span>
                                <span className="text-[10px]">failed</span>
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {sync.completedAt ? new Date(sync.completedAt).toLocaleString() : "-"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Connector cards */}
      <div>
        <h2 className="text-lg font-semibold mb-3">
          {status?.connected ? "Switch Connector" : "Choose a Connector"}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {connectors?.connectors?.map((connector) => {
            const isConnected = status?.connectorName === connector.name;

            return (
              <Card
                key={connector.name}
                className={cn(
                  "transition-colors",
                  isConnected && "ring-2 ring-teal-600/50",
                )}
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "flex size-10 items-center justify-center rounded-xl shrink-0 overflow-hidden",
                      isConnected ? "bg-teal-600/10" : "bg-muted",
                    )}>
                      <ConnectorImage name={connector.name} className={cn("size-6 object-contain", !isConnected && "opacity-50")} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base flex items-center gap-2">
                        {connector.displayName}
                        {isConnected && (
                          <Badge variant="default" className="text-[10px] bg-teal-600/10 text-teal-600 border-teal-600/20">
                            Connected
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-xs line-clamp-2">
                        {connector.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {connector.features.map((f) => (
                      <Badge key={f} variant="secondary" className="text-[10px]">
                        {f.replace(/_/g, " ")}
                      </Badge>
                    ))}
                  </div>
                  <Dialog onOpenChange={(open) => {
                    if (open) {
                      setSelectedConnector(connector.name);
                      setFormValues({ _connector: connector.name });
                      setTestResult(null);
                    }
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant={isConnected ? "secondary" : "default"}
                        className="w-full"
                      >
                        {isConnected ? "Configure" : "Set Up"}
                        <ArrowRight className="size-3.5 ml-1.5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                          <ConnectorImage name={connector.name} className="size-5 object-contain" />
                          Connect to {connector.displayName}
                        </DialogTitle>
                        <DialogDescription>
                          Enter your {connector.displayName} credentials to start syncing data.
                        </DialogDescription>
                      </DialogHeader>

                      <div className="space-y-4 py-2">
                        {connector.name === "odoo" && (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Odoo Instance URL</Label>
                              <Input
                                placeholder="https://mycompany.odoo.com"
                                value={String(formValues.baseUrl || "")}
                                onChange={(e) => setFormValues({ ...formValues, baseUrl: e.target.value })}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Database Name</Label>
                              <Input
                                placeholder="mycompany-db"
                                value={String(formValues.database || "")}
                                onChange={(e) => setFormValues({ ...formValues, database: e.target.value })}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Username (Email)</Label>
                              <Input
                                placeholder="admin@mycompany.com"
                                value={String(formValues.username || "")}
                                onChange={(e) => setFormValues({ ...formValues, username: e.target.value })}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">API Key</Label>
                              <Input
                                type="password"
                                placeholder="Generated from Odoo user settings"
                                value={String(formValues.apiKey || "")}
                                onChange={(e) => setFormValues({ ...formValues, apiKey: e.target.value })}
                                className="h-9 text-sm"
                              />
                            </div>
                          </>
                        )}

                        {connector.name === "custom" && (
                          <>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Base URL</Label>
                              <Input
                                placeholder="https://api.erp.example.com"
                                value={String(formValues.baseUrl || "")}
                                onChange={(e) => setFormValues({ ...formValues, baseUrl: e.target.value })}
                                className="h-9 text-sm"
                              />
                            </div>
                            <div className="space-y-1.5">
                              <Label className="text-xs">Authentication</Label>
                              <Select
                                value={String(formValues.authType || "bearer")}
                                onValueChange={(v) => setFormValues({ ...formValues, authType: v })}
                              >
                                <SelectTrigger className="h-9 text-sm">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="bearer">Bearer Token</SelectItem>
                                  <SelectItem value="apiKey">API Key</SelectItem>
                                  <SelectItem value="basic">Basic Auth</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            {String(formValues.authType || "bearer") === "bearer" && (
                              <div className="space-y-1.5">
                                <Label className="text-xs">Bearer Token</Label>
                                <Input
                                  type="password"
                                  placeholder="sk-abc123..."
                                  value={String(formValues.authToken || "")}
                                  onChange={(e) => setFormValues({ ...formValues, authToken: e.target.value })}
                                  className="h-9 text-sm"
                                />
                              </div>
                            )}
                            {String(formValues.authType) === "apiKey" && (
                              <>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Header Name</Label>
                                  <Input
                                    placeholder="X-API-Key"
                                    value={String(formValues.authHeaderName || "")}
                                    onChange={(e) => setFormValues({ ...formValues, authHeaderName: e.target.value })}
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">API Key</Label>
                                  <Input
                                    type="password"
                                    placeholder="your-api-key"
                                    value={String(formValues.authApiKey || "")}
                                    onChange={(e) => setFormValues({ ...formValues, authApiKey: e.target.value })}
                                    className="h-9 text-sm"
                                  />
                                </div>
                              </>
                            )}
                            {String(formValues.authType) === "basic" && (
                              <>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Username</Label>
                                  <Input
                                    placeholder="username"
                                    value={String(formValues.authUsername || "")}
                                    onChange={(e) => setFormValues({ ...formValues, authUsername: e.target.value })}
                                    className="h-9 text-sm"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <Label className="text-xs">Password</Label>
                                  <Input
                                    type="password"
                                    placeholder="password"
                                    value={String(formValues.authPassword || "")}
                                    onChange={(e) => setFormValues({ ...formValues, authPassword: e.target.value })}
                                    className="h-9 text-sm"
                                  />
                                </div>
                              </>
                            )}
                          </>
                        )}
                        {connector.name === "hubspot" && (
                          <div className="space-y-1.5">
                            <Label className="text-xs">Access Token</Label>
                            <Input
                              type="password"
                              placeholder="Service Key or Legacy App token e.g. (pat-na1-xxxx...)"
                              value={String(formValues.accessToken || "")}
                              onChange={(e) => setFormValues({ ...formValues, accessToken: e.target.value })}
                              className="h-9 text-sm"
                            />
                          </div>
                        )}

                        {/* Test result */}
                        {testResult && (
                          <div className={cn(
                            "rounded-lg p-3 text-sm flex items-center gap-2",
                            testResult.success
                              ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                              : "bg-destructive/10 text-destructive",
                          )}>
                            {testResult.success ? (
                              <CheckCircle2 className="size-4 shrink-0" />
                            ) : (
                              <XCircle className="size-4 shrink-0" />
                            )}
                            {testResult.message || (testResult.success ? "Connection successful" : "Connection failed")}
                          </div>
                        )}

                        {connectMutation.isError && (
                          <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                            {(connectMutation.error as Error)?.message || "Connection failed"}
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 pt-2">
                          <Button
                            variant="secondary"
                            onClick={() => handleTest(connector.name)}
                            disabled={testing}
                            className="flex-1"
                          >
                            {testing ? "Testing..." : "Test Connection"}
                          </Button>
                          <Button
                            onClick={() => handleConnect(connector.name)}
                            disabled={connecting}
                            className="flex-1"
                          >
                            {connecting ? "Connecting..." : "Connect"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Bug report */}
      <div className="mt-8 pt-6 border-t border-border">
        <a
          href="mailto:support@commissionk.it?subject=Integration Bug Report"
          className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bug className="size-3.5" />
          Report a bug or request a connector
        </a>
      </div>

      {/* Mapping editor dialog */}
      <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileCode className="size-5" />
              Edit Connector Mapping
            </DialogTitle>
            <DialogDescription>
              Edit the full connector configuration in JSON. This includes endpoints, field mappings, pagination, and filters.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Textarea
              value={mappingJson}
              onChange={(e) => { setMappingJson(e.target.value); setMappingError(null); }}
              className="min-h-[400px] font-mono text-xs leading-relaxed"
              placeholder='{ "baseUrl": "...", "auth": { ... }, "entities": { ... } }'
            />
            {mappingError && (
              <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                {mappingError}
              </div>
            )}
            {configMutation.isError && (
              <div className="rounded-lg bg-destructive/10 p-2 text-xs text-destructive">
                {(configMutation.error as Error)?.message || "Failed to save"}
              </div>
            )}
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" onClick={() => setMappingOpen(false)}>
                Cancel
              </Button>
              <Button onClick={saveMapping} disabled={configMutation.isPending}>
                {configMutation.isPending ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Stage mapping dialog (HubSpot) */}
      <Dialog open={stageMappingOpen} onOpenChange={setStageMappingOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <GitBranch className="size-5" />
              Stage Mapping
            </DialogTitle>
            <DialogDescription>
              Map HubSpot pipeline stages to CommissionKit stages. Select a CKit stage for each HubSpot stage below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2 max-h-[400px] overflow-y-auto">
            {stageMappingLoading ? (
              <div className="flex items-center justify-center py-8">
                <LoaderCircle className="size-5 animate-spin text-muted-foreground" />
              </div>
            ) : stageOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No stages found in HubSpot pipelines.
              </p>
            ) : (
              stageOptions.map((stage) => (
                <div key={stage.id} className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{stage.label}</p>
                    <p className="text-[11px] text-muted-foreground">{stage.pipeline}</p>
                  </div>
                  <Select
                    value={stageMapping[stage.id] || ""}
                    onValueChange={(v) => setStageMapping((prev) => ({ ...prev, [stage.id]: v }))}
                  >
                    <SelectTrigger className="w-36 h-8 text-xs">
                      <SelectValue placeholder="Select..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="closed_won">closed_won</SelectItem>
                      <SelectItem value="closed_lost">closed_lost</SelectItem>
                      <SelectItem value="pending">pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))
            )}
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="secondary" onClick={() => setStageMappingOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveStageMapping} disabled={stageMappingLoading}>
              Save
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
