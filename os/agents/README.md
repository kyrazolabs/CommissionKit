# CommissionKit AI Workforce

The AI agent workforce is organized into 5 teams under a single command structure. Nexus (Chief of Staff) coordinates all teams and reports to the founder.

| Team | Folder | Agents | Purpose |
|------|--------|--------|---------|
| **Command** | `nexus/` | @nexus, @blueprint | Task routing, organizational design, company architecture |
| **GTM** | `gtm/` | @scout, @clutch, @bridge | Lead generation, sales, partnerships |
| **Marketing** | `marketing/` | @ink, @signal, @lens | Content, social media, analytics |
| **Development** | `development/` | @forge, @pixel, @vault | Code, UI, infrastructure |
| **Product** | `product/` | @compass, @pulse, @craft | Roadmap, research, design |

> **All company documentation (identity, strategy, revenue, product, operations, people, customer, tools, governance) has been migrated to AFFiNE OS at `https://affine.commissionk.it`.**

## Agent Configuration

Agents are defined in `/root/.config/opencode/opencode.jsonc`. See `MODEL-ASSIGNMENTS.md` for model details and `OPENCODE-GUIDE.md` for usage instructions.

## Folder Structure

```
os/agents/
├── README.md                 # This file
├── MODEL-ASSIGNMENTS.md      # Model mapping for all agents
├── OPENCODE-GUIDE.md         # How to invoke and use agents
├── nexus/                    # Command center
│   ├── workflows/            # Coordination workflows
│   └── scripts/              # Nexus automation scripts
├── gtm/                      # Go-to-market team
│   ├── workflows/            # Sales & partnership workflows
│   └── scripts/              # GTM automation scripts
├── marketing/                # Marketing team
│   ├── workflows/            # Content & social workflows
│   └── scripts/              # Marketing automation scripts
├── development/              # Engineering team
│   ├── workflows/            # Dev & deploy workflows
│   └── scripts/              # Development automation scripts
└── product/                  # Product team
    ├── workflows/            # Product & design workflows
    └── scripts/              # Product automation scripts
```

## How Workflows Work

Each team has a `workflows/` directory containing instructions for common multi-step tasks. Nexus delegates tasks to the appropriate team, and agents follow their team's workflows.

Each `scripts/` directory contains executable scripts that agents can run to automate their work.

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Agent models: `os/agents/MODEL-ASSIGNMENTS.md`
- Usage guide: `os/agents/OPENCODE-GUIDE.md`
- Agent skills: `.agents/skills/`
