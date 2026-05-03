import { BarChart2, Users, FileText, Play, LayoutDashboard, TrendingUp, DollarSign, Briefcase } from "lucide-react";

const reps = [
  { rank: 1, name: "Jordan Blake", deals: 2, revenue: 140000, commission: 9190 },
  { rank: 2, name: "Sarah Chen", deals: 2, revenue: 73500, commission: 5880 },
  { rank: 3, name: "Marcus Williams", deals: 2, revenue: 80000, commission: 5280 },
  { rank: 4, name: "Priya Patel", deals: 2, revenue: 43500, commission: 3480 },
];

const runs = [
  { period: "2026-05", deals: 8, commission: 23830 },
  { period: "2026-04", deals: 4, commission: 12770 },
];

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: Users, label: "Reps" },
  { icon: FileText, label: "Plans" },
  { icon: Briefcase, label: "Deals" },
  { icon: Play, label: "Runs" },
];

export function SlateSage() {
  return (
    <div className="flex min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: "#F0F3F7", color: "#1E293B" }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: "#E8EDF4", borderRight: "1px solid #D5DCE8", flexShrink: 0 }} className="flex flex-col py-6 px-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div style={{ width: 28, height: 28, background: "#4D7C69", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={15} color="#FFF" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#1E293B", letterSpacing: "-0.3px" }}>CommissionKit</span>
        </div>
        <nav className="flex flex-col gap-1">
          {navItems.map(({ icon: Icon, label, active }) => (
            <div key={label} style={{
              display: "flex", alignItems: "center", gap: 10, padding: "8px 10px", borderRadius: 8,
              background: active ? "#D6E5DF" : "transparent",
              color: active ? "#2D5F4F" : "#4B6075",
              fontWeight: active ? 600 : 400,
              fontSize: 13.5, cursor: "pointer"
            }}>
              <Icon size={16} style={{ opacity: active ? 1 : 0.65 }} />
              {label}
            </div>
          ))}
        </nav>
        <div style={{ marginTop: "auto", paddingTop: 24, borderTop: "1px solid #D5DCE8" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 10px" }}>
            <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#4D7C69", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>JS</div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 600, color: "#1E293B" }}>Jane Smith</div>
              <div style={{ fontSize: 11, color: "#6B8099" }}>RevOps Manager</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto" style={{ padding: "32px 40px" }}>
        <div className="mb-7">
          <h1 style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.5px" }}>Overview</h1>
          <p style={{ fontSize: 13.5, color: "#6B8099", marginTop: 3 }}>Performance summary for May 2026</p>
        </div>

        {/* Stats */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
          {[
            { label: "Total Commissions", value: "$23,830", sub: "Calculated for this period", icon: DollarSign },
            { label: "Total Revenue", value: "$337,000", sub: "Closed won deals", icon: TrendingUp },
            { label: "Deals Closed", value: "8", sub: "This period", icon: Briefcase },
            { label: "Active Reps", value: "5", sub: "With deals this period", icon: Users },
          ].map(({ label, value, sub, icon: Icon }) => (
            <div key={label} style={{ background: "#FFFFFF", border: "1px solid #D5DCE8", borderRadius: 12, padding: "20px 22px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: 12.5, color: "#6B8099", fontWeight: 500 }}>{label}</span>
                <Icon size={15} style={{ color: "#4D7C69", opacity: 0.75 }} />
              </div>
              <div style={{ fontSize: 26, fontWeight: 700, color: "#0F172A", letterSpacing: "-0.5px" }}>{value}</div>
              <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 4 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Bottom grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Top Earners */}
          <div style={{ background: "#FFFFFF", border: "1px solid #D5DCE8", borderRadius: 12, padding: "22px 24px" }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Top Earners</div>
              <div style={{ fontSize: 12, color: "#6B8099", marginTop: 2 }}>Highest commissions this period</div>
            </div>
            {reps.map((r) => (
              <div key={r.name} style={{ display: "flex", alignItems: "center", gap: 12, paddingTop: 14, paddingBottom: 14, borderBottom: "1px solid #E8EDF4" }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: r.rank === 1 ? "#4D7C69" : "#E8EDF4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: r.rank === 1 ? "#fff" : "#3D6355", flexShrink: 0 }}>#{r.rank}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1E293B" }}>{r.name}</div>
                  <div style={{ fontSize: 11.5, color: "#94A3B8" }}>{r.deals} deals (${(r.revenue / 1000).toFixed(0)}K rev)</div>
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#2D5F4F" }}>${r.commission.toLocaleString()}</div>
              </div>
            ))}
          </div>

          {/* Recent Runs */}
          <div style={{ background: "#FFFFFF", border: "1px solid #D5DCE8", borderRadius: 12, padding: "22px 24px" }}>
            <div style={{ marginBottom: 18 }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#0F172A" }}>Recent Calculation Runs</div>
              <div style={{ fontSize: 12, color: "#6B8099", marginTop: 2 }}>Latest batch processing jobs</div>
            </div>
            {runs.map((r) => (
              <div key={r.period} style={{ display: "flex", alignItems: "center", gap: 14, padding: "16px 0", borderBottom: "1px solid #E8EDF4" }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: "#E4EFF0", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Play size={16} style={{ color: "#4D7C69" }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600, color: "#1E293B" }}>Period: {r.period}</div>
                  <div style={{ fontSize: 11.5, color: "#94A3B8", marginTop: 2 }}>{r.deals} deals · ${r.commission.toLocaleString()} total</div>
                </div>
                <button style={{ fontSize: 12, color: "#4D7C69", fontWeight: 600, background: "none", border: "none", cursor: "pointer" }}>View</button>
              </div>
            ))}
            <div style={{ marginTop: 20 }}>
              <button style={{ width: "100%", padding: "11px", borderRadius: 9, background: "#4D7C69", color: "#fff", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>
                Run New Calculation
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
