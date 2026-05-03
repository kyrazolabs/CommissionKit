import {
  BarChart2, Users, FileText, Play, LayoutDashboard,
  TrendingUp, DollarSign, Briefcase, Search, Bell,
  ChevronRight, ArrowUpRight, Settings, Zap
} from "lucide-react";

const reps = [
  { rank: 1, name: "Jordan Blake", plan: "Accelerator", deals: 2, revenue: 140000, commission: 9190, badge: "Top" },
  { rank: 2, name: "Sarah Chen", plan: "Tiered", deals: 2, revenue: 73500, commission: 5880, badge: "" },
  { rank: 3, name: "Marcus Williams", plan: "Flat Rate", deals: 2, revenue: 80000, commission: 5280, badge: "" },
  { rank: 4, name: "Priya Patel", plan: "Tiered", deals: 2, revenue: 43500, commission: 3480, badge: "" },
  { rank: 5, name: "Lena Johansson", plan: "Flat Rate", deals: 2, revenue: 30000, commission: 2400, badge: "" },
];

const runs = [
  { period: "2026-05", deals: 8, commission: 23830, status: "Completed" },
  { period: "2026-04", deals: 4, commission: 12770, status: "Completed" },
];

const navGroups = [
  {
    label: "Main",
    items: [
      { icon: LayoutDashboard, label: "Dashboard", active: true },
      { icon: Users, label: "Reps" },
      { icon: FileText, label: "Plans" },
    ]
  },
  {
    label: "Operations",
    items: [
      { icon: Briefcase, label: "Deals" },
      { icon: Play, label: "Runs" },
    ]
  },
  {
    label: "Settings",
    items: [
      { icon: Settings, label: "Settings" },
    ]
  }
];

const TEAL = "#0D9488";
const TEAL_LIGHT = "#F0FDFA";
const TEAL_MEDIUM = "#CCFBF1";

