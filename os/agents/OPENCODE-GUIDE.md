# CommissionKit AI Workforce — OpenCode Agents Guide

You now have **14 real OpenCode agents** configured in your global `opencode.json`. They work natively with the OpenCode platform.

## How to Use Them

### 1. Invoke an agent with `@`

In any OpenCode chat, type `@` followed by the agent name:

```
@scout research 10 SaaS companies using spreadsheets for commissions
```

```
@ink write a blog post about commission calculation mistakes
```

```
@forge review the tiered commission engine for bugs
```

```
@compass prioritize Q3 features based on user feedback
```

### 2. Default Agent: Nexus

Nexus is your default agent. If you don't specify `@`, Nexus handles your request and routes to the right specialist.

```
I need leads researched and content written
```
→ Nexus will delegate to @scout and @ink

### 3. Available Agents

| Agent | Use For | Team |
|-------|---------|------|
| **@nexus** | Everything. Routes tasks, gives briefings, coordinates teams | Command |
| **@blueprint** | Organizational design, process flows, governance frameworks, company OS architecture | Command |
| **@scout** | LinkedIn research, lead scoring, company profiling | GTM |
| **@clutch** | Sales outreach, objection handling, demo scripts | GTM |
| **@bridge** | Partnership research, co-marketing, integrations | GTM |
| **@ink** | Blog posts, SEO content, lead magnets, newsletters | Marketing |
| **@signal** | Social media, Reddit, X/LinkedIn engagement | Marketing |
| **@lens** | Analytics, dashboards, metrics, recommendations | Marketing |
| **@forge** | Code review, architecture, backend, deployment | Development |
| **@pixel** | React components, UI, frontend, design system | Development |
| **@vault** | DevOps, security, infrastructure, Coolify | Development |
| **@compass** | Roadmap, product briefs, competitive analysis | Product |
| **@pulse** | User research, surveys, support analysis | Product |
| **@craft** | Wireframes, UX design, user flows, accessibility | Product |
| **@plan** | (Hidden) Complex feature planning — loads /architect skill | Technical |
| **@review** | (Hidden) Post-build verification — loads /review skill | Technical |

### 4. Agent Permissions

Each agent has different tool access:

| Agent | Web | Code | Deploy | Edit Files |
|-------|-----|------|--------|------------|
| @nexus | ✅ | ✅ | ✅ | ✅ |
| @blueprint | ✅ | ✅ | ❌ | ✅ |
| @scout | ✅ | ❌ | ❌ | ❌ |
| @clutch | ✅ | ❌ | ❌ | ❌ |
| @ink | ✅ | ❌ | ❌ | ✅ |
| @forge | ✅ | ✅ | ✅ | ✅ |
| @pixel | ❌ | ✅ | ❌ | ✅ |
| @vault | ❌ | ✅ | ✅ | ✅ |
| @compass | ✅ | ❌ | ❌ | ✅ |

### 5. Example Conversations

**Research:**
```
@scout Find 5 B2B SaaS companies with sales ops hiring on LinkedIn.
Focus on companies 10-50 employees that mention commissions or spreadsheets.
```

**Content:**
```
@ink Write a 1,500-word blog post targeting "sales commission tracking software".
Hook: reps doing shadow accounting in spreadsheets.
Include 5 mistakes, real impact, and how CommissionKit solves them.
```

**Code:**
```
@forge Review artifacts/api/src/workers/engines/standard.engine.ts
Check tiered calculation logic for edge cases.
Suggest test cases and identify bugs.
```

**Product:**
```
@compass Compare CommissionKit to Spiff, CaptivateIQ, and Xactly.
Build a feature/pricing matrix and recommend our positioning.
```

**Social:**
```
@signal Find 3 posts in r/salesops from this week asking about commission tools.
Draft helpful responses that naturally mention CommissionKit.
```

**Analytics:**
```
@lens Build a Monday Dashboard template showing:
- MRR and customer count
- Pipeline stages and conversion
- Content performance top 3
- Open bugs and deploy status
```

### 6. Skills Integration

Agents automatically load OpenCode skills:

- **/architect** → @plan agent uses this for feature planning
- **/review** → @review agent uses this for post-build verification
- **/imprint** → @pixel uses this after building UI components
- **/recover** → @forge and @vault use this for incident response
- **/remember** → @nexus uses this for session continuity

Business skills in `.agents/skills/`:
- **customer-research** → @scout, @compass, @pulse, @bridge for multi-source research
- **draft-outreach** → @clutch for personalized outreach sequences
- **content-creation** → @ink for blog posts, social copy, landing pages
- **seo-audit** → @ink for keyword research and content gap analysis
- **linkedin-marketing** → @signal for LinkedIn content and engagement
- **competitive-brief** → @compass, @bridge for competitor and partnership analysis
- **interview-prep** → @pulse for structured customer interview plans

### 7. Configuration

Agents are defined in:
```
/root/.config/opencode/opencode.jsonc
```

Edit the `agent` section to:
- Change models (currently `anthropic/claude-sonnet-4`)
- Adjust permissions
- Modify system prompts
- Add new agents

Skills paths are configured as:
```json
"skills": {
  "paths": [
    "/root/workspaces/CommissionKit/.opencode/skills",
    "/root/workspaces/CommissionKit/os/skills"
  ]
}
```

### 8. Restart OpenCode

After editing `opencode.jsonc`, restart OpenCode to load new agents:
```bash
# Exit and restart your opencode session
# Or use the opencode CLI reload command
```

---

**That's it. Just type `@agent-name` and tell them what to do.**

---
## Where to Go Next

- Back to entry point: `AGENTS.md`
- Agent models: `os/agents/MODEL-ASSIGNMENTS.md`
- OS status: `os/STATUS.md`
