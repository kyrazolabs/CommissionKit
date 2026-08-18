import { ArrowRight, Bot } from "lucide-react";
import { fadeIn, useInView } from "./hooks";

const AI_ASSISTANTS = [
  {
    id: "chatgpt",
    label: "ChatGPT",
    img: "/imgs/chatgpt.webp",
    tagline: "Query deals, reps, and runs",
  },
  { id: "claude", label: "Claude", img: "/imgs/claude.webp", tagline: "Read your commission data" },
  { id: "gemini", label: "Gemini", img: "/imgs/gemini.webp", tagline: "Dashboards on demand" },
  {
    id: "copilot",
    label: "Copilot",
    img: "/imgs/copilot.webp",
    tagline: "Answers from your workspace",
  },
  {
    id: "grok",
    label: "Grok",
    img: "/imgs/grok.webp",
    tagline: "Real-time answers from your data",
  },
  { id: "mcp", label: "Any MCP client", img: null, tagline: "Scoped to your workspace" },
];

export function McpSupport() {
  const { ref, inView } = useInView();

  return (
    <section className="py-16 bg-background border-b border-border/60" ref={ref}>
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16 items-center">
          {/* Text */}
          <div className="space-y-6 lg:col-span-2" style={fadeIn(inView, 0)}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card/60 backdrop-blur-sm border border-border/60 text-xs font-medium text-muted-foreground">
              <Bot className="size-4 text-primary" />
              MCP support
            </div>
            <h2 className="text-3xl sm:text-4xl lg:text-[40px] font-bold text-foreground tracking-tight font-display">
              Your AI assistant can read your commission data, too
            </h2>
            <p className="text-base text-muted-foreground">
              CommissionKit is an MCP server. Connect ChatGPT, Claude, or any MCP-compatible tool to
              query deals, reps, payouts, and runs. It is scoped to your workspace, with a full
              audit trail.
            </p>
            <a
              href="https://docs.commissionkit.co/guides/mcp"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
            >
              Read the MCP guide
              <ArrowRight className="size-4" />
            </a>
          </div>

          {/* Vertical cards scroller */}
          <div className="marquee-vertical" style={fadeIn(inView, 150)}>
            <div className="marquee-vertical-track">
              {[...AI_ASSISTANTS, ...AI_ASSISTANTS].map((a, i) => (
                <div
                  key={`${a.id}-${i}`}
                  className="flex items-start gap-3 rounded-xl border border-card-border bg-card p-4 card-shadow"
                >
                  <div className="size-10 rounded-lg bg-white border border-border flex items-center justify-center shrink-0">
                    {a.img ? (
                      <img src={a.img} alt={a.label} className="size-6 object-contain" />
                    ) : (
                      <Bot className="size-5 text-primary" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-foreground">{a.label}</div>
                    <div className="text-xs text-muted-foreground">{a.tagline}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
