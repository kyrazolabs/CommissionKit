import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { 
  useListPlans, getListPlansQueryKey, 
  useCreatePlan, useUpdatePlan, useDeletePlan 
} from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Edit, Trash, FileText, Layers, Zap, Trash2 } from "lucide-react";
import { formatCurrency, formatPercent } from "@/lib/format";
import { HelpTooltip } from "@/components/help-tooltip";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useRole } from "@/hooks/use-role";
import { useBillingStatus } from "@/hooks/use-billing-status";

export function PlansPage() {
  const { data: plans, isLoading } = useListPlans({ query: { queryKey: getListPlansQueryKey() } });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const { can } = useRole();
  const { sub, limits } = useBillingStatus();

  const isLimitReached = limits.plans !== -1 && Array.isArray(plans) && plans.length >= limits.plans;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Commission Plans</h1>
          <p className="text-muted-foreground">Design and manage compensation structures.</p>
        </div>
        {can("admin") && (
          <Button 
            onClick={() => setIsCreateOpen(true)}
            disabled={isLimitReached}
            title={isLimitReached ? "Limit reached. Upgrade plan." : ""}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isLimitReached ? "Limit Reached" : "Create Plan"}
          </Button>
        )}
      </div>

      <PlanFormDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} sub={sub} />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader><Skeleton className="h-6 w-3/4 mb-2" /><Skeleton className="h-4 w-1/2" /></CardHeader>
              <CardContent><Skeleton className="h-24 w-full" /></CardContent>
            </Card>
          ))}
        </div>
      ) : (!Array.isArray(plans) || plans.length === 0) ? (
        <div className="text-center py-16 bg-muted/30 rounded-xl border border-dashed">
          <div className="bg-muted w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="h-6 w-6 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium">No plans created</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-6 max-w-sm mx-auto">
            Build your first commission plan to assign to sales representatives. Support for flat rates, tiers, and accelerators.
          </p>
          <Button 
            onClick={() => setIsCreateOpen(true)}
            disabled={isLimitReached}
            title={isLimitReached ? "Limit reached. Upgrade plan." : ""}
          >
            <Plus className="mr-2 h-4 w-4" />
            {isLimitReached ? "Limit Reached" : "Create Plan"}
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} sub={sub} />
          ))}
        </div>
      )}
    </div>
  );
}

