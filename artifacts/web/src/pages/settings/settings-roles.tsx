import { useState, useEffect, useCallback, memo, useMemo } from "react";
import { Plus, Settings, Shield, Trash, Edit, Check } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "../../lib/api";
import { cn } from "../../lib/utils";
import { useRole } from "@/hooks/use-role";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Badge } from "../../components/ui/badge";

const PERMISSION_RESOURCES = [
  { id: "deals", name: "Deals", actions: ["read", "create", "edit", "delete", "export"] },
  { id: "payouts", name: "Payouts", actions: ["read", "create", "edit", "delete", "approve", "mark_paid", "adjust", "export"] },
  { id: "plans", name: "Commission Plans", actions: ["read", "create", "edit", "delete"] },
  { id: "reps", name: "Sales Reps", actions: ["read", "create", "edit", "delete"] },
  { id: "disputes", name: "Disputes", actions: ["read", "edit", "delete"] },
  { id: "analytics", name: "Reports", actions: ["read", "export"] },
  { id: "calculations", name: "Commission Runs", actions: ["read", "create", "edit", "delete", "export"] },
  { id: "team", name: "Teams", actions: ["read", "create", "edit", "delete"] },
  { id: "roles", name: "Roles & Permissions", actions: ["read", "create", "edit", "delete"] },
  { id: "billing", name: "Billing & Subscription", actions: ["read", "edit"] },
  { id: "workspace", name: "Workspace Settings", actions: ["read", "edit"] },
  { id: "notifications", name: "In-App Notifications", actions: ["read", "edit"] },
];