export function AlmondStyle() {
  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: "'Inter', sans-serif", background: "#FFFFFF", color: "#111827" }}>
      {/* Top nav */}
      <header style={{ height: 56, display: "flex", alignItems: "center", padding: "0 20px 0 0", background: "#FAFAFA", flexShrink: 0, zIndex: 10 }}>
        <div style={{ width: 220, flexShrink: 0, display: "flex", alignItems: "center", gap: 8, padding: "0 20px", height: "100%" }}>
          <div style={{ width: 24, height: 24, background: TEAL, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <BarChart2 size={13} color="#fff" />
          </div>
          <span style={{ fontWeight: 700, fontSize: 14.5, color: "#111827", letterSpacing: "-0.2px" }}>CommissionKit</span>
        </div>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <button style={{ background: "none", border: "none", cursor: "pointer", color: "#6B7280", display: "flex", alignItems: "center" }}>
            <Bell size={17} />
          </button>
          <div style={{ width: 1, height: 24, background: "#E5E7EB" }} />
          <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <div style={{ width: 28, height: 28, borderRadius: "50%", background: TEAL, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, color: "#fff" }}>JS</div>
            <span style={{ fontSize: 13, fontWeight: 500, color: "#374151" }}>Jane Smith</span>
            <ChevronRight size={14} style={{ color: "#9CA3AF" }} />
          </div>
        </div>
      </header>

      <div style={{ display: "flex", flex: 1 }}>
        {/* Sidebar */}
        <aside style={{ width: 220, flexShrink: 0, borderRight: "1px solid #E5E7EB", background: "#FAFAFA", display: "flex", flexDirection: "column", padding: "16px 12px", paddingTop: 20 }}>
          {navGroups.map((group) => (
            <div key={group.label} style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#9CA3AF", letterSpacing: "0.05em", textTransform: "uppercase", padding: "0 8px", marginBottom: 6 }}>{group.label}</div>
              {group.items.map(({ icon: Icon, label, active }) => (
                <div key={label} style={{
                  display: "flex", alignItems: "center", gap: 9, padding: "7px 10px", borderRadius: 10,
                  background: active ? TEAL_LIGHT : "transparent",
                  color: active ? TEAL : "#4B5563",
                  fontWeight: active ? 600 : 400,
                  fontSize: 13.5, cursor: "pointer", marginBottom: 1,
                  border: active ? `1px solid ${TEAL_MEDIUM}` : "1px solid transparent"
                }}>
                  <Icon size={15} style={{ flexShrink: 0, opacity: active ? 1 : 0.7 }} />
                  {label}
                </div>
              ))}
            </div>
          ))}

          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px", borderRadius: 10, background: "#F3F4F6", cursor: "pointer" }}>
              <Search size={13} style={{ color: "#9CA3AF" }} />
              <span style={{ fontSize: 12.5, color: "#9CA3AF" }}>Search...</span>
              <span style={{ marginLeft: "auto", fontSize: 10.5, color: "#D1D5DB", background: "#E5E7EB", borderRadius: 4, padding: "2px 5px" }}>⌘K</span>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main style={{ flex: 1, overflowY: "auto", padding: "36px 48px", background: "#FFFFFF" }}>
          {/* Breadcrumb */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: TEAL, fontWeight: 600 }}>Overview</span>
          </div>

          {/* Page header */}
          <div style={{ marginBottom: 32 }}>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#111827", letterSpacing: "-0.6px", marginBottom: 6 }}>Dashboard</h1>
            <p style={{ fontSize: 14, color: "#6B7280", lineHeight: 1.6 }}>Commission performance for <strong style={{ color: "#374151" }}>May 2026</strong> — all plans and reps included.</p>
          </div>

          {/* Stats */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Total Commissions", value: "$23,830", delta: "+11%", icon: DollarSign },
              { label: "Pipeline Revenue", value: "$337,000", delta: "+23%", icon: TrendingUp },
              { label: "Deals Closed", value: "8", delta: "+2 vs Apr", icon: Briefcase },
              { label: "Active Reps", value: "5", delta: "of 5 total", icon: Users },
            ].map(({ label, value, delta, icon: Icon }) => (
              <div key={label} style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 16, padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                  <span style={{ fontSize: 12, color: "#6B7280", fontWeight: 500 }}>{label}</span>
                  <div style={{ width: 28, height: 28, background: TEAL_LIGHT, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Icon size={14} style={{ color: TEAL }} />
                  </div>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: "#111827", letterSpacing: "-0.5px" }}>{value}</div>
                <div style={{ fontSize: 12, color: TEAL, marginTop: 6, fontWeight: 500 }}>{delta}</div>
              </div>
            ))}
          </div>

          {/* Bottom grid */}
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
            {/* Top Earners table */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 16, overflow: "hidden" }}>
              <div style={{ padding: "18px 22px", borderBottom: "1px solid #F3F4F6", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111827" }}>Top Earners</div>
                  <div style={{ fontSize: 12, color: "#9CA3AF", marginTop: 2 }}>Ranked by commission earned</div>
                </div>
                <button style={{ fontSize: 12, color: TEAL, fontWeight: 600, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                  View all <ArrowUpRight size={12} />
                </button>
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#F9FAFB" }}>
                    {["Rep", "Plan", "Deals", "Revenue", "Commission"].map((h) => (
                      <th key={h} style={{ padding: "10px 16px", textAlign: "left", fontSize: 11.5, fontWeight: 600, color: "#6B7280", letterSpacing: "0.03em", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {reps.map((r, i) => (
                    <tr key={r.name} style={{ borderTop: "1px solid #F3F4F6" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "50%", background: i === 0 ? TEAL : "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10.5, fontWeight: 700, color: i === 0 ? "#fff" : "#6B7280", flexShrink: 0 }}>
                            {r.name.split(" ").map(n => n[0]).join("")}
                          </div>
                          <div>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#111827" }}>{r.name}</div>
                            {r.badge && <span style={{ fontSize: 10, background: TEAL_LIGHT, color: TEAL, borderRadius: 4, padding: "1px 6px", fontWeight: 600, border: `1px solid ${TEAL_MEDIUM}` }}>Top</span>}
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: 12.5, color: "#6B7280" }}>{r.plan}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", fontWeight: 500 }}>{r.deals}</td>
                      <td style={{ padding: "12px 16px", fontSize: 13, color: "#374151", fontWeight: 500 }}>${(r.revenue / 1000).toFixed(0)}K</td>
                      <td style={{ padding: "12px 16px", fontSize: 13.5, fontWeight: 700, color: TEAL }}>${r.commission.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Right column */}
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Quick Action */}
              <div style={{ background: TEAL_LIGHT, border: `1px solid ${TEAL_MEDIUM}`, borderRadius: 16, padding: "20px 22px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Zap size={16} style={{ color: TEAL }} />
                  <div style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>Run Calculation</div>
                </div>
                <p style={{ fontSize: 12.5, color: "#6B7280", lineHeight: 1.6, marginBottom: 16 }}>Trigger a commission run for the current period across all active reps and plans.</p>
                <button style={{ width: "100%", padding: "10px", borderRadius: 12, background: TEAL, color: "#fff", fontWeight: 600, fontSize: 13, border: "none", cursor: "pointer" }}>
                  Run May 2026
                </button>
              </div>

              {/* Recent Runs */}
              <div style={{ background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: 16, padding: "18px 22px", flex: 1 }}>
                <div style={{ fontSize: 14.5, fontWeight: 700, color: "#111827", marginBottom: 4 }}>Recent Runs</div>
                <div style={{ fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>Previous calculation jobs</div>
                {runs.map((r) => (
                  <div key={r.period} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px solid #F3F4F6" }}>
                    <div style={{ width: 32, height: 32, borderRadius: 10, background: "#F3F4F6", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <Play size={13} style={{ color: TEAL }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>{r.period}</div>
                      <div style={{ fontSize: 11.5, color: "#9CA3AF" }}>{r.deals} deals · ${r.commission.toLocaleString()}</div>
                    </div>
                    <span style={{ fontSize: 11, color: TEAL, fontWeight: 600, background: TEAL_LIGHT, border: `1px solid ${TEAL_MEDIUM}`, borderRadius: 5, padding: "2px 8px" }}>{r.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