function PlanCard({ plan, sub }: { plan: any, sub: any }) {
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { can } = useRole();
  const deleteMutation = useDeletePlan();

  const handleDelete = () => {
    deleteMutation.mutate({ id: plan.id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListPlansQueryKey() });
        toast({ title: "Plan deleted", description: "The commission plan has been removed." });
        setIsDeleteOpen(false);
      }
    });
  };

  const getPlanIcon = () => {
    switch (plan.type) {
      case "flat": return <FileText className="h-5 w-5 text-blue-500" />;
      case "tiered": return <Layers className="h-5 w-5 text-indigo-500" />;
      case "accelerator": return <Zap className="h-5 w-5 text-amber-500" />;
      default: return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-muted rounded-md">{getPlanIcon()}</div>
            <div>
              <CardTitle className="text-lg">{plan.name}</CardTitle>
              <div className="flex items-center gap-1.5">
                <CardDescription className="capitalize">{plan.type} Plan</CardDescription>
                <HelpTooltip content={
                  plan.type === "flat" ? "Standard percentage earned on every deal amount." :
                  plan.type === "tiered" ? "Progressive rates that increase as volume reaches specific milestones." :
                  "Higher incentive rate applied only after passing a specific revenue threshold."
                } />
              </div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        <div className="space-y-4">
          {plan.type === "flat" && (
            <div className="bg-muted/50 p-4 rounded-lg flex justify-between items-center">
              <span className="text-sm font-medium">Flat Rate</span>
              <span className="text-lg font-bold">{formatPercent(plan.flatRate || 0)}</span>
            </div>
          )}

          {plan.type === "accelerator" && (
            <div className="space-y-2">
              <div className="bg-muted/50 p-3 rounded-lg flex justify-between items-center">
                <span className="text-sm font-medium">Base Rate</span>
                <span className="font-bold">{formatPercent(plan.flatRate || 0)}</span>
              </div>
              <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-primary">Accelerator Rate</span>
                  <span className="font-bold text-primary">{formatPercent(plan.acceleratorRate || 0)}</span>
                </div>
                <p className="text-xs text-primary/80">Applied above {formatCurrency(plan.acceleratorThreshold || 0)}</p>
              </div>
            </div>
          )}

          {plan.type === "tiered" && plan.tiers && (
            <div className="space-y-2">
              <span className="text-sm font-medium text-muted-foreground block mb-2">Tiers Structure</span>
              <div className="space-y-1">
                {plan.tiers?.map((tier: any, i: number) => (
                  <div key={tier.id || i} className="flex justify-between items-center text-sm p-2 bg-muted/30 rounded border border-border/50">
                    <span className="text-muted-foreground">
                      {formatCurrency(tier.fromAmount)} {tier.toAmount ? `- ${formatCurrency(tier.toAmount)}` : '+'}
                    </span>
                    <span className="font-semibold">{formatPercent(tier.rate)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {plan.clawbackDays && (
            <div className="text-xs text-muted-foreground pt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-destructive"></span>
              <span>{plan.clawbackDays} day clawback period</span>
              <HelpTooltip content="If a deal is reversed or cancelled within this period, the commission will be deducted from the rep." />
            </div>
          )}
        </div>
      </CardContent>
      {can("admin") && (
        <CardFooter className="border-t bg-muted/20 pt-4 flex justify-between">
          <Button variant="outline" size="sm" onClick={() => setIsEditOpen(true)}>
            <Edit className="h-4 w-4 mr-2" /> Edit
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setIsDeleteOpen(true)}>
            <Trash className="h-4 w-4" />
          </Button>
        </CardFooter>
      )}

      <PlanFormDialog open={isEditOpen} onOpenChange={setIsEditOpen} initialData={plan} sub={sub} />

      <Dialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{plan.name}</strong>? This action cannot be undone. Reps assigned to this plan will need a new plan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteMutation.isPending}>
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function PlanFormDialog({ open, onOpenChange, initialData, sub }: any) {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name || "");
  const [type, setType] = useState<"flat" | "tiered" | "accelerator">(initialData?.type || "flat");
  
  const [flatRate, setFlatRate] = useState(initialData?.flatRate ? (initialData.flatRate * 100).toString() : "5");
  
  const [acceleratorThreshold, setAcceleratorThreshold] = useState(initialData?.acceleratorThreshold?.toString() || "100000");
  const [acceleratorRate, setAcceleratorRate] = useState(initialData?.acceleratorRate ? (initialData.acceleratorRate * 100).toString() : "10");
  
  const [clawbackDays, setClawbackDays] = useState(initialData?.clawbackDays?.toString() || "");
  
  const [tiers, setTiers] = useState<any[]>(initialData?.tiers ? 
    initialData.tiers.map((t: any) => ({ ...t, rate: (t.rate * 100).toString() })) : 
    [{ fromAmount: "0", toAmount: "50000", rate: "5" }, { fromAmount: "50000", toAmount: "", rate: "8" }]
  );

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createMutation = useCreatePlan();
  const updateMutation = useUpdatePlan();

  // Reset form when dialog opens
  useEffect(() => {
    if (open && !isEditing) {
      setName("");
      setType("flat");
      setFlatRate("5");
      setClawbackDays("");
    } else if (open && isEditing && initialData) {
      setName(initialData.name || "");
      setType(initialData.type || "flat");
      setFlatRate(initialData.flatRate ? (initialData.flatRate * 100).toString() : "5");
      setClawbackDays(initialData.clawbackDays?.toString() || "");
      if (initialData.type === "tiered" && initialData.tiers) {
        setTiers(initialData.tiers.map((t: any) => ({ ...t, rate: (t.rate * 100).toString() })));
      }
      if (initialData.type === "accelerator") {
        setAcceleratorThreshold(initialData.acceleratorThreshold?.toString() || "100000");
        setAcceleratorRate(initialData.acceleratorRate ? (initialData.acceleratorRate * 100).toString() : "10");
      }
    }
  }, [open, isEditing, initialData]);

  const isGrowthPlus = sub?.plan === "growth" || sub?.plan === "lifetime";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let payload: any = { name, type, clawbackDays: clawbackDays ? parseInt(clawbackDays, 10) : null };
    
    if (type === "flat") {
      payload.flatRate = parseFloat(flatRate) / 100;
    } else if (type === "accelerator") {
      payload.flatRate = parseFloat(flatRate) / 100;
      payload.acceleratorThreshold = parseFloat(acceleratorThreshold);
      payload.acceleratorRate = parseFloat(acceleratorRate) / 100;
    } else if (type === "tiered") {
      payload.tiers = tiers.map(t => ({
        fromAmount: parseFloat(t.fromAmount),
        toAmount: t.toAmount ? parseFloat(t.toAmount) : null,
        rate: parseFloat(t.rate) / 100
      }));
    }

    if (isEditing) {
      updateMutation.mutate({ id: initialData.id, data: payload as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPlansQueryKey() });
          toast({ title: "Plan updated" });
          onOpenChange(false);
        }
      });
    } else {
      createMutation.mutate({ data: payload as any }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListPlansQueryKey() });
          toast({ title: "Plan created" });
          onOpenChange(false);
          setName("");
        }
      });
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Plan" : "Create Commission Plan"}</DialogTitle>
            <DialogDescription>
              Configure how commissions are calculated for deals.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="planName">Plan Name</Label>
              <Input id="planName" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Q3 Enterprise AE" required />
            </div>
            
            <div className="grid gap-2">
              <Label>Plan Type</Label>
              <Select value={type} onValueChange={(val: any) => setType(val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="flat">Flat Rate</SelectItem>
                  <SelectItem value="tiered" disabled={!isGrowthPlus}>
                    Tiered Rates {!isGrowthPlus && "(Growth)"}
                  </SelectItem>
                  <SelectItem value="accelerator" disabled={!isGrowthPlus}>
                    Base + Accelerator {!isGrowthPlus && "(Growth)"}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="clawbackDays">Clawback Period (Days) {!isGrowthPlus && <span className="text-[10px] text-primary ml-1">(Growth feature)</span>}</Label>
              <Input 
                id="clawbackDays" 
                type="number" 
                placeholder="e.g. 30" 
                value={clawbackDays} 
                onChange={e => setClawbackDays(e.target.value)}
                disabled={!isGrowthPlus}
              />
              {!isGrowthPlus && <p className="text-[10px] text-muted-foreground">Upgrade to Growth to enable automatic commission clawbacks.</p>}
            </div>

            <div className="bg-muted/30 p-4 rounded-lg border">
              {type === "flat" && (
                <div className="grid gap-2">
                  <Label>Commission Rate (%)</Label>
                  <div className="relative">
                    <Input type="number" step="0.01" min="0" value={flatRate} onChange={e => setFlatRate(e.target.value)} required />
                    <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                  </div>
                </div>
              )}

              {type === "accelerator" && (
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Base Rate (%)</Label>
                    <div className="relative">
                      <Input type="number" step="0.01" min="0" value={flatRate} onChange={e => setFlatRate(e.target.value)} required />
                      <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Accelerator Threshold ($)</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-2.5 text-muted-foreground">$</span>
                      <Input type="number" min="0" className="pl-7" value={acceleratorThreshold} onChange={e => setAcceleratorThreshold(e.target.value)} required />
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Accelerator Rate (%)</Label>
                    <div className="relative">
                      <Input type="number" step="0.01" min="0" value={acceleratorRate} onChange={e => setAcceleratorRate(e.target.value)} required />
                      <span className="absolute right-3 top-2.5 text-muted-foreground">%</span>
                    </div>
                  </div>
                </div>
              )}

              {type === "tiered" && (
                <div className="space-y-4">
                  <Label>Volume Tiers</Label>
                  <div className="space-y-3">
                    {tiers.map((tier, index) => (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="grid flex-1 gap-1">
                          <span className="text-xs text-muted-foreground block">From ($)</span>
                          <Input type="number" min="0" value={tier.fromAmount} onChange={e => {
                            const newTiers = [...tiers];
                            newTiers[index].fromAmount = e.target.value;
                            setTiers(newTiers);
                          }} required />
                        </div>
                        <div className="grid flex-1 gap-1">
                          <span className="text-xs text-muted-foreground block">To ($)</span>
                          <Input type="number" min="0" placeholder="Infinity" value={tier.toAmount} onChange={e => {
                            const newTiers = [...tiers];
                            newTiers[index].toAmount = e.target.value;
                            setTiers(newTiers);
                          }} />
                        </div>
                        <div className="grid flex-1 gap-1">
                          <span className="text-xs text-muted-foreground block">Rate (%)</span>
                          <Input type="number" step="0.01" min="0" value={tier.rate} onChange={e => {
                            const newTiers = [...tiers];
                            newTiers[index].rate = e.target.value;
                            setTiers(newTiers);
                          }} required />
                        </div>
                        {tiers.length > 1 && (
                          <div className="pt-5">
                            <Button type="button" variant="ghost" size="icon" onClick={() => setTiers(tiers.filter((_, i) => i !== index))}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setTiers([...tiers, { fromAmount: "", toAmount: "", rate: "" }])}>
                    <Plus className="h-4 w-4 mr-2" /> Add Tier
                  </Button>
                </div>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="clawback">Clawback Period (Days) <span className="text-muted-foreground font-normal">- Optional</span></Label>
              <Input id="clawback" type="number" min="0" value={clawbackDays} onChange={e => setClawbackDays(e.target.value)} placeholder="e.g. 90" />
            </div>
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? "Saving..." : "Save Plan"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