export default function SettingsRoles() {
  const { hasPermission } = useRole();
  const queryClient = useQueryClient();
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: roles = [], isLoading } = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiFetch("/api/roles"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      apiFetch(`/api/roles/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["roles"] }),
  });

  if (isLoading) {
    return <div className="p-8 text-muted-foreground animate-pulse">Loading roles…</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Roles & Permissions</h2>
          <p className="text-muted-foreground mt-2">
            Manage custom roles and define granular access controls for your workspace members.
          </p>
        </div>
        {hasPermission("roles", "create") && (
          <Button
            onClick={() => {
              setSelectedRole(null);
              setIsDialogOpen(true);
            }}
          >
            <Plus className="size-4 mr-2" />
            Create Role
          </Button>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {roles.map((role: any) => (
          <Card key={role.id} className="relative flex flex-col">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="size-5 text-primary" />
                  {role.name}
                </CardTitle>
                {role.isSystem && (
                  <Badge variant="secondary" className="text-xs">
                    System
                  </Badge>
                )}
              </div>
              <CardDescription className="min-h-10 mt-1 line-clamp-2">
                {role.description || "No description provided."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1">
              <div className="text-sm text-muted-foreground mb-4">
                {role.permissions.includes("*") ? (
                  <span className="font-medium text-emerald-500">Full Access (All Permissions)</span>
                ) : (
                  <span>{role.permissions.length} permissions granted</span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-auto pt-4 border-t border-border/50">
                {hasPermission("roles", "edit") && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => {
                      setSelectedRole(role);
                      setIsDialogOpen(true);
                    }}
                  >
                    <Edit className="size-4 mr-2" />
                    {role.name === "Owner" ? "View" : "Edit"}
                  </Button>
                )}

                {!role.isSystem && hasPermission("roles", "delete") && (
                  <Button
                    variant="destructive"
                    size="icon"
                    className="size-9 shrink-0"
                    onClick={() => {
                      if (confirm("Are you sure you want to delete this role? Users assigned to this role will lose these permissions immediately.")) {
                        deleteMutation.mutate(role.id);
                      }
                    }}
                  >
                    <Trash className="size-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {isDialogOpen && (
        <RoleDialog
          key={selectedRole?.id || "new"}
          role={selectedRole}
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          onSuccess={() => {
            setIsDialogOpen(false);
            queryClient.invalidateQueries({ queryKey: ["roles"] });
          }}
        />
      )}
    </div>
  );
}

function RoleDialog({ role, open, onOpenChange, onSuccess }: any) {
  const isSystem = role?.isSystem;
  const isOwner = role?.name === "Owner";

  const [name, setName] = useState(role?.name || "");
  const [description, setDescription] = useState(role?.description || "");
  const [permissions, setPermissions] = useState<string[]>(role?.permissions || []);

  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState("");

  const togglePermission = useCallback((perm: string) => {
    if (isOwner) return;
    setPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  }, [isOwner]);

  const toggleResource = useCallback((resource: string) => {
    if (isOwner) return;
    const resourceActions = PERMISSION_RESOURCES.find(r => r.id === resource)?.actions || [];
    const resourcePerms = resourceActions.map(a => `${resource}:${a}`);

    setPermissions(prev => {
      const allSelected = resourcePerms.every(p => prev.includes(p));
      if (allSelected) {
        return prev.filter(p => !p.startsWith(`${resource}:`));
      } else {
        const next = [...prev];
        resourcePerms.forEach(p => {
          if (!next.includes(p)) next.push(p);
        });
        return next;
      }
    });
  }, [isOwner]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOwner) return;

    setIsPending(true);
    setError("");

    try {
      const payload = {
        name,
        description,
        permissions: permissions.includes("*") ? ["*"] : permissions,
      };

      if (role) {
        await apiFetch(`/api/roles/${role.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch("/api/roles", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to save role");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{role ? (isOwner ? "View Role" : "Edit Role") : "Create Custom Role"}</DialogTitle>
          <DialogDescription>
            {isOwner ? "The Owner role has full access to the workspace and cannot be modified." : "Define granular permissions for what users in this role can do."}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md text-sm">
            {error}
          </div>
        )}

        <form id="role-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-2 space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Role Name</Label>
              <Input
                id="name"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={isSystem || isOwner}
                required
                placeholder="e.g. Regional Manager"
              />
              {isSystem && !isOwner && <p className="text-xs text-muted-foreground">System role names cannot be changed.</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                disabled={isOwner}
                placeholder="Briefly describe what this role does"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-sm font-semibold border-b pb-2">Permissions Matrix</h4>

            {isOwner ? (
              <div className="flex items-center justify-center p-8 bg-muted/50 rounded-lg border border-dashed">
                <p className="text-muted-foreground flex items-center gap-2">
                  <Shield className="size-5 text-emerald-500" />
                  This role implicitly has full access (<code className="bg-muted px-1 rounded">*</code>) to all resources.
                </p>
              </div>
            ) : (
              <PermissionMatrix
                permissions={permissions}
                onTogglePermission={togglePermission}
                onToggleResource={toggleResource}
                isOwner={isOwner}
              />
            )}
          </div>
        </form>

        <DialogFooter className="pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {isOwner ? "Close" : "Cancel"}
          </Button>
          {!isOwner && (
            <Button type="submit" form="role-form" disabled={isPending}>
              {isPending ? "Saving…" : role ? "Save Changes" : "Create Role"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const COLUMNS = ["read", "create", "edit", "delete", "approve", "mark_paid", "adjust", "export"];

const PermissionMatrix = memo(({ permissions, onTogglePermission, onToggleResource, isOwner }: any) => {
  const hasGlobalWildcard = permissions.includes("*");

  return (
    <div className="rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border/60 bg-muted/40 backdrop-blur-md">
              <th className="p-4 text-left font-semibold text-foreground/90 w-1/3">Resource</th>
              {COLUMNS.map(col => (
                <th key={col} className="p-4 text-center font-semibold text-muted-foreground/80 capitalize text-[12px] tracking-tight">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {PERMISSION_RESOURCES.map(resource => {
              const hasResourceWildcard = permissions.includes(`${resource.id}:*`);
              const isFullAccess = hasGlobalWildcard || hasResourceWildcard;

              return (
                <tr key={resource.id} className="hover:bg-primary/5 transition-all duration-200 group">
                  <td className="p-4">
                    <div
                      className="flex items-center gap-3 cursor-pointer select-none"
                      onClick={() => !isOwner && onToggleResource(resource.id)}
                    >
                      <div className={cn(
                        "size-4.5 rounded-md border flex items-center justify-center transition-all duration-300",
                        isFullAccess
                          ? "bg-primary border-primary text-primary-foreground shadow-[0_0_10px_rgba(var(--primary),0.3)]"
                          : "bg-background border-muted-foreground/30 group-hover:border-primary/60"
                      )}>
                        {isFullAccess && <Check className="size-3 stroke-[3.5]" />}
                      </div>
                      <span className={cn(
                        "font-semibold text-[13.5px] transition-colors",
                        isFullAccess ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                      )}>
                        {resource.name}
                      </span>
                    </div>
                  </td>
                  {COLUMNS.map(action => {
                    const isSupported = resource.actions.includes(action);
                    const permStr = `${resource.id}:${action}`;
                    const isChecked = isFullAccess || permissions.includes(permStr);

                    return (
                      <td key={action} className="p-4 text-center">
                        {isSupported ? (
                          <div
                            className={cn(
                              "inline-flex size-5.5 items-center justify-center rounded-md border transition-all duration-200 cursor-pointer mx-auto",
                              isChecked
                                ? "bg-primary/10 border-primary/40 text-primary shadow-inner"
                                : "border-muted-foreground/20 hover:border-primary/40 bg-background/50",
                              (isOwner || hasGlobalWildcard || hasResourceWildcard) && "opacity-40 cursor-not-allowed"
                            )}
                            onClick={() => {
                              if (!isOwner && !hasGlobalWildcard && !hasResourceWildcard) {
                                onTogglePermission(permStr);
                              }
                            }}
                          >
                            {isChecked && <Check className="size-4 stroke-[3]" />}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/10 font-mono text-[11px] select-none">:</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});

