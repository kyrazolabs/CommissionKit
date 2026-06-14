import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { CheckCircle2, AlertTriangle, RefreshCw, Trash2, Ellipsis, LoaderCircle, FileCode, GitBranch, CreditCard, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { ConnectorImage } from "./icons";
import type { ConnectionStatus } from "./types";

interface Props {
  status: ConnectionStatus;
  onOpenMappingEditor: () => void;
  onOpenStageMapping: () => void;
  onOpenPaymentDefaults: () => void;
  onOpenStageFilter: (connectorName: string) => void;
}

export function ConnectedCard({ status, onOpenMappingEditor, onOpenStageMapping, onOpenPaymentDefaults, onOpenStageFilter }: Props) {
  const { t } = useTranslation();
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["integrations"] });

  const syncReps = async () => {
    await apiFetch(`/api/integrations/${activeWorkspace?.id}/sync/reps`, { method: "POST" });
    invalidate();
    toast({ title: t("integrations.syncStarted"), description: t("integrations.repSyncEnqueued") });
  };

  const syncDeals = async () => {
    await apiFetch(`/api/integrations/${activeWorkspace?.id}/sync/deals`, { method: "POST" });
    invalidate();
    toast({ title: t("integrations.syncStarted"), description: t("integrations.dealSyncEnqueued") });
  };

  const updateSchedule = async (v: string) => {
    await apiFetch(`/api/integrations/${activeWorkspace?.id}/config`, { method: "PATCH", body: JSON.stringify({ syncSchedule: { reps: v, deals: v } }) });
    invalidate();
    const labels: Record<string, string> = { realtime: t("integrations.every10min"), hourly: t("integrations.hourly"), daily: t("integrations.daily"), manual: t("integrations.manualOnly") };
    toast({ title: t("integrations.autoSyncUpdated"), description: `${t("integrations.nowSyncing")} ${labels[v] || v}.` });
  };

  const disconnect = async () => {
    await apiFetch(`/api/integrations/${activeWorkspace?.id}/disconnect`, { method: "DELETE" });
    invalidate();
    toast({ title: "Disconnected" });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl p-1.5">
              <ConnectorImage name={status.connectorName || ""} className="size-full object-contain" />
            </div>
            <div>
              <CardTitle className="text-base">{t("integrations.connectedTo")} {status.connectorDisplayName || status.connectorName}</CardTitle>
              <CardDescription>
                {status.status === "connected" ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />{t("integrations.connected")}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-amber-600"><AlertTriangle className="size-3.5" />{status.status}</span>
                )}
              </CardDescription>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><Button variant="ghost" className="h-9 w-9 p-0"><Ellipsis className="size-4" /></Button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">{t("integrations.actions")}</DropdownMenuLabel>
              <DropdownMenuItem onClick={syncReps} className="flex items-center gap-2"><RefreshCw className="size-3.5" />{t("integrations.syncReps")}</DropdownMenuItem>
              <DropdownMenuItem onClick={syncDeals} className="flex items-center gap-2"><RefreshCw className="size-3.5" />{t("integrations.syncDeals")}</DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <Label className="text-[11px] text-muted-foreground">{t("integrations.autoSync")}</Label>
                <Select value={status.syncSchedule?.deals || "hourly"} onValueChange={updateSchedule}>
                  <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">{t("integrations.every10min")}</SelectItem><SelectItem value="hourly">{t("integrations.hourly")}</SelectItem>
                    <SelectItem value="daily">{t("integrations.daily")}</SelectItem><SelectItem value="manual">{t("integrations.manualOnly")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onOpenStageFilter(status.connectorName!)} className="flex items-center gap-2">
                <Filter className="size-3.5" />Stage Filter
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {status.connectorName === "custom" && (
                <>
                  <DropdownMenuItem onClick={onOpenMappingEditor} className="flex items-center gap-2"><FileCode className="size-3.5" />{t("integrations.editMapping")}</DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {(status.connectorName === "hubspot" || status.connectorName === "salesforce") && (
                <>
                  <DropdownMenuItem onClick={onOpenStageMapping} className="flex items-center gap-2">
                    <GitBranch className="size-3.5" />Stage Mapping
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={onOpenPaymentDefaults} className="flex items-center gap-2">
                    <CreditCard className="size-3.5" />Payment Defaults
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 text-destructive focus:text-destructive"><Trash2 className="size-3.5" />{t("integrations.disconnect")}</DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>{t("integrations.disconnectFrom")} {status.connectorDisplayName}?</AlertDialogTitle>
                    <AlertDialogDescription>{t("integrations.disconnectWarning")}</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t("integrations.cancel")}</AlertDialogCancel>
                    <AlertDialogAction onClick={disconnect}>{t("integrations.disconnect")}</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {status.lastSyncedAt && <p className="text-xs text-muted-foreground">{t("integrations.lastSynced")} {new Date(status.lastSyncedAt).toLocaleString()}</p>}
        {status.lastError && (
          <div className="flex items-center justify-between rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2 min-w-0"><AlertTriangle className="size-4 shrink-0" /><span className="truncate">{status.lastError}</span></div>
            <Button variant="ghost" className="h-6 text-xs shrink-0 ml-2 hover:bg-destructive/20" onClick={async () => {
              await apiFetch(`/api/integrations/${activeWorkspace?.id}/dismiss-error`, { method: "POST" });
              queryClient.setQueryData(["integrations", "status", activeWorkspace?.id], (old: any) => old ? { ...old, lastError: undefined } : old);
              await queryClient.refetchQueries({ queryKey: ["integrations", "status", activeWorkspace?.id] });
            }}>{t("integrations.dismiss")}</Button>
          </div>
        )}
        {status.recentSyncs && status.recentSyncs.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">{t("integrations.recentSyncs")}</p>
            <Table>
              <TableHeader><TableRow><TableHead className="text-xs">{t("integrations.syncType")}</TableHead><TableHead className="text-xs">{t("integrations.syncTrigger")}</TableHead><TableHead className="text-xs">{t("integrations.syncStatus")}</TableHead><TableHead className="text-xs">{t("integrations.syncStats")}</TableHead><TableHead className="text-xs">{t("integrations.syncCompleted")}</TableHead></TableRow></TableHeader>
              <TableBody>
                {status.recentSyncs.map((sync) => (
                  <TableRow key={sync.id}>
                    <TableCell className="text-xs font-medium">{sync.entityType}</TableCell>
                    <TableCell className="text-xs capitalize">{sync.trigger}</TableCell>
                    <TableCell className="text-xs">
                      {sync.status === "running" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400"><LoaderCircle className="size-3 animate-spin" />{t("integrations.running")}</span>
                      ) : (
                        <Badge variant={sync.status === "completed" ? "default" : sync.status === "partial" ? "secondary" : "destructive"} className="text-[10px]">{sync.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <Stat color="emerald-600 dark:text-emerald-400" v={sync.stats.created} l={t("integrations.new")} />
                        <Stat color="amber-600 dark:text-amber-400" v={sync.stats.updated} l={t("integrations.updated")} />
                        <Stat color="text-muted-foreground" v={sync.stats.skipped} l={t("integrations.skipped")} />
                        {sync.stats.failed > 0 && <Stat color="text-destructive" v={sync.stats.failed} l={t("integrations.failed")} />}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{sync.completedAt ? new Date(sync.completedAt).toLocaleString() : "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function Stat({ color, v, l }: { color: string; v: number; l: string }) {
  return <span className={`inline-flex items-center gap-1 ${color}`}><span className="text-[11px] font-semibold tabular-nums">{v}</span><span className="text-[10px]">{l}</span></span>;
}
