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

