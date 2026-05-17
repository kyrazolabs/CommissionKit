import { useState } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListReps, getListRepsQueryKey,
  useCreateRep,
  useUpdateRep,
  useDeleteRep,
  useListPlans, getListPlansQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Search, MoreHorizontal, Edit, Trash, ChevronRight, Users, Mail } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { useBillingStatus } from "@/hooks/use-billing-status";
import { useWorkspace } from "@/hooks/use-workspace";
import { apiFetch } from "@/lib/api";
import { usePageMeta } from "@/hooks/use-page-meta";


const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8088";

export function RepsPage() {
  usePageMeta({ title: "Reps", description: "Manage your sales representatives and their commission assignments.", robots: "noindex, nofollow" });
  const { data: reps, isLoading } = useListReps({ query: { queryKey: getListRepsQueryKey() } });
  const { data: plans } = useListPlans({ query: { queryKey: getListPlansQueryKey() } });
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { can, hasPermission, isLoading: roleLoading } = useRole();
  const { limits } = useBillingStatus();

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="size-10" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)}
        </div>
      </div>
    );
  }

  if (!hasPermission("reps", "read")) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
        <Users className="size-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold">Access Denied</h2>
        <p className="text-sm text-muted-foreground">You don't have permission to view sales representatives.</p>
      </div>
    );
  }

  const filteredReps = Array.isArray(reps) ? reps.filter(rep =>
    rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Team</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Sales Representatives</h1>
          <p className="text-[14px] text-muted-foreground mt-1">Manage your sales team and their commission plans.</p>
        </div>
        {hasPermission("reps", "create") && (
          <RepFormDialog 
            open={isCreateOpen} 
            onOpenChange={setIsCreateOpen} 
            plans={plans || []} 
            isLimitReached={limits.reps !== -1 && Array.isArray(reps) && reps.length >= limits.reps}
          />
        )}
      </div>

      <Card>
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder="Search reps…"
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-5 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : filteredReps.length === 0 ? (
            <div className="text-center p-10">
              <div className="bg-muted size-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Users className="size-6 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold">No reps found</h3>
              <p className="text-sm text-muted-foreground mt-1 mb-4">
                {searchTerm ? "Try adjusting your search query." : "Add your first sales representative to get started."}
              </p>
              {!searchTerm && (
                <Button onClick={() => setIsCreateOpen(true)}>
                  <Plus className="mr-2 size-4" />
                  Add Rep
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Commission Plan</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReps.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-primary text-[11px] font-semibold">
                          {rep.name.split(" ").map(n => n[0]).join("")}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{rep.name}</p>
                          <p className="text-xs text-muted-foreground">{rep.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{rep.role}</TableCell>
                    <TableCell>
                      {rep.planName ? (
                        <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground border-primary/20">
                          {rep.planName}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground italic">No plan</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(rep.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="size-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem asChild>
                            <Link href={`/reps/${rep.id}`} className="cursor-pointer w-full flex items-center">
                              <ChevronRight className="mr-2 size-4" />
                              View Portal
                            </Link>
                          </DropdownMenuItem>
                          {hasPermission("reps", "edit") && (
                            <>
                              <SendPortalLinkAction rep={rep} />
                              <RepEditAction rep={rep} plans={plans || []} />
                            </>
                          )}
                          {hasPermission("reps", "delete") && (
                            <RepDeleteAction rep={rep} />
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RepFormDialog({ open, onOpenChange, plans, initialData, isLimitReached }: any) {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [role, setRole] = useState(initialData?.role || "Account Executive");
  const [planId, setPlanId] = useState<string>(initialData?.planId?.toString() || "none");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const createMutation = useCreateRep();
  const updateMutation = useUpdateRep();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name, email, role,
      planId: planId === "none" ? null : planId
    };

    if (isEditing) {
      updateMutation.mutate({ id: initialData.id, data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRepsQueryKey() });
          toast({ title: "Rep updated", description: "The sales rep has been successfully updated." });
          onOpenChange(false);
        }
      });
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRepsQueryKey() });
          toast({ title: "Rep created", description: "The new sales rep has been added." });
          onOpenChange(false);
          setName(""); setEmail(""); setRole("Account Executive"); setPlanId("none");
        }
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button disabled={isLimitReached} title={isLimitReached ? "Limit reached. Upgrade plan." : ""}>
            <Plus className="mr-2 size-4" />
            {isLimitReached ? "Limit Reached" : "Add Rep"}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Representative" : "Add Representative"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update details for this sales representative." : "Create a new sales representative and assign them a commission plan."}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Role Title</Label>
              <Input id="role" value={role} onChange={e => setRole(e.target.value)} required />
            </div>
            <div className="grid gap-2">
              <Label>Commission Plan</Label>
              <Select value={planId} onValueChange={setPlanId}>
                <SelectTrigger><SelectValue placeholder="Select a plan" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No plan assigned</SelectItem>
                  {Array.isArray(plans) && plans.map((p: any) => (
                    <SelectItem key={p.id} value={p.id.toString()}>{p.name} ({p.type})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving…" : "Save"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function RepEditAction({ rep, plans }: { rep: any, plans: any[] }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <DropdownMenuItem onSelect={(e) => { e.preventDefault(); setOpen(true); }}>
        <Edit className="mr-2 size-4" />Edit Details
      </DropdownMenuItem>
      <RepFormDialog open={open} onOpenChange={setOpen} plans={plans} initialData={rep} />
    </>
  );
}

function SendPortalLinkAction({ rep }: { rep: any }) {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const { activeWorkspace } = useWorkspace();
  
  const queryClient = useQueryClient();

  const handleSend = async () => {
    setSending(true);
    try {
      await apiFetch(`/api/reps/${rep.id}/send-portal-link`, { 
        method: "POST",
       });
      queryClient.invalidateQueries({ queryKey: getListRepsQueryKey() });
      toast({
        title: "Portal link sent",
        description: `A new portal link has been emailed to ${rep.email}.`,
      });
    } catch {
      toast({
        title: "Failed to send",
        description: "Could not send the portal link. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <DropdownMenuItem
      onSelect={(e) => { e.preventDefault(); handleSend(); }}
      disabled={sending}
    >
      <Mail className="mr-2 size-4" />
      {sending ? "Sending…" : "Send Portal Link"}
    </DropdownMenuItem>
  );
}

function RepDeleteAction({ rep }: { rep: any }) {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const deleteMutation = useDeleteRep();

  const handleDelete = () => {
    deleteMutation.mutate({ id: rep.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListRepsQueryKey() });
        toast({ title: "Rep deleted", description: "The sales rep has been removed." });
        setOpen(false);
      }
    });
  };

  return (
    <>
      <DropdownMenuItem
        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        onSelect={(e) => { e.preventDefault(); setOpen(true); }}
      >
        <Trash className="mr-2 size-4" />Delete Rep
      </DropdownMenuItem>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This will permanently delete <strong>{rep.name}</strong>. Their historical deals and commissions will be retained, but they will no longer appear in the active roster.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting…" : "Delete Representative"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
