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
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
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

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

type MemberStatus = "active" | "pending";
type MemberRole = "owner" | "admin" | "member";

interface Member {
  id: string;
  userId: string | null;
  email: string;
  role: MemberRole;
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

function RoleBadge({ role }: { role: MemberRole }) {
  const { label, color, Icon } = ROLE_META[role];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-semibold", color)}>
      <Icon className="h-3 w-3" />
      {label}
    </span>
  );
}

function MemberAvatar({ email, status }: { email: string; status: MemberStatus }) {
  const initials = email.slice(0, 2).toUpperCase();
  return (
    <div className="relative shrink-0">
      <div className={cn(
        "flex h-9 w-9 items-center justify-center rounded-full text-[12px] font-bold",
        status === "active"
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground border border-dashed border-border",
      )}>
        {status === "pending" ? <Clock className="h-4 w-4" /> : initials}
      </div>
      {status === "active" && (
        <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-card" />
      )}
    </div>
  );
}

// ─── Invite Dialog ─────────────────────────────────────────────────────────────

function InviteMemberDialog({
  workspaceId, onInvited, isLimitReached, limit
}: { workspaceId: string; onInvited: () => void; isLimitReached: boolean; limit: number }) {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "member">("member");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/invite`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: email.trim(), role }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Invite failed");
      }
      toast({ title: "Invitation sent", description: `${email} was invited as ${role}.` });
      setEmail("");
      setRole("member");
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
          <UserPlus className="h-4 w-4" />
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
              autoFocus
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center gap-1.5">
              <Label>Role</Label>
              <HelpTooltip content="Owners and Admins can invite and manage members. Members have read access only." />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {(["member", "admin"] as const).map((r) => {
                const meta = ROLE_META[r];
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className={cn(
                      "flex flex-col gap-1 rounded-xl border p-3 text-left transition-all",
                      role === r
                        ? "border-primary/40 bg-secondary"
                        : "border-border hover:bg-muted",
                    )}
                  >
                    <div className="flex items-center gap-1.5">
                      <meta.Icon className={cn("h-3.5 w-3.5", role === r ? "text-primary" : "text-muted-foreground")} />
                      <span className={cn("text-[13px] font-semibold", role === r ? "text-foreground" : "text-muted-foreground")}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-tight">{meta.description}</p>
                  </button>
                );
              })}
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
  member, currentUserId, workspaceId, canManage, isOwner, onChanged,
}: {
  member: Member;
  currentUserId: string | null;
  workspaceId: string;
  canManage: boolean;
  isOwner: boolean;
  onChanged: () => void;
}) {
  const { toast } = useToast();
  const [updating, setUpdating] = useState(false);
  const isSelf = member.userId === currentUserId;
  const isProtected = member.role === "owner";

  const updateRole = async (newRole: MemberRole) => {
    if (newRole === member.role) return;
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${member.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error((await res.json()).error);
      toast({ title: "Role updated", description: `${member.email} is now ${newRole}.` });
      onChanged();
    } catch (err: any) {
      toast({ title: "Failed to update role", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  const removeMember = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${workspaceId}/members/${member.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok && res.status !== 204) throw new Error((await res.json()).error);
      toast({ title: isSelf ? "Left workspace" : "Member removed" });
      onChanged();
    } catch (err: any) {
      toast({ title: "Failed to remove", description: err.message, variant: "destructive" });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className={cn(
      "flex items-center gap-4 px-5 py-3.5 border-b border-border last:border-0 transition-colors",
      updating && "opacity-50 pointer-events-none",
    )}>
      <MemberAvatar email={member.email} status={member.status} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-[13.5px] font-semibold text-foreground truncate">{member.email}</p>
          {isSelf && (
            <span className="text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
              You
            </span>
          )}
          {member.status === "pending" && (
            <span className="text-[10px] font-medium text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400 border border-amber-200 dark:border-amber-800/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <Mail className="h-2.5 w-2.5" /> Invite pending
            </span>
          )}
          {member.status === "active" && !isSelf && (
            <span className="text-[10px] font-medium text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-400 border border-green-200 dark:border-green-800/30 px-1.5 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="h-2.5 w-2.5" /> Active
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
          <Select value={member.role} onValueChange={(v) => updateRole(v as MemberRole)}>
            <SelectTrigger className="h-7 text-[12px] w-auto gap-1.5 pr-2 border-0 bg-transparent hover:bg-muted rounded-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value="member">Member</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <RoleBadge role={member.role} />
        )}

        {/* Actions */}
        {(canManage || isSelf) && !isProtected && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {canManage && isOwner && !isProtected && (
                <>
                  <DropdownMenuItem onClick={() => updateRole("admin")} disabled={member.role === "admin"}>
                    <Shield className="h-3.5 w-3.5 mr-2" /> Make Admin
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => updateRole("member")} disabled={member.role === "member"}>
                    <Users className="h-3.5 w-3.5 mr-2" /> Make Member
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}
              <DropdownMenuItem
                onClick={removeMember}
                className="text-destructive focus:text-destructive focus:bg-destructive/10"
              >
                <Trash2 className="h-3.5 w-3.5 mr-2" />
                {isSelf ? "Leave workspace" : "Remove member"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// ─── Role Reference Card ──────────────────────────────────────────────────────

function RoleReference() {
  return (
    <div className="bg-card border border-card-border rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center gap-1.5">
          <p className="text-[14px] font-bold text-foreground">Role Reference</p>
          <HelpTooltip content="Roles are applied at the workspace level. Contact support to transfer ownership." />
        </div>
        <p className="text-[12px] text-muted-foreground mt-0.5">Permissions granted per role</p>
      </div>
      <div className="divide-y divide-border">
        {(Object.entries(ROLE_META) as [MemberRole, typeof ROLE_META[MemberRole]][]).map(([role, meta]) => (
          <div key={role} className="px-5 py-3.5 flex items-start gap-3">
            <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border", meta.color)}>
              <meta.Icon className="h-3.5 w-3.5" />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">{meta.label}</p>
              <p className="text-[11.5px] text-muted-foreground mt-0.5 leading-relaxed">{meta.description}</p>
            </div>
          </div>
        ))}
        <div className="px-5 py-3 bg-muted/30">
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
  const { activeWorkspace } = useWorkspace();
  const { user } = useAuth();
  const { role, can, is } = useRole();
  const { limits } = useBillingStatus();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMembers = useCallback(async () => {
    if (!activeWorkspace) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/workspaces/${activeWorkspace.id}/members`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        // Sort: owner first, then admin, then member; active before pending
        const rankRole = (r: MemberRole) => ({ owner: 0, admin: 1, member: 2 }[r] ?? 3);
        const rankStatus = (s: MemberStatus) => (s === "active" ? 0 : 1);
        data.sort((a: Member, b: Member) =>
          rankRole(a.role) - rankRole(b.role) || rankStatus(a.status) - rankStatus(b.status),
        );
        setMembers(data);
      }
    } finally {
      setLoading(false);
    }
  }, [activeWorkspace]);

  useEffect(() => { fetchMembers(); }, [fetchMembers]);

  if (!activeWorkspace) return null;

  const activeMembers = members.filter((m) => m.status === "active");
  const pendingMembers = members.filter((m) => m.status === "pending");

  return (
    <div className="space-y-7 max-w-4xl">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Organization</p>
          <h1 className="text-[28px] font-bold tracking-tight text-foreground leading-tight">Team & Roles</h1>
          <p className="text-[14px] text-muted-foreground mt-1">
            Manage who has access to{" "}
            <span className="font-medium text-foreground">{activeWorkspace.name}</span>
            {" "}and what they can do.
          </p>
        </div>
        {can("admin") && (
          <InviteMemberDialog 
            workspaceId={activeWorkspace.id} 
            onInvited={fetchMembers} 
            isLimitReached={limits.members !== -1 && members.length >= limits.members}
            limit={limits.members}
          />
        )}
      </div>

      {/* Role banner for current user */}
      <div className={cn(
        "flex items-center gap-3 rounded-xl border px-4 py-3",
        is("owner") && "bg-amber-50 border-amber-200 dark:bg-amber-900/10 dark:border-amber-800/30",
        is("admin") && "bg-blue-50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-800/30",
        is("member") && "bg-muted border-border",
      )}>
        {(() => {
          const meta = ROLE_META[role];
          return (
            <>
              <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full border", meta.color)}>
                <meta.Icon className="h-4 w-4" />
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
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[14.5px] font-bold text-foreground">Members</p>
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                  {activeMembers.length} active
                  {pendingMembers.length > 0 && ` · ${pendingMembers.length} pending`}
                  {limits.members !== -1 && ` / ${limits.members} total`}
                </span>
              </div>
              <p className="text-[12px] text-muted-foreground mt-0.5">
                {activeWorkspace.name} workspace
              </p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={fetchMembers}>
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>

          {/* Member rows */}
          {loading ? (
            <div className="divide-y divide-border">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                  <Skeleton className="h-9 w-9 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : members.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-6">
              <Users className="h-10 w-10 text-muted-foreground mb-3" />
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
                  canManage={can("admin")}
                  isOwner={is("owner")}
                  onChanged={fetchMembers}
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
