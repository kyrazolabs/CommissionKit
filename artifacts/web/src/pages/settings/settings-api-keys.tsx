import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Key, Plus, Trash2, Copy, Check, AlertTriangle, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useSyncStore } from "@/hooks/use-sync-store";
import { toast } from "sonner";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ApiKey {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  createdAt: string;
}

interface CreateApiKeyResponse {
  id: string;
  name: string;
  key: string;
  prefix: string;
  permissions: string[];
  expiresAt: string | null;
  createdAt: string;
}

interface ApiKeysApiResponse {
  data: ApiKey[];
}

const PERMISSION_OPTIONS = [
  {
    id: "read:all",
    labelKey: "settings.apiKeys.permissions.readAll",
    descKey: "settings.apiKeys.permissions.readAllDesc",
  },
  {
    id: "write:deals",
    labelKey: "settings.apiKeys.permissions.writeDeals",
    descKey: "settings.apiKeys.permissions.writeDealsDesc",
  },
  {
    id: "write:reps",
    labelKey: "settings.apiKeys.permissions.writeReps",
    descKey: "settings.apiKeys.permissions.writeRepsDesc",
  },
  {
    id: "write:runs",
    labelKey: "settings.apiKeys.permissions.writeRuns",
    descKey: "settings.apiKeys.permissions.writeRunsDesc",
  },
] as const;

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)}mo ago`;
  return date.toLocaleDateString();
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function SettingsApiKeys() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { setSyncError } = useSyncStore();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreateApiKeyResponse | null>(null);
  const [keyCopied, setKeyCopied] = useState(false);
  const [revokeConfirmKey, setRevokeConfirmKey] = useState<ApiKey | null>(null);

  // Form state
  const [keyName, setKeyName] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(["read:all"]);
  const [keyExpires, setKeyExpires] = useState("");
  const [createError, setCreateError] = useState("");

  const { data: keysResp, isLoading, isError } = useQuery({
    queryKey: ["api-keys"],
    queryFn: (): Promise<ApiKeysApiResponse> => apiFetch("/api/api-keys"),
  });

  const keys: ApiKey[] = keysResp?.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/api-keys/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: ["api-keys"] });
      const previous = queryClient.getQueryData(["api-keys"]);
      queryClient.setQueryData(["api-keys"], (old: any) => {
        if (!old?.data) return old;
        return {
          data: (old.data as ApiKey[]).filter((k) => k.id !== id),
        };
      });
      return { previous };
    },
    onError: (_err, _variables, context: any) => {
      setSyncError(true);
      queryClient.setQueryData(["api-keys"], context?.previous);
      toast.error(t("settings.apiKeys.revokeFailed") || "Failed to revoke API key");
    },
    onSuccess: () => {
      toast.success(t("settings.apiKeys.revoked") || "API key revoked");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys"] });
    },
  });

  const createMutation = useMutation({
    mutationFn: (body: { name: string; permissions: string[]; expiresAt?: string }) =>
      apiFetch("/api/api-keys", {
        method: "POST",
        body: JSON.stringify(body),
      }),
    onSuccess: (data: CreateApiKeyResponse) => {
      setCreatedKey(data);
      setCreateError("");
    },
    onError: (err: any) => {
      setSyncError(true);
      const msg = err?.message || err?.error || "Failed to create API key";
      setCreateError(msg);
      toast.error(t("settings.apiKeys.createFailed") || "Failed to create API key");
    },
  });

  const togglePermission = useCallback((permId: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId],
    );
  }, []);

  const handleCreate = useCallback(() => {
    if (!keyName.trim()) return;
    setCreateError("");
    const perms = selectedPermissions.length ? selectedPermissions : ["read:all"];

    createMutation.mutate({
      name: keyName.trim(),
      permissions: perms,
      ...(keyExpires ? { expiresAt: keyExpires } : {}),
    });
  }, [keyName, selectedPermissions, keyExpires, createMutation]);

  const handleCopyKey = useCallback(async () => {
    if (!createdKey?.key) return;
    try {
      await navigator.clipboard.writeText(createdKey.key);
      setKeyCopied(true);
      toast.success(t("settings.apiKeys.copied") || "Key copied to clipboard");
      setTimeout(() => setKeyCopied(false), 3000);
    } catch {
      toast.error(t("settings.apiKeys.copyFailed") || "Failed to copy to clipboard");
    }
  }, [createdKey, t]);

  const handleCloseCreate = useCallback(() => {
    setIsCreateOpen(false);
    setCreatedKey(null);
    setKeyCopied(false);
    setKeyName("");
    setSelectedPermissions(["read:all"]);
    setKeyExpires("");
    setCreateError("");
    queryClient.invalidateQueries({ queryKey: ["api-keys"] });
  }, [queryClient]);

  const handleRevokeConfirm = useCallback(() => {
    if (revokeConfirmKey) {
      deleteMutation.mutate(revokeConfirmKey.id);
      setRevokeConfirmKey(null);
    }
  }, [revokeConfirmKey, deleteMutation]);

  return (
    <>
      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1.5">
            <CardTitle className="flex items-center gap-2 text-base">
              <Key className="size-4 text-primary" />
              {t("settings.apiKeys.title")}
            </CardTitle>
            <CardDescription>
              {t("settings.apiKeys.description")}
            </CardDescription>
          </div>
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="shrink-0"
          >
            <Plus className="size-4" />
            {t("settings.apiKeys.createButton")}
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3 py-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 w-full rounded-md bg-muted animate-pulse" />
              ))}
            </div>
          ) : isError ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <AlertTriangle className="size-8" />
              <p className="text-sm">{t("settings.apiKeys.loadError") || "Failed to load API keys"}</p>
            </div>
          ) : keys.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Key className="size-8 opacity-40" />
              <p className="text-sm font-medium text-foreground">
                {t("settings.apiKeys.emptyTitle")}
              </p>
              <p className="text-xs max-w-xs text-center">
                {t("settings.apiKeys.emptyDescription")}
              </p>
            </div>
          ) : (
            <div className="rounded-md border border-card-border bg-card overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-card-border hover:bg-transparent">
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("settings.apiKeys.name")}
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("settings.apiKeys.prefix")}
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("settings.apiKeys.permissions")}
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("settings.apiKeys.created")}
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {t("settings.apiKeys.lastUsed")}
                    </TableHead>
                    <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {keys.map((key) => (
                    <TableRow
                      key={key.id}
                      className="border-b border-card-border hover:bg-muted/20 transition-colors"
                    >
                      <TableCell className="text-sm font-medium text-foreground">
                        {key.name}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground font-mono">
                        {key.prefix}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {key.permissions.map((perm) => (
                            <Badge key={perm} variant="secondary" className="text-[11px]">
                              {perm}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {relativeDate(key.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm tabular-nums text-muted-foreground">
                        {relativeDate(key.lastUsedAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setRevokeConfirmKey(key)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create API Key Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={(open) => {
        if (!open) handleCloseCreate();
        else setIsCreateOpen(true);
      }}>
        <DialogContent>
          {!createdKey ? (
            <>
              <DialogHeader>
                <DialogTitle>{t("settings.apiKeys.createButton")}</DialogTitle>
                <DialogDescription>
                  {t("settings.apiKeys.createDescription") || "Create a new API key for programmatic access to your workspace."}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="key-name">
                    {t("settings.apiKeys.keyNameLabel")}
                  </Label>
                  <Input
                    id="key-name"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                    placeholder={t("settings.apiKeys.keyNamePlaceholder") || "e.g. AI Assistant, CLI Tool"}
                    maxLength={100}
                  />
                </div>
                <div className="space-y-3">
                  <Label>
                    {t("settings.apiKeys.permissionsLabel")}
                  </Label>
                  <div className="space-y-2">
                    {PERMISSION_OPTIONS.map((option) => (
                      <label
                        key={option.id}
                        htmlFor={`perm-${option.id}`}
                        className={cn(
                          "flex items-start gap-3 rounded-md border border-card-border px-3 py-2.5 cursor-pointer transition-colors",
                          selectedPermissions.includes(option.id)
                            ? "bg-primary/5 border-primary/30"
                            : "hover:bg-muted/50",
                        )}
                      >
                        <Checkbox
                          id={`perm-${option.id}`}
                          checked={selectedPermissions.includes(option.id)}
                          onCheckedChange={() => togglePermission(option.id)}
                          className="mt-0.5"
                        />
                        <div className="space-y-0.5">
                          <p className="text-sm font-medium text-foreground">
                            {t(option.labelKey)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {t(option.descKey)}
                          </p>
                          <p className="text-[11px] font-mono text-muted-foreground">
                            {option.id}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                  {selectedPermissions.length === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      Select at least one permission. If none is selected, <code className="text-[11px]">read:all</code> will be used.
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="key-expires">
                    {t("settings.apiKeys.expiresLabel")}
                  </Label>
                  <Input
                    id="key-expires"
                    value={keyExpires}
                    onChange={(e) => setKeyExpires(e.target.value)}
                    placeholder="YYYY-MM-DD"
                  />
                </div>
                {createError && (
                  <p className="text-sm text-destructive">{createError}</p>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={handleCloseCreate}>
                  {t("common.cancel") || "Cancel"}
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={!keyName.trim() || createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2 className="size-4 mr-2 animate-spin" />
                  )}
                  {t("settings.apiKeys.createConfirm") || "Create Key"}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader>
                <DialogTitle>{t("settings.apiKeys.keyCreated")}</DialogTitle>
                <DialogDescription>
                  {t("settings.apiKeys.keyCreatedDescription")}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-900/20">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                      {t("settings.apiKeys.copyWarning") || "Copy this key now — it will not be shown again"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Input
                      readOnly
                      value={createdKey.key}
                      className="font-mono text-sm bg-white dark:bg-black/30 border-amber-200 dark:border-amber-800/50"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="shrink-0"
                      onClick={handleCopyKey}
                    >
                      {keyCopied ? (
                        <Check className="size-4 text-emerald-600" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="text-sm space-y-1 text-muted-foreground">
                  <p>
                    <span className="font-medium text-foreground">{t("settings.apiKeys.name")}:</span>{" "}
                    {createdKey.name}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t("settings.apiKeys.prefix")}:</span>{" "}
                    <code className="text-xs">{createdKey.prefix}</code>
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t("settings.apiKeys.permissions")}:</span>{" "}
                    {createdKey.permissions.join(", ")}
                  </p>
                  <p>
                    <span className="font-medium text-foreground">{t("settings.apiKeys.created")}:</span>{" "}
                    {formatDate(createdKey.createdAt)}
                  </p>
                  {createdKey.expiresAt && (
                    <p>
                      <span className="font-medium text-foreground">{t("settings.apiKeys.expiresLabel")}:</span>{" "}
                      {formatDate(createdKey.expiresAt)}
                    </p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleCloseCreate} disabled={!keyCopied}>
                  {keyCopied
                    ? (t("common.done") || "Done")
                    : (t("settings.apiKeys.copyFirst") || "Copy key to continue")}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Revoke Confirmation Dialog */}
      <ConfirmDialog
        open={!!revokeConfirmKey}
        onOpenChange={(open) => {
          if (!open) setRevokeConfirmKey(null);
        }}
        onConfirm={handleRevokeConfirm}
        variant="destructive"
        title={t("settings.apiKeys.revokeConfirm") || "Revoke API key"}
        description={
          t("settings.apiKeys.revokeConfirmDescription") ||
          `Revoke API key "${revokeConfirmKey?.name}"? This will immediately block all access using this key. This action cannot be undone.`
        }
      />
    </>
  );
}
