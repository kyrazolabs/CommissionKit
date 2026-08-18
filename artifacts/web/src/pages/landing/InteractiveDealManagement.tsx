import { ArrowUpDown, ChevronDown, Database, Download, Search, Upload } from "lucide-react";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const sampleDeals = [
  {
    name: "Acme Corp Q2",
    rep: "Sarah Davis",
    date: "2024-06-15",
    value: 28500,
    plan: "Enterprise",
    status: "Closed Won",
  },
  {
    name: "Globex Renewal",
    rep: "Mike Chen",
    date: "2024-06-10",
    value: 42000,
    plan: "Accelerator",
    status: "Closed Won",
  },
  {
    name: "Initech Upsell",
    rep: "Emily Park",
    date: "2024-06-08",
    value: 18700,
    plan: "Standard",
    status: "Closed Won",
  },
  {
    name: "Umbrella SaaS",
    rep: "Sarah Davis",
    date: "2024-06-05",
    value: 33500,
    plan: "Enterprise",
    status: "Closed Won",
  },
  {
    name: "Hooli Platform",
    rep: "Mike Chen",
    date: "2024-06-01",
    value: 52000,
    plan: "Accelerator",
    status: "In Progress",
  },
  {
    name: "Massive Dynamic",
    rep: "Emily Park",
    date: "2024-05-28",
    value: 15000,
    plan: "Standard",
    status: "Closed Won",
  },
  {
    name: "Stark Industries",
    rep: "James Lee",
    date: "2024-05-22",
    value: 78500,
    plan: "Enterprise",
    status: "Negotiation",
  },
  {
    name: "Wayne Enterprises",
    rep: "Sarah Davis",
    date: "2024-05-18",
    value: 44000,
    plan: "Accelerator",
    status: "Closed Won",
  },
];

function fmtCurrency(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

const statusColors: Record<string, string> = {
  "Closed Won": "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  "In Progress": "bg-amber-500/10 text-amber-600 border-amber-500/20",
  Negotiation: "bg-blue-500/10 text-blue-600 border-blue-500/20",
};

type SortKey = "name" | "date" | "value" | "plan" | "status";
type SortDir = "asc" | "desc";

export function InteractiveDealManagement() {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [imported, setImported] = useState(false);

  const filtered = useMemo(() => {
    let d = sampleDeals;
    if (search) {
      const s = search.toLowerCase();
      d = d.filter(
        (x) =>
          x.name.toLowerCase().includes(s) ||
          x.rep.toLowerCase().includes(s) ||
          x.plan.toLowerCase().includes(s),
      );
    }
    d = [...d].sort((a, b) => {
      let va: any = a[sortKey];
      let vb: any = b[sortKey];
      if (sortKey === "value") {
        va = a.value;
        vb = b.value;
      }
      if (sortKey === "date") {
        va = a.date;
        vb = b.date;
      }
      if (typeof va === "string") va = va.toLowerCase();
      if (typeof vb === "string") vb = vb.toLowerCase();
      const r = va < vb ? -1 : va > vb ? 1 : 0;
      return sortDir === "desc" ? -r : r;
    });
    return d;
  }, [search, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(sortDir === "desc" ? "asc" : "desc");
    else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <ArrowUpDown className="size-3 text-muted-foreground/40" />;
    return <ArrowUpDown className="size-3 text-primary" />;
  }

  const totalValue = filtered.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="overflow-hidden border-card-border shadow-sm h-[460px] flex flex-col">
      <div className="px-5 py-3 border-b border-card-border bg-muted/20 flex items-center gap-2">
        <div className="flex size-7 items-center justify-center rounded-[8px] bg-primary/10">
          <Database className="size-3.5 text-primary" />
        </div>
        <span className="text-[13px] font-semibold text-foreground">Deal Management</span>
        <Badge variant="secondary" className="ml-auto text-[10px]">
          Interactive Demo
        </Badge>
      </div>

      <div className="px-4 py-3 flex items-center gap-2 border-b border-card-border">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
          <Input
            placeholder="Search deals, reps, or plans..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs"
          onClick={() => setImported(!imported)}
        >
          {imported ? (
            <>
              <Download className="size-3 mr-1" />
              Export
            </>
          ) : (
            <>
              <Upload className="size-3 mr-1" />
              Import
            </>
          )}
        </Button>
      </div>

      {imported && (
        <div className="px-4 py-2 mx-3 mt-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-2 animate-in fade-in">
          <Upload className="size-3.5 text-emerald-600" />
          <span className="text-[11px] font-medium text-emerald-700">
            72 deals imported from deals_q2.csv
          </span>
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-auto custom-scrollbar">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-muted/40">
              {[
                { key: "name" as SortKey, label: "Deal" },
                { key: "plan" as SortKey, label: "Plan" },
                { key: "value" as SortKey, label: "Value" },
                { key: "date" as SortKey, label: "Date" },
                { key: "status" as SortKey, label: "Status" },
              ].map(({ key, label }) => (
                <th key={key} className="p-3 text-left">
                  <button
                    onClick={() => toggleSort(key)}
                    className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {label}
                    <SortIcon col={key} />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr
                key={d.name}
                className="border-t border-card-border hover:bg-muted/20 transition-colors"
              >
                <td className="p-3">
                  <span className="text-[12px] font-medium text-foreground">{d.name}</span>
                  <p className="text-[10px] text-muted-foreground">{d.rep}</p>
                </td>
                <td className="p-3">
                  <span className="inline-flex rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground">
                    {d.plan}
                  </span>
                </td>
                <td className="p-3 text-[12px] tabular-nums font-semibold text-foreground">
                  {fmtCurrency(d.value)}
                </td>
                <td className="p-3 text-[12px] text-muted-foreground tabular-nums">
                  {new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </td>
                <td className="p-3">
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-medium border ${statusColors[d.status] || "bg-muted text-muted-foreground"}`}
                  >
                    {d.status}
                  </span>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-xs text-muted-foreground">
                  No deals match your search.
                </td>
              </tr>
            )}
          </tbody>
          <tfoot>
            <tr className="border-t border-card-border bg-muted/20">
              <td colSpan={2} className="p-3 text-[11px] font-medium text-foreground">
                {filtered.length} deals
              </td>
              <td className="p-3 text-[12px] font-semibold text-primary tabular-nums">
                {fmtCurrency(totalValue)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </Card>
  );
}
