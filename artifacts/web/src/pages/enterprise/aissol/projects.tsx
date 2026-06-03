import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWorkspace } from "@/hooks/use-workspace";
import { useRole } from "@/hooks/use-role";
import { usePageMeta } from "@/hooks/use-page-meta";
import { apiFetch } from "@/lib/api";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { NumberInput } from "@/components/number-input";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MonthPicker } from "@/components/ui/month-picker";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import { format } from "date-fns";
import { Plus, Search, Trash2, UploadCloud, FileDown, FolderKanban, Loader2, Download } from "lucide-react";
import { CurrencyCombobox } from "@/components/currency-combobox";
import { HelpTooltip } from "@/components/help-tooltip";
import Papa from "papaparse";
import * as XLSX from "xlsx";

function toCSV(headers: string[], rows: string[][]): string {
  return [headers.join(","), ...rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(","))].join("\n");
}

export function AissolProjectsPage() {
  usePageMeta({ title: "Projects", description: "Manage enterprise projects", robots: "noindex, nofollow" });
  const { activeWorkspace } = useWorkspace();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { hasPermission } = useRole();
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", totalValue: "", totalCost: "", repId: "", period: format(new Date(), "yyyy-MM"), currency: activeWorkspace?.currency || "SAR" });
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRep, setFilterRep] = useState("all");
  const [filterPeriod, setFilterPeriod] = useState("all");
  const [deleteConfirmProject, setDeleteConfirmProject] = useState<any>(null);

  const { data: projects, isLoading } = useQuery({
    queryKey: ["aissol-projects", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/enterprise/projects`).catch(() => []),
    enabled: !!activeWorkspace?.id && activeWorkspace?.commissionEngine === "aissol",
    staleTime: 0,
  });

  const { data: reps } = useQuery({
    queryKey: ["reps-list", activeWorkspace?.id],
    queryFn: () => apiFetch(`/api/reps`),
    enabled: !!activeWorkspace?.id && activeWorkspace?.commissionEngine === "aissol",
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) =>
      apiFetch(`/api/enterprise/projects`, {
        method: "POST",
        body: JSON.stringify({
          name: data.name, totalValue: Number(data.totalValue), totalCost: Number(data.totalCost),
          repId: data.repId, period: data.period, currency: data.currency,
        }),
      }),
    onMutate: async (data: typeof form) => {
      await queryClient.cancelQueries({ queryKey: ["aissol-projects"] });
      const previous = queryClient.getQueryData(["aissol-projects", activeWorkspace?.id]);
      const rep = reps?.find((r: any) => String(r.id) === String(data.repId));
      const optimistic = {
        _id: `temp-${Date.now()}`,
        name: data.name,
        repId: data.repId,
        totalValue: Number(data.totalValue),
        totalCost: Number(data.totalCost),
        currency: data.currency,
        period: data.period,
        status: "active",
        createdAt: new Date().toISOString(),
      };
      queryClient.setQueryData(["aissol-projects", activeWorkspace?.id], (old: any) =>
        old ? [optimistic, ...old] : [optimistic],
      );
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["aissol-projects", activeWorkspace?.id], context.previous);
      }
      toast({ title: "Failed to create project", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-projects"] });
    },
    onSuccess: () => {
      setShowCreate(false);
      setForm(p => ({ ...p, name: "", totalValue: "", totalCost: "", repId: "" }));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiFetch(`/api/enterprise/projects/${id}`, { method: "DELETE" }),
    onMutate: async (id: string) => {
      await queryClient.cancelQueries({ queryKey: ["aissol-projects"] });
      const previous = queryClient.getQueryData(["aissol-projects", activeWorkspace?.id]);
      queryClient.setQueryData(["aissol-projects", activeWorkspace?.id], (old: any) =>
        old ? old.filter((p: any) => p._id !== id) : [],
      );
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous) {
        queryClient.setQueryData(["aissol-projects", activeWorkspace?.id], context.previous);
      }
      toast({ title: "Failed to delete project", variant: "destructive" });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-projects"] });
    },
  });

  const importMutation = useMutation({
    mutationFn: (data: any[]) =>
      Promise.all(data.map((p: any) =>
        apiFetch(`/api/enterprise/projects`, { method: "POST", body: JSON.stringify(p) })
      )),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aissol-projects"] });
      toast({ title: `Imported ${importMutation.variables?.length ?? 0} projects` });
    },
    onError: () => toast({ title: "Import failed", variant: "destructive" }),
  });

  const repMap = new Map((reps as any[])?.map((r: any) => [String(r.id), r.name]) ?? []);

  const handleExportProjects = () => {
    const arr = Array.isArray(projects) ? projects : [];
    const blob = new Blob([toCSV(
      ["Name", "Rep", "Total Value", "Total Cost", "Currency", "Period", "Status", "GM%"],
      arr.map((p: any) => [
        p.name, repMap.get(String(p.repId)) || "Unknown", String(p.totalValue), String(p.totalCost), p.currency, p.period, p.status,
        p.totalValue > 0 ? ((p.totalValue - p.totalCost) / p.totalValue * 100).toFixed(2) : "0.00",
      ]),
    )], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `projects-${new Date().toISOString().split("T")[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

