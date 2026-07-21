import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSyncStore } from "@/hooks/use-sync-store";
import {
  useCreateRep,
  useUpdateRep,
  useDeleteRep,
  useListPlans as orvalUseListPlans, getListPlansQueryKey
} from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataPagination } from "@/components/ui/data-pagination";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { RepAvatar } from "@/components/rep-avatar";
import { HelpTooltip } from "@/components/help-tooltip";
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



export function RepsPage() {
  const { t } = useTranslation();
  usePageMeta({ title: t("reps.title"), description: "Manage your sales representatives and their commission assignments.", keywords: "sales reps, commission representatives, rep management, sales team, commission assignments", robots: "noindex, nofollow" });
  const { data: plans } = orvalUseListPlans({ query: { queryKey: getListPlansQueryKey() } });
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { can, hasPermission, isLoading: roleLoading } = useRole();
  const { limits } = useBillingStatus();
  const [page, setPage] = useState(1);
  const LIMIT = 50;

  // Unfiltered total for limit check (search-filtered total is inaccurate)
  const { data: totalRepsForLimit } = useQuery({
    queryKey: ["/api/reps", "count"],
    queryFn: () => apiFetch("/api/reps?limit=1&page=1") as Promise<{ pagination: { total: number } }>,
    staleTime: 1000 * 60,
  });

  const { data: repsResult, isLoading, error } = useQuery({
    queryKey: ["/api/reps", page, searchTerm],
    queryFn: () => {
      const sp = new URLSearchParams();
      sp.set("page", String(page));
      sp.set("limit", String(LIMIT));
      if (searchTerm.trim()) sp.set("search", searchTerm.trim());
      return apiFetch(`/api/reps?${sp}`) as Promise<{ data: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>;
    },
  });
  const reps = repsResult?.data ?? [];
  const pagination = repsResult?.pagination;

  // Reset to page 1 when search term changes
  useEffect(() => { setPage(1); }, [searchTerm]);

  if (roleLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
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
        <h2 className="text-lg font-semibold">{t("reps.accessDenied")}</h2>
        <p className="text-sm text-muted-foreground">{t("reps.noPermissionReps")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">{t("reps.team")}</p>
          <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">{t("reps.title")}</h1>
          <p className="text-[14px] text-muted-foreground mt-1">{t("reps.description")}</p>
        </div>
        {hasPermission("reps", "create") && (
          <RepFormDialog
            open={isCreateOpen}
            onOpenChange={setIsCreateOpen}
            plans={plans || []}
            isLimitReached={limits.reps !== -1 && (totalRepsForLimit?.pagination?.total ?? 0) >= limits.reps}
          />
        )}
      </div>

      <Card>
        <div className="px-5 pt-4 pb-3 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
            <Input
              placeholder={t("reps.searchReps")}
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
           ) : reps.length === 0 ? (
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
            <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1.5">
                      Role
                      <HelpTooltip content="The rep's permission level within this workspace." />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1.5">
                      Commission Plan
                      <HelpTooltip content="The commission plan assigned to this rep. Determines how their deals are calculated." />
                    </div>
                  </TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1.5">
                      Joined
                      <HelpTooltip content="When this rep was added to the workspace." />
                    </div>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reps.map((rep) => (
                  <TableRow key={rep.id}>
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <RepAvatar name={rep.name} size={32} className="size-8 shrink-0 rounded-full" />
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
                            <Link href={`/dash/reps/${rep.id}`} className="cursor-pointer w-full flex items-center">
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
            {pagination ? (
              <div className="border-t px-4 py-3">
                <DataPagination
                  page={page}
                  totalPages={pagination.totalPages}
                  total={pagination.total}
                  limit={LIMIT}
                  onPageChange={setPage}
                />
              </div>
            ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function RepFormDialog({ open, onOpenChange, plans, initialData, isLimitReached }: any) {
  const { t } = useTranslation();
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [role, setRole] = useState(initialData?.role || "Account Executive");
  const [planId, setPlanId] = useState<string>(initialData?.planId?.toString() || "none");
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setSyncError } = useSyncStore();

  const createMutation = useCreateRep({
    mutation: {
      onMutate: async ({ data }) => {
        await queryClient.cancelQueries({ queryKey: ["/api/reps"] });
        const previousQueries = queryClient.getQueriesData({ queryKey: ["/api/reps"] });

        let planName = null;
        if (data.planId && Array.isArray(plans)) {
          const plan = plans.find(p => p.id.toString() === data.planId?.toString());
          if (plan) planName = plan.name;
        }

        const optimisticRep = {
          id: `temp-${Date.now()}`,
          name: data.name,
          email: data.email,
          role: data.role,
          planId: data.planId,
          planName: planName,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        queryClient.setQueriesData({ queryKey: ["/api/reps"] }, (old: any) => {
          return Array.isArray(old) ? [optimisticRep, ...old] : [optimisticRep];
        });

        return { previousQueries };
      },
      onError: (err, newRep, context) => {
        setSyncError(true);
        if (context?.previousQueries) {
          context.previousQueries.forEach(([queryKey, oldData]: [any, any]) => {
            queryClient.setQueryData(queryKey, oldData);
          });
        }
        toast({ title: t("reps.repCreateFailed"), description: t("reps.recoveringInput"), variant: "destructive" });
        onOpenChange(true);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/reps"] });
      }
    }
  });

  const updateMutation = useUpdateRep({
    mutation: {
      onMutate: async ({ id, data }) => {
        await queryClient.cancelQueries({ queryKey: ["/api/reps"] });
        const previousQueries = queryClient.getQueriesData({ queryKey: ["/api/reps"] });

        let planName = initialData?.planName || null;
        if (data.planId && Array.isArray(plans)) {
          const plan = plans.find(p => p.id.toString() === data.planId?.toString());
          if (plan) planName = plan.name;
        } else if (!data.planId) {
          planName = null;
        }

        queryClient.setQueriesData({ queryKey: ["/api/reps"] }, (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.map(rep => rep.id === id ? { ...rep, ...data, planName } : rep);
        });

        return { previousQueries };
      },
      onError: (err, variables, context) => {
        setSyncError(true);
        if (context?.previousQueries) {
          context.previousQueries.forEach(([queryKey, oldData]: [any, any]) => {
            queryClient.setQueryData(queryKey, oldData);
          });
        }
        toast({ title: t("reps.repUpdateFailed"), description: "Recovering your input...", variant: "destructive" });
        onOpenChange(true);
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/reps"] });
      }
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name, email, role,
      planId: planId === "none" ? null : planId
    };

    if (isEditing) {
      updateMutation.mutate({ id: initialData.id, data }, {
        onSuccess: () => toast({ title: t("reps.repUpdated") })
      });
      onOpenChange(false);
    } else {
      createMutation.mutate({ data }, {
        onSuccess: () => {
          toast({ title: t("reps.repCreated") });
          setName(""); setEmail(""); setRole("Account Executive"); setPlanId("none");
        }
      });
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {!isEditing && (
        <DialogTrigger asChild>
          <Button disabled={isLimitReached} title={isLimitReached ? "Limit reached. Upgrade plan." : ""}>
            <Plus className="mr-2 size-4" />
            {isLimitReached ? t("common.limitReached") : t("reps.addRep")}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? t("reps.editRepresentative") : t("reps.addRepresentative")}</DialogTitle>
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
                <SelectTrigger><SelectValue placeholder={t("reps.selectPlan")} /></SelectTrigger>
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
            <Button type="submit">Save</Button>
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
  const { t } = useTranslation();
  const [sending, setSending] = useState(false);
  const { activeWorkspace } = useWorkspace();

  const queryClient = useQueryClient();

  const handleSend = async () => {
    setSending(true);
    try {
      await apiFetch(`/api/reps/${rep.id}/send-portal-link`, {
        method: "POST",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/reps"] });
      toast({
        title: t("reps.portalLinkSent"),
        description: `A new portal link has been emailed to ${rep.email}.`,
      });
    } catch {
      toast({
        title: t("reps.failedToSend"),
        description: t("reps.failedToSendDescription"),
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
      {sending ? t("common.sending2") : t("reps.sendPortalLink")}
    </DropdownMenuItem>
  );
}

function RepDeleteAction({ rep }: { rep: any }) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { setSyncError } = useSyncStore();

  const deleteMutation = useDeleteRep({
    mutation: {
      onMutate: async ({ id }) => {
        await queryClient.cancelQueries({ queryKey: ["/api/reps"] });
        const previousQueries = queryClient.getQueriesData({ queryKey: ["/api/reps"] });

        queryClient.setQueriesData({ queryKey: ["/api/reps"] }, (old: any) => {
          if (!Array.isArray(old)) return old;
          return old.filter((r: any) => r.id !== id);
        });

        return { previousQueries };
      },
      onError: (err, variables, context) => {
        setSyncError(true);
        if (context?.previousQueries) {
          context.previousQueries.forEach(([queryKey, oldData]: [any, any]) => {
            queryClient.setQueryData(queryKey, oldData);
          });
        }
        toast({ title: t("reps.repDeleteFailed"), description: "The server encountered an error.", variant: "destructive" });
      },
      onSettled: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/reps"] });
      }
    }
  });

  const handleDelete = () => {
    setOpen(false);
    deleteMutation.mutate({ id: rep.id });
  };

  return (
    <>
      <DropdownMenuItem
        className="text-destructive focus:bg-destructive/10 focus:text-destructive"
        onSelect={(e) => { e.preventDefault(); setOpen(true); }}
      >
        <Trash className="mr-2 size-4" />Delete Rep
      </DropdownMenuItem>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("reps.deleteRepTitle")}
        description={<>This will permanently delete <strong>{rep.name}</strong>. Their historical deals and commissions will be retained, but they will no longer appear in the active roster.</>}
        confirmLabel={t("reps.deleteRepConfirm")}
        onConfirm={handleDelete}
      />
    </>
  );
}
