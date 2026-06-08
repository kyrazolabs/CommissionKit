import { useState } from "react";
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
import { CheckCircle2, AlertTriangle, RefreshCw, Trash2, Ellipsis, LoaderCircle, FileCode, GitBranch } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/hooks/use-workspace";
import { ConnectorImage } from "./icons";
import type { ConnectionStatus } from "./types";

interface Props {
  status: ConnectionStatus;
  onOpenMappingEditor: () => void;
  onOpenStageMapping: () => void;
}

export function ConnectedCard({ status, onOpenMappingEditor, onOpenStageMapping }: Props) {
  const { activeWorkspace } = useWorkspace();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["integrations"] });

  const syncReps = async () => {
    await apiFetch(`/api/integrations/${activeWorkspace?.id}/sync/reps`, { method: "POST" });
    invalidate();
    toast({ title: "Sync started", description: "Rep sync has been enqueued." });
  };

  const syncDeals = async () => {
    await apiFetch(`/api/integrations/${activeWorkspace?.id}/sync/deals`, { method: "POST" });
    invalidate();
    toast({ title: "Sync started", description: "Deal sync has been enqueued." });
  };

  const updateSchedule = async (v: string) => {
    await apiFetch(`/api/integrations/${activeWorkspace?.id}/config`, { method: "PATCH", body: JSON.stringify({ syncSchedule: { reps: v, deals: v } }) });
    invalidate();
    const labels: Record<string, string> = { realtime: "Every 10 min", hourly: "Hourly", daily: "Daily", manual: "Manual only" };
    toast({ title: "Auto sync updated", description: `Now syncing ${labels[v] || v}.` });
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
              <CardTitle className="text-base">Connected to {status.connectorDisplayName || status.connectorName}</CardTitle>
              <CardDescription>
                {status.status === "connected" ? (
                  <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5" />Connected
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
              <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={syncReps} className="flex items-center gap-2"><RefreshCw className="size-3.5" />Sync Reps</DropdownMenuItem>
              <DropdownMenuItem onClick={syncDeals} className="flex items-center gap-2"><RefreshCw className="size-3.5" />Sync Deals</DropdownMenuItem>
              <DropdownMenuSeparator />
              <div className="px-2 py-1.5">
                <Label className="text-[11px] text-muted-foreground">Auto Sync</Label>
                <Select value={status.syncSchedule?.deals || "hourly"} onValueChange={updateSchedule}>
                  <SelectTrigger className="h-8 mt-1 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realtime">Every 10 min</SelectItem><SelectItem value="hourly">Hourly</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem><SelectItem value="manual">Manual only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DropdownMenuSeparator />
              {status.connectorName === "custom" && (
                <>
                  <DropdownMenuItem onClick={onOpenMappingEditor} className="flex items-center gap-2"><FileCode className="size-3.5" />Edit Mapping</DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              {status.connectorName === "hubspot" && (
                <>
                  <DropdownMenuItem onClick={onOpenStageMapping} className="flex items-center gap-2"><GitBranch className="size-3.5" />Stage Mapping</DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex items-center gap-2 text-destructive focus:text-destructive"><Trash2 className="size-3.5" />Disconnect</DropdownMenuItem>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Disconnect from {status.connectorDisplayName}?</AlertDialogTitle>
                    <AlertDialogDescription>This will stop syncing data. Your existing reps and deals will remain in CommissionKit.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={disconnect}>Disconnect</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {status.lastSyncedAt && <p className="text-xs text-muted-foreground">Last synced: {new Date(status.lastSyncedAt).toLocaleString()}</p>}
        {status.lastError && (
          <div className="flex items-center justify-between rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
            <div className="flex items-center gap-2 min-w-0"><AlertTriangle className="size-4 shrink-0" /><span className="truncate">{status.lastError}</span></div>
            <Button variant="ghost" className="h-6 text-xs shrink-0 ml-2 hover:bg-destructive/20" onClick={async () => {
              await apiFetch(`/api/integrations/${activeWorkspace?.id}/dismiss-error`, { method: "POST" });
              queryClient.setQueryData(["integrations", "status", activeWorkspace?.id], (old: any) => old ? { ...old, lastError: undefined } : old);
              await queryClient.refetchQueries({ queryKey: ["integrations", "status", activeWorkspace?.id] });
            }}>Dismiss</Button>
          </div>
        )}
        {status.recentSyncs && status.recentSyncs.length > 0 && (
          <div>
            <p className="text-sm font-medium mb-2">Recent Syncs</p>
            <Table>
              <TableHeader><TableRow><TableHead className="text-xs">Type</TableHead><TableHead className="text-xs">Trigger</TableHead><TableHead className="text-xs">Status</TableHead><TableHead className="text-xs">Stats</TableHead><TableHead className="text-xs">Completed</TableHead></TableRow></TableHeader>
              <TableBody>
                {status.recentSyncs.map((sync) => (
                  <TableRow key={sync.id}>
                    <TableCell className="text-xs font-medium">{sync.entityType}</TableCell>
                    <TableCell className="text-xs capitalize">{sync.trigger}</TableCell>
                    <TableCell className="text-xs">
                      {sync.status === "running" ? (
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-600 dark:bg-blue-950 dark:text-blue-400"><LoaderCircle className="size-3 animate-spin" />running</span>
                      ) : (
                        <Badge variant={sync.status === "completed" ? "default" : sync.status === "partial" ? "secondary" : "destructive"} className="text-[10px]">{sync.status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div className="flex items-center gap-2">
                        <Stat color="emerald-600 dark:text-emerald-400" v={sync.stats.created} l="new" />
                        <Stat color="amber-600 dark:text-amber-400" v={sync.stats.updated} l="updated" />
                        <Stat color="text-muted-foreground" v={sync.stats.skipped} l="skipped" />
                        {sync.stats.failed > 0 && <Stat color="text-destructive" v={sync.stats.failed} l="failed" />}
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
