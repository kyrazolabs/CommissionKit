# CommissionKit AI Workforce — Model Assignments

All 15 agents now have their optimized models assigned in `/root/.config/opencode/opencode.jsonc`.

## Model Mapping

| Agent | Role | Model | Why This Model |
|-------|------|-------|----------------|
| **@nexus** | Chief of Staff | **DeepSeek V4 Pro** | Best reasoning & strategic coordination |
| **@blueprint** | Company Architect | **Qwen3.7 MAX** | Organizational design, process architecture, governance (shared with Nexus + Plan) |
| **@plan** | Feature Planner | **MiniMax M3** | Complex architecture decisions (shared with Nexus + Blueprint) |
| **@forge** | Tech Lead | **Kimi K2.7 Code** | Best for code review, architecture, debugging |
| **@review** | Code Reviewer | **GLM-5.2** | Code verification & standards checking (shared with Forge, used after build) |
| **@scout** | Lead Researcher | **MiMo-V2.5-Pro** | Specialized for web browsing, LinkedIn research, data extraction |
| **@compass** | Product Manager | **Qwen3.7 Max** | Strong reasoning for roadmap & prioritization |
| **@ink** | Content Director | **Qwen3.7 Plus** | Best creative writing, SEO content, long-form |
| **@clutch** | Sales Closer | **MiniMax M3** | Excellent communication, persuasion, empathy |
| **@lens** | Growth Analyst | **Qwen3.7 Plus** | Strong analytics, precision, dashboard building |
| **@signal** | Social Manager | **MiniMax M3** | Creative, engaging, trend-aware for social |
| **@vault** | DevOps Engineer | **DeepSeek V4 Pro** | Fast, systematic for monitoring & infrastructure |
| **@bridge** | Partnerships Lead | **Qwen3.6 Plus** | Diplomatic, strategic for partnerships |
| **@pixel** | Frontend Engineer | **MiniMax M2.7** | Efficient for UI implementation & components |
| **@pulse** | User Researcher | **Qwen3.6 Plus** | Solid for surveys, interviews, data synthesis |
| **@craft** | UX Designer | **MiMo-V2.5** | Good for design thinking, wireframes, flows |

## Notes

- **15 models → 16 agents**: 1 model is shared across 3 agents:
  - **DeepSeek V4 Pro** → Nexus (daily coordination) + Vault (DevOps Engineer) — used at different phases
  - **Kimi K2.7 Code** → Forge (build) used at different phases

- **Provider format**: `provider/model-name` (e.g., `deepseek/DeepSeek V4 Pro`)

- **Restart required**: After any edits to `opencode.jsonc`, restart your OpenCode session to reload agents.

## How to Check

```bash
# See model assignments
grep -n '"model"' /root/.config/opencode/opencode.jsonc

# Or just use the agents — they'll now run on their assigned models:
@scout research 10 companies
@ink write a blog post
@forge review the code
```

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Next: `os/agents/OPENCODE-GUIDE.md`
- Full OS overview: `os/README.md`
