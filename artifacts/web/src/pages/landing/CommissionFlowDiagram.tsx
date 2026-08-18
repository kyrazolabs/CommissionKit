import { motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Cable,
  Calculator,
  Database,
  FileSpreadsheet,
  Users,
  Wallet,
} from "lucide-react";

const NODES = [
  {
    id: "data",
    title: "Your Data",
    desc: "CSV, CRM, or API",
    icons: [FileSpreadsheet, Cable],
    color: "bg-muted border-muted-foreground/20",
    iconColor: "text-muted-foreground",
  },
  {
    id: "engine",
    title: "Commission Engine",
    desc: "Calculate & process",
    icons: [Calculator],
    color: "bg-primary/10 border-primary/30",
    iconColor: "text-primary",
    highlight: true,
  },
  {
    id: "results",
    title: "Instant Results",
    desc: "Reports & payouts",
    icons: [BarChart3, Wallet],
    color: "bg-muted border-muted-foreground/20",
    iconColor: "text-muted-foreground",
  },
];

const OUTPUTS = [
  { icon: Wallet, label: "Payouts", sub: "Approved & paid" },
  { icon: Users, label: "Rep Portal", sub: "Real-time earnings" },
  { icon: BarChart3, label: "Reports", sub: "Audit-ready" },
];

export function CommissionFlowDiagram() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center px-2 py-4">
      {/* ── Top: 3-node flow ── */}
      <div className="flex items-center gap-2 sm:gap-3 w-full justify-center mb-5">
        {NODES.map((node, i) => (
          <div key={node.id} className="flex items-center gap-2 sm:gap-3">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.2, duration: 0.5 }}
              className={`rounded-xl border px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col items-center text-center min-w-[80px] sm:min-w-[100px] ${node.color} ${
                node.highlight ? "shadow-[0_0_24px_hsl(var(--primary)/0.15)]" : ""
              }`}
            >
              <div className="flex items-center gap-1 mb-1.5">
                {node.icons.map((Icon, j) => (
                  <Icon key={j} className={`size-3.5 sm:size-4 ${node.iconColor}`} />
                ))}
              </div>
              <span
                className={`text-[10px] sm:text-[11px] font-bold tracking-tight ${node.highlight ? "text-primary" : "text-foreground"}`}
              >
                {node.title}
              </span>
              <span className="text-[8px] sm:text-[9px] text-muted-foreground mt-0.5 leading-tight">
                {node.desc}
              </span>
            </motion.div>

            {i < NODES.length - 1 && (
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: i * 0.2 + 0.3, duration: 0.4 }}
                className="flex items-center shrink-0"
              >
                <div className="h-px w-6 sm:w-10 bg-gradient-to-r from-muted-foreground/30 to-primary/40 relative">
                  <motion.div
                    className="absolute -right-1 -top-[3px]"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
                  >
                    <ArrowRight className="size-[7px] text-primary" />
                  </motion.div>
                </div>
              </motion.div>
            )}
          </div>
        ))}
      </div>

      {/* ── Divider ── */}
      <motion.div
        initial={{ opacity: 0, scaleX: 0 }}
        animate={{ opacity: 1, scaleX: 1 }}
        transition={{ delay: 0.9, duration: 0.4 }}
        className="w-full max-w-[280px] h-px bg-gradient-to-r from-transparent via-border to-transparent mb-5"
      />

      {/* ── Bottom: Output cards ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1, duration: 0.4 }}
        className="grid grid-cols-3 gap-2 w-full max-w-[320px]"
      >
        {OUTPUTS.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1 + i * 0.12, duration: 0.3 }}
            className="rounded-lg border border-card-border bg-card px-2.5 py-2 flex flex-col items-center text-center"
          >
            <item.icon className="size-3.5 text-primary mb-1" />
            <span className="text-[10px] font-semibold text-foreground leading-tight">
              {item.label}
            </span>
            <span className="text-[7px] text-muted-foreground mt-0.5 leading-tight">
              {item.sub}
            </span>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Bottom caption ── */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 0.4 }}
        className="text-[9px] text-muted-foreground mt-4 text-center"
      >
        Import deals → Run calculation → Reps see earnings instantly
      </motion.p>
    </div>
  );
}
