import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/number-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useState, useEffect } from "react";
import { Plus, Trash2, Save, Grid3X3, SlidersHorizontal, Percent, Calculator, Download } from "lucide-react";
import { HelpTooltip } from "@/components/help-tooltip";
import { useLocation } from "wouter";

const DEFAULT_SLABS = [
  { index: 0, label: "Slab 0", max: 25000 },
  { index: 1, label: "Slab 1", max: 50000 },
  { index: 2, label: "Slab 2", max: 100000 },
  { index: 3, label: "Slab 3", max: 150000 },
  { index: 4, label: "Slab 4", max: 250000 },
  { index: 5, label: "Slab 5", max: 350000 },
  { index: 6, label: "Slab 6", max: null },
];

const DEFAULT_BRACKETS = [
  { key: "lt15", label: "<15%", max: 15 },
  { key: "15-20", label: "15-20%", max: 20 },
  { key: "20-25", label: "20-25%", max: 25 },
  { key: "25-30", label: "25-30%", max: 30 },
  { key: "30-35", label: "30-35%", max: 35 },
  { key: "35-40", label: "35-40%", max: 40 },
  { key: "gt40", label: ">40%", max: null },
];

export function AissolMatrixPage() {
  usePageMeta({ title: "Commission Matrix", description: "Configure sales slabs and commission rates", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const [, setLocation] = useLocation();
  const { hasPermission } = useRole();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [localSlabs, setLocalSlabs] = useState<{ index: number; label: string; max: number | null }[]>([]);
  const [localBrackets, setLocalBrackets] = useState<{ key: string; label: string; max: number | null }[]>([]);
  const [localRates, setLocalRates] = useState<Record<string, Record<string, number>>>({});

  const { data: matrix, isLoading } = useQuery({
    queryKey: ["aissol-matrix", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/enterprise/commission-matrix`),
    enabled: !!activeWorkspace?.id && activeWorkspace?.commissionEngine === "aissol",
    staleTime: 0,
  });

  useEffect(() => {
    if (!matrix) return;
    const slabs = matrix.exists && matrix.slabs?.length ? matrix.slabs : DEFAULT_SLABS;
    const brackets = matrix.exists && matrix.gmBrackets?.length ? matrix.gmBrackets : DEFAULT_BRACKETS;
    const rates = matrix.rates && Object.keys(matrix.rates).length > 0 ? matrix.rates : buildDefaultRates(DEFAULT_SLABS, DEFAULT_BRACKETS);
    setLocalSlabs(slabs);
    setLocalBrackets(brackets);
    setLocalRates(rates);
  }, [matrix]);

  const saveMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/api/enterprise/commission-matrix`, {
        method: "PUT",
        body: JSON.stringify({ slabs: localSlabs, gmBrackets: localBrackets, rates: localRates }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-matrix"] });
      toast({ title: "Matrix saved" });
    },
    onError: () => toast({ title: "Failed to save matrix", variant: "destructive" }),
  });

  if (activeWorkspace?.commissionEngine !== "aissol") {
    setLocation("/dash");
    return null;
  }

  const updateRate = (slabIdx: number, bracketKey: string, val: string) => {
    const parsed = parseFloat(val);
    setLocalRates(prev => ({
      ...prev,
      [String(slabIdx)]: {
        ...(prev[String(slabIdx)] ?? {}),
        [bracketKey]: isNaN(parsed) ? 0 : parsed / 100,
      },
    }));
  };

  const updateSlabLabel = (idx: number, val: string) => setLocalSlabs(prev => prev.map(s => s.index === idx ? { ...s, label: val } : s));
  const updateSlabMax = (idx: number, val: string) => {
    const p = parseFloat(val);
    setLocalSlabs(prev => prev.map(s => s.index === idx ? { ...s, max: isNaN(p) ? null : p } : s));
  };
  const updateBracketLabel = (k: string, v: string) => setLocalBrackets(prev => prev.map(b => b.key === k ? { ...b, label: v } : b));
  const updateBracketMax = (k: string, v: string) => {
    const p = parseFloat(v);
    setLocalBrackets(prev => prev.map(b => b.key === k ? { ...b, max: isNaN(p) ? null : p } : b));
  };

  const addSlab = () => {
    const nextIdx = localSlabs.length > 0 ? Math.max(...localSlabs.map(s => s.index)) + 1 : 0;
    setLocalSlabs(prev => {
      const updated = prev.map(s => s.max === null && s.index !== nextIdx ? { ...s, max: 10000 } : s);
      return [...updated, { index: nextIdx, label: `Slab ${nextIdx}`, max: null }];
    });
    setLocalRates(prev => {
      const next = { ...prev };
      next[String(nextIdx)] = {};
      for (const b of localBrackets) next[String(nextIdx)][b.key] = 0;
      return next;
    });
  };

  const removeSlab = (slabIdx: number) => {
    if (localSlabs.length <= 1) return;
    setLocalSlabs(prev => {
      const updated = prev.filter(s => s.index !== slabIdx);
      if (updated.length > 0 && updated.every(s => s.max !== null)) updated[updated.length - 1].max = null;
      return updated;
    });
    setLocalRates(prev => { const n = { ...prev }; delete n[String(slabIdx)]; return n; });
  };

  const addBracket = () => {
    const existingKeys = new Set(localBrackets.map(b => b.key));
    let nextKeyNum = 1;
    while (existingKeys.has(`b${nextKeyNum}`)) nextKeyNum++;
    setLocalBrackets(prev => {
      const updated = prev.map(b => b.max === null ? { ...b, max: 100 } : b);
      return [...updated, { key: `b${nextKeyNum}`, label: `New ${nextKeyNum}`, max: null }];
    });
    setLocalRates(prev => {
      const next = { ...prev };
      for (const slabIdx of Object.keys(next)) next[slabIdx] = { ...next[slabIdx], [`b${nextKeyNum}`]: 0 };
      return next;
    });
  };

  const removeBracket = (bracketKey: string) => {
    if (localBrackets.length <= 1) return;
    setLocalBrackets(prev => {
      const updated = prev.filter(b => b.key !== bracketKey);
      if (updated.length > 0 && updated.every(b => b.max !== null)) updated[updated.length - 1].max = null;
      return updated;
    });
    setLocalRates(prev => {
      const next = { ...prev };
      for (const slabIdx of Object.keys(next)) { const row = { ...next[slabIdx] }; delete row[bracketKey]; next[slabIdx] = row; }
      return next;
    });
  };

  const calculateDefaultRates = () => {
    const baseRate = 0.0010;
    const slabStep = 0.0020;
    const bracketStep = 0.0010;
    const newRates: Record<string, Record<string, number>> = {};
    for (const slab of localSlabs) {
      const row: Record<string, number> = {};
      for (let bi = 0; bi < localBrackets.length; bi++) {
        row[localBrackets[bi].key] = Math.round((baseRate + (slab.index * slabStep) + (bi * bracketStep)) * 10000) / 10000;
      }
      newRates[String(slab.index)] = row;
    }
    setLocalRates(newRates);
    toast({ title: "Rates calculated" });
  };

  const handleExportMatrix = () => {
    const rows = [["Slab", ...localBrackets.map((b: any) => b.label)]];
    for (const slab of localSlabs) {
      const row = [slab.label];
      for (const bracket of localBrackets) {
        const rate = localRates[String(slab.index)]?.[bracket.key];
        row.push(rate !== undefined ? (rate * 100).toFixed(2) + "%" : "—");
      }
      rows.push(row);
    }
    const csv = rows.map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `commission-matrix-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  const canEdit = hasPermission("plans", "create");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <p className="text-[12px] font-semibold text-primary mb-1">Enterprise</p>
          <h1 className="text-3xl font-semibold tracking-tight">Commission Matrix</h1>
          <p className="text-muted-foreground">Configure sales slabs, GM brackets, and commission rates.</p>
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportMatrix} className="gap-1.5">
              <Download className="size-4" /> Export CSV
            </Button>
            <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending}>
              <Save className="mr-2 size-4" />
              {saveMutation.isPending ? "Saving..." : "Save Matrix"}
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6">
        {/* Sales Slabs */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-primary" />
              <h3 className="font-semibold">Sales Slabs</h3>
              <HelpTooltip content="Project value ranges that determine which slab applies. The slab with no limit (null) is the catch-all." />
            </div>
          </div>
          <div className="px-6 py-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider w-16">Slab</th>
                  <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Label</th>
                  <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Up to</th>
                  <th className="w-10 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {localSlabs.map((slab) => (
                  <tr key={slab.index} className="border-b border-border/30 last:border-0">
                    <td className="py-2 px-2 font-semibold text-muted-foreground">{slab.index}</td>
                    <td className="py-2 px-2">{canEdit ? <Input value={slab.label} onChange={(e) => updateSlabLabel(slab.index, e.target.value)} className="h-8 text-xs" /> : <span className="text-xs">{slab.label}</span>}</td>
                    <td className="py-2 px-2">{canEdit ? <NumberInput value={slab.max === null ? "" : slab.max} onChange={(e) => updateSlabMax(slab.index, e.target.value)} className="h-8 text-xs" placeholder="No limit" /> : <span className="text-xs">{slab.max === null ? "No limit" : slab.max?.toLocaleString()}</span>}</td>
                    <td className="py-2 px-2">{canEdit && <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => removeSlab(slab.index)}><Trash2 className="size-3.5" /></Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={addSlab} className="mt-2 gap-1 text-muted-foreground">
                <Plus className="size-3.5" /> Add Slab
              </Button>
            )}
          </div>
        </div>

        {/* GM Brackets */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Percent className="size-4 text-primary" />
              <h3 className="font-semibold">Gross Margin Brackets</h3>
              <HelpTooltip content="GM% ranges. The bracket with no limit is the catch-all for all remaining values." />
            </div>
          </div>
          <div className="px-6 py-3">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Label</th>
                  <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Up to GM%</th>
                  <th className="w-10 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {localBrackets.map((bracket) => (
                  <tr key={bracket.key} className="border-b border-border/30 last:border-0">
                    <td className="py-2 px-2">{canEdit ? <Input value={bracket.label} onChange={(e) => updateBracketLabel(bracket.key, e.target.value)} className="h-8 text-xs" /> : <span className="text-xs">{bracket.label}</span>}</td>
                    <td className="py-2 px-2">{canEdit ? <NumberInput value={bracket.max === null ? "" : bracket.max} onChange={(e) => updateBracketMax(bracket.key, e.target.value)} className="h-8 text-xs" placeholder="No limit" /> : <span className="text-xs">{bracket.max === null ? "No limit" : `${bracket.max}%`}</span>}</td>
                    <td className="py-2 px-2">{canEdit && <Button variant="ghost" size="icon" className="size-7 text-destructive hover:text-destructive" onClick={() => removeBracket(bracket.key)}><Trash2 className="size-3.5" /></Button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={addBracket} className="mt-2 gap-1 text-muted-foreground">
                <Plus className="size-3.5" /> Add Bracket
              </Button>
            )}
          </div>
        </div>

        {/* Rates Matrix */}
        <div className="bg-card border border-card-border rounded-2xl overflow-hidden" style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="px-6 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Grid3X3 className="size-4 text-primary" />
                <h3 className="font-semibold">Commission Rates (%)</h3>
                <HelpTooltip content="The commission percentage for each slab × GM bracket combination. Values are stored as decimals (e.g. 1.50 = 1.50%)." />
              </div>
              {canEdit && (
                <Button variant="outline" size="sm" onClick={calculateDefaultRates} className="gap-1.5">
                  <Calculator className="size-3.5" />
                  Auto-fill Rates
                </Button>
              )}
            </div>
          </div>
          <div className="px-6 py-3 overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr>
                  <th className="text-left py-2.5 px-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider sticky left-0 bg-card z-10">Slab \ GM</th>
                  {localBrackets.map((b) => (
                    <th key={b.key} className="text-center py-2.5 px-1 text-[11px] font-semibold text-muted-foreground tracking-wider min-w-[80px]">{b.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {localSlabs.map((slab) => (
                  <tr key={slab.index} className="border-b border-border/30 last:border-0 hover:bg-muted/20">
                    <td className="py-2 px-3 font-semibold text-xs sticky left-0 bg-card z-10">{slab.label}</td>
                    {localBrackets.map((bracket) => {
                      const rate = localRates[String(slab.index)]?.[bracket.key];
                      const displayPct = rate !== undefined ? (rate * 100).toFixed(2) : "";
                      return (
                        <td key={bracket.key} className="py-1.5 px-1 text-center">
                          {canEdit ? (
                            <NumberInput
                              value={displayPct}
                              onChange={(e) => updateRate(slab.index, bracket.key, e.target.value)}
                              className="h-8 text-xs text-center"
                              placeholder="0.00"
                            />
                          ) : (
                            <span className="text-xs font-medium">{displayPct || "—"}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function buildDefaultRates(
  slabs: { index: number }[],
  brackets: { key: string }[],
): Record<string, Record<string, number>> {
  const rates: Record<string, Record<string, number>> = {};
  for (const slab of slabs) {
    const row: Record<string, number> = {};
    for (const bracket of brackets) row[bracket.key] = 0;
    rates[String(slab.index)] = row;
  }
  return rates;
}
