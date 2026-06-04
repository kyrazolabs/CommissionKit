import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Crown, Shield, Users, UserPlus, MoreHorizontal, Mail,
  Trash2, RefreshCw, Clock, CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { HelpTooltip } from "@/components/help-tooltip";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { Checkbox } from "@/components/ui/checkbox";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { usePageMeta } from "@/hooks/use-page-meta";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

type MemberStatus = "active" | "pending";
type MemberRole = "owner" | "admin" | "member";

interface Member {
  id: string;
  userId: string | null;
  email: string;
  role: MemberRole; // legacy fallback
  roleIds: string[];
  status: MemberStatus;
  createdAt: string;
}

// ─── Role Meta ────────────────────────────────────────────────────────────────

const ROLE_META: Record<MemberRole, { label: string; description: string; color: string; Icon: typeof Crown }> = {
  owner: {
    label: "Owner",
    description: "Full access, including billing and workspace deletion.",
    color: "text-amber-600 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800/30",
    Icon: Crown,
  },
  admin: {
    label: "Admin",
    description: "Manage team members, plans, deals and runs.",
    color: "text-blue-600 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:border-blue-800/30",
    Icon: Shield,
  },
  member: {
    label: "Member",
    description: "Read-only access to dashboards and reports.",
    color: "text-muted-foreground bg-muted border-border",
    Icon: Users,
  },
};

function RoleBadge({ member, rolesList }: { member: Member, rolesList: any[] }) {
  if (member.role === "owner" || member.roleIds?.length === 0) {
    const r = member.role || "member";
    const meta = ROLE_META[r as MemberRole] || ROLE_META.member;
    return (
      <span className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold", meta.color)}>
        <meta.Icon className="size-3" />
        {meta.label}
      </span>
    );
  }
  
  // Custom roles
  return (
    <div className="flex flex-wrap gap-1">
      {member.roleIds.map(id => {
        const customRole = rolesList.find(r => r.id === id);
        if (!customRole) return null;
        return (
          <span key={id} className="inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold text-primary bg-primary/10 border-primary/20">
            <Shield className="size-3" />
            {customRole.name}
          </span>
        );
      })}
    </div>
  );
}

function MemberAvatar({ email, status }: { email: string; status: MemberStatus }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <div className="relative shrink-0">
      <div className={cn(
        "flex size-9 items-center justify-center rounded-full text-[12px] font-semibold",
        status === "active"
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground border border-dashed border-border",
      )}>
        {status === "pending" ? <Clock className="size-4" /> : initials}
      </div>
      {status === "active" && (
        <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-green-500 border-2 border-card" />
      )}
    </div>
  );
}

// ─── Invite Dialog ─────────────────────────────────────────────────────────────

function InviteMemberDialog({
  workspaceId, onInvited, isLimitReached, limit, rolesList
}: { workspaceId: string; onInvited: () => void; isLimitReached: boolean; limit: number; rolesList: any[] }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [roleIds, setRoleIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      await apiFetch(`/api/workspaces/${workspaceId}/members/invite`, {
        method: "POST",
        body: JSON.stringify({ email: email.trim(), roleIds }),
      });
      toast({ title: "Invitation sent", description: `${email} was invited.` });
      setEmail("");
      setRoleIds([]);
      setOpen(false);
      onInvited();
    } catch (err: any) {
      toast({ title: "Failed to invite", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2" disabled={isLimitReached}>
          <UserPlus className="size-4" />
          {isLimitReached ? `Limit Reached (${limit})` : "Invite Member"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Invite a Team Member</DialogTitle>
          <DialogDescription>
            They'll receive an email link. Until they accept, they appear as pending.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleInvite} className="grid gap-5 py-2">
          <div className="grid gap-2">
            <Label htmlFor="invite-email">Email address</Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-1.5">
              <Label>Role</Label>
              <HelpTooltip content="Owners and Admins can invite and manage members. Members have read access only." />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1">
              {rolesList.reduce((acc: any[], r: any) => {
                if (r.name === "Owner") return acc;
                const isSelected = roleIds.includes(r.id);
                acc.push(
                  <div
                    key={r.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setRoleIds(prev => prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id])
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setRoleIds(prev => prev.includes(r.id) ? prev.filter(id => id !== r.id) : [...prev, r.id])
                      }
                    }}
                    className={cn(
                      "flex items-start gap-2 rounded-xl border p-3 text-left transition-all cursor-pointer",
                      isSelected
                        ? "border-primary/40 bg-secondary"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <div className={cn(
                      "size-4 shrink-0 rounded border border-primary flex items-center justify-center transition-colors mt-0.5",
                      isSelected ? "bg-primary text-primary-foreground" : "bg-transparent"
                    )}>
                      {isSelected && <CheckCircle2 className="size-3" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className={cn("text-[13px] font-semibold truncate", isSelected ? "text-foreground" : "text-muted-foreground")}>
                          {r.name}
                        </span>
                        {r.isSystem && <span className="text-[9px] bg-muted p-1.5 rounded text-muted-foreground">SYSTEM</span>}
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{r.description}</p>
                    </div>
                  </div>
                );
                return acc;
              }, [])}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={loading || !email.trim()}>
              {loading ? "Sending…" : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Member Row ────────────────────────────────────────────────────────────────

function MemberRow({
  member, currentUserId, workspaceId, canManage, isOwner, onChanged, rolesList
}: {
  member: Member;
  currentUserId: string | null;
  workspaceId: string;
  canManage: boolean;
  isOwner: boolean;
  onChanged: () => void;
  rolesList: any[];
}) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const { hasPermission } = useRole()
  const isSelf = member.userId === currentUserId;
  const isProtected = member.role === "owner";

  const updateRole = async (newRoleIds: string[]) => {
    setUpdating(true);
    try {
      await apiFetch(`/api/workspaces/${workspaceId}/members/${member.id}`, {
        method: "PATCH",
        body: JSON.stringify({ roleIds: newRoleIds }),
      });
      toast({ title: "Roles updated", description: `${member.email}'s roles have been updated.` });
      onChanged();
    } catch (err: any) {
      toast({ title: "Failed to update role", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const handleRemoveMember = async () => {
    setUpdating(true);
    try {
      await apiFetch(`/api/workspaces/${workspaceId}/members/${member.id}`, {
        method: "DELETE",
      });
      toast({ title: isSelf ? "Left workspace" : "Member removed" });
      onChanged();
    } catch (err: any) {
      toast({ title: "Failed to remove", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-4 p-5 border-b border-border last:border-0 transition-colors",
      updating && "opacity-50 pointer-events-none",
    )}>
      <MemberAvatar email={member.email} status={member.status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13.5px] font-semibold text-foreground truncate">{member.email}</p>
          {isSelf && (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
              You
            </span>
          )}
          {member.status === "pending" && (
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <Mail className="size-2.5" /> Invite pending
            </span>
          )}
          {member.status === "active" && !isSelf && (
            <span className="text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800/30 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="size-2.5" /> Active
            </span>
          )}
        </div>
        <p className="text-[11.5px] text-muted-foreground mt-0.5">
          Added {new Date(member.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </p>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Role badge / selector */}
        {canManage && isOwner && !isProtected ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs rounded-full">
                {member.roleIds?.length || 0} Roles
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 p-2">
              <div className="mb-2 px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assign Roles</div>
              <div className="max-h-[200px] overflow-y-auto">
                {rolesList.reduce((acc, r) => {
                  if (r.name === "Owner") return acc;
                  const isSelected = member.roleIds?.includes(r.id);
                  acc.push(
                    <DropdownMenuItem 
                      key={r.id}
                      className="flex items-center gap-2 py-2"
                      onClick={(e) => {
                        e.preventDefault();
                        const nextIds = isSelected 
                          ? member.roleIds.filter((id: string) => id !== r.id)
                          : [...(member.roleIds || []), r.id];
                        updateRole(nextIds);
                      }}
                    >
                      <Checkbox checked={isSelected} className="pointer-events-none" />
                      <div className="flex-1 truncate text-[13px]">{r.name}</div>
                      {isSelected && <div className="size-1.5 rounded-full bg-primary" />}
                    </DropdownMenuItem>
                  );
                  return acc;
                }, [] as React.ReactNode[])}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <RoleBadge member={member} rolesList={rolesList} />
        )}

        {/* Actions */}
        {(hasPermission("team", "delete") || isSelf) && !isProtected && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              <DropdownMenuItem
                onClick={() => setDeleteConfirmOpen(true)}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="size-3.5 mr-2" />
                {isSelf ? "Leave workspace" : "Remove member"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={isSelf ? "Leave Workspace" : "Remove Member"}
        description={isSelf
          ? <>Are you sure you want to leave <strong>{member.email}</strong> from this workspace?</>
          : <>Are you sure you want to remove <strong>{member.email}</strong> from this workspace? This action can be undone by re-inviting them.</>
        }
        confirmLabel={isSelf ? "Leave" : "Remove"}
        onConfirm={handleRemoveMember}
      />
    </div>
  );
}

// ─── Role Reference Card ──────────────────────────────────────────────────────

function RoleReference() {
  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-1.5">
          <p className="text-[14px] font-semibold text-foreground">Role Reference</p>
          <HelpTooltip content="Roles are applied at the workspace level. Contact support to transfer ownership." />
        </div>
        <p className="text-[12px] text-muted-foreground mt-0.5">Permissions granted per role</p>
      </div>
      <div className="divide-y divide-border">
        {(Object.entries(ROLE_META) as [MemberRole, typeof ROLE_META[MemberRole]][]).map(([role, meta]) => (
          <div key={role} className="p-5 flex items-start gap-3">
            <div className={cn("flex size-7 shrink-0 items-center justify-center rounded-full border", meta.color)}>
              <meta.Icon className="size-3.5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">{meta.label}</p>
              <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-relaxed">{meta.description}</p>
            </div>
          </div>
        ))}
        <div className="p-5 bg-muted/30">
          <p className="text-[11px] text-muted-foreground">
            <span className="font-medium text-foreground">Owners</span> have all Admin permissions plus billing access and workspace deletion.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────

export function TeamPage() {
  usePageMeta({ title: "Team", description: "Manage team members, roles, and workspace access.", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { role, can, is, hasPermission, isLoading: roleLoading } = useRole();
  const { limits } = useBillingStatus();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => apiFetch("/api/roles"),
    enabled: !!activeWorkspace,
  });

  const fetchMembers = useCallback(async () => {
    if (!activeWorkspace?.id) return;
    setLoading(true);
    try {
      const data = await apiFetch(`/api/workspaces/${activeWorkspace.id}/members`);
      // Sort: owner first, then admin, then member; active before pending
      const rankRole = (r: MemberRole) => ({ owner: 0, admin: 1, member: 2 }[r] ?? 3);
      const rankStatus = (s: MemberStatus) => (s === "active" ? 0 : 1);
      data.sort((a: Member, b: Member) =>
        rankRole(a.role) - rankRole(b.role) || rankStatus(a.status) - rankStatus(b.status),
      );
      setMembers(data);
    } catch (err) {
      console.error("Failed to fetch members:", err);
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (!hasPermission("team", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <Users className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view the team roster.</p>
      </div>
    );
  }

  if (!activeWorkspace) return null;

  const activeMembers = members.filter((m) => m.status === "active");
  const pendingMembers = members.filter((m) => m.status === "pending");

  return (
    <div className="space-y-7 max-w-4xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Organization</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Team & Roles</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Manage who has access to{" "}
            <span className="font-medium text-foreground">{activeWorkspace.name}</span>
            {" "}and what they can do.
          </p>
        </div>
        {hasPermission("team", "create") && (
            <InviteMemberDialog 
              workspaceId={activeWorkspace.id} 
              onInvited={fetchMembers} 
              isLimitReached={limits.members !== -1 && members.length >= limits.members}
              limit={limits.members}
              rolesList={roles}
            />
        )}
      </div>

      {/* Role banner for current user */}
      <div className={cn(
        "flex items-center gap-3 rounded-xl border p-4",
        is("owner") && "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30",
        is("admin") && "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/30",
        is("member") && "bg-muted border-border",
      )}>
        {(() => {
          const meta = ROLE_META[role];
          return (
            <>
              <div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full border", meta.color)}>
                <meta.Icon className="size-4" />
              </div>
              <div>
                <p className="text-[13px] font-semibold text-foreground">
                  You are a <span className="capitalize">{meta.label}</span> in this workspace
                </p>
                <p className="text-[12px] text-muted-foreground">{meta.description}</p>
              </div>
            </>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Members list */}
        <div className="lg:col-span-2 bg-card border border-card-border rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[14.5px] font-semibold text-foreground">Members</p>
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2.5 py-0.5 rounded-full">
                  {activeMembers.length} active
                  {pendingMembers.length > 0 && ` · ${pendingMembers.length} pending`}
                  {limits.members !== -1 && ` / ${limits.members} total`}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {activeWorkspace.name} workspace
              </p>
            </div>
            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground" onClick={fetchMembers}>
              <RefreshCw className="size-3.5" />
            </Button>
          </div>

          {/* Member rows */}
          {loading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 p-5">
                  <Skeleton className="size-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="size-3.5" />
                    <Skeleton className="size-3" />
                  </div>
                  <Skeleton className="size-6 rounded-full" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Users className="size-10 text-muted-foreground mb-3" />
              <p className="text-[14px] font-semibold text-foreground">No members yet</p>
              <p className="text-[12.5px] text-muted-foreground mt-1">
                Invite your team to start collaborating.
              </p>
            </div>
          ) : (
            <div>
              {members.map((m) => (
                <MemberRow
                  key={m.id}
                  member={m}
                  currentUserId={user?.id ?? null}
                  workspaceId={activeWorkspace.id}
                  canManage={hasPermission("team", "edit")}
                  isOwner={is("owner")}
                  onChanged={fetchMembers}
                  rolesList={roles}
                />
              ))}
            </div>
          )}
        </div>

        {/* Role reference sidebar */}
        <RoleReference />
      </div>
    </div>
  );
}
