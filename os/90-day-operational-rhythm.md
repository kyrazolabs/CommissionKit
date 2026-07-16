# Operational Architecture Brief: 90-Day Execution Rhythm

**Author:** Blueprint (Company Architect)
**Date:** July 10, 2026
**Status:** Recommendation pending founder approval
**Type:** Architecture Proposal — Problem → Design → Tradeoffs → Recommendation

---

## 1. Problem Statement

CommissionKit has a well-architected operating system and zero execution. The gap between documentation and action is the primary bottleneck.

**Root cause:** The OS was architected for a company with traction (50+ customers, 10+ employees) and then applied to a pre-revenue startup. This creates four structural problems:

| Problem | Symptom | Evidence |
|---------|---------|----------|
| **Attention fragmentation** | 14 agents, 4 OKR objectives, 7 AFFiNE databases — all idle | All Q3 KRs at 🔴 / $0 |
| **Process overhead** | Documentation precedes execution | 39 AFFiNE docs, 0 customers |
| **Target misalignment** | Aggressive numbers without ramp-up | 50 leads/week target vs. 3 actual |
| **Strategy sprawl** | Planning phases 2-3 while phase 1 hasn't started | PLG motion defined for month 4+ with zero pipeline |

**The core issue:** The founder's attention is the scarcest resource. Every document, agent, and OKR that doesn't directly contribute to getting Customer #1 is diluting that attention.

---

## 2. Design: The Lean Execution System

### Guiding Principle

> Everything that doesn't directly contribute to acquiring Customer #1 within 2 weeks is deferred. Documentation follows execution — never the other way around.

---

### 2.1 Meeting & Coordination Cadence

Traditional meetings are anti-patterns for an AI agent workforce. Agents don't need "meetings" — they need clear task assignments, context, and async reporting.

| Cadence | What | Who | Duration | Output |
|---------|------|-----|----------|--------|
| **Daily (10 min)** | Morning brief: "Here's what I'm doing today, here's what agents need to produce." Evening summary: agents submit outputs to Nexus, Nexus compiles 5-line summary for founder. | Founder → Nexus → Agents → Nexus → Founder | 10 min each session | Task assignments, completions, blockers |
| **Weekly (Fri, 30 min)** | Pipeline review: leads in → outreach → responses → demos → closes. Metrics vs. targets. Go/no-go on deals. Next week priorities. | Founder + Nexus (agents submit async input before the review) | 30 min | Pipeline health, metric check, week plan |
| **Monthly (60 min)** | Strategy check: OKR progress, process tune, resource reallocation. Blueprint activated for this only. | Founder + Nexus + Blueprint | 60 min | OKR update, process adjustments |
| **On-Demand** | Any agent escalates through Nexus when blocked or opportunity emerges. Founder can ping any agent directly. | Any agent → Nexus → Founder | Async | Unblocked or decision made |

**Key rule: No synchronous agent meetings. All agent coordination is async through Nexus.**

The founder's role:
- **Morning (5-10 min):** Write the daily brief. What's the priority today? What does each active agent need to produce?
- **During day:** Execute — take calls, run demos, review outreach drafts.
- **Evening (5-10 min):** Read Nexus's evening summary. Approve tomorrow's tasks.

---

### 2.2 Agent Activation Model

At zero customers, running all 14 agents daily is wasteful. Agents should be tiered by activation frequency.

**TIER 1 — Core (daily active, non-negotiable):**

| Agent | Role | Daily Task | Why Daily |
|-------|------|------------|-----------|
| **@nexus** | Chief of Staff | Triage founder's brief, assign tasks to agents, compile evening summary, maintain pipeline tracker. | The operational backbone. Without Nexus, the system doesn't run. |
| **@scout** | Lead Generation | Research ICP-matching companies, find decision-makers, enrich contact data. Deliver 5-10 qualified leads/day. | Pipeline is the only thing that matters. Daily lead flow is essential. |

**TIER 2 — Regular (3-4x/week):**

| Agent | Role | Task | Why Regular |
|-------|------|------|-------------|
| **@ink** | Content | Write outreach-supporting content. NOT generic blog posts — research-backed insights Scout and Clutch can use. One piece 2-3x/week. | Content that serves pipeline, not calendar quotas. |
| **@signal** | Social | LinkedIn + X presence. Engage in commission/sales ops conversations. Not for virality — for credibility when prospects check us out. | Social proof builds over time. Daily touch, batch-scheduled. |
| **@lens** | Growth Analytics | Compile weekly metrics, analyze pipeline conversion rates, flag funnel leaks. Batch work, not daily. | Metrics inform decisions. Weekly cadence is sufficient. |

**TIER 3 — Conditional (activated by pipeline events, 1-2x/week):**

| Agent | Role | Activation Trigger | Task When Active |
|-------|------|--------------------| ------------------|
| **@clutch** | Sales Closer | Scout delivers 5+ qualified leads. | Draft personalized outreach emails/LinkedIn messages. Founder reviews and sends. |
| **@blueprint** | Company Architect | Monthly strategy review OR process breakdown. | Architecture sprint: diagnose, redesign, document. Dormant between sprints. |

**TIER 4 — Dormant (activated only on explicit founder request):**

| Agent | Role | Why Dormant |
|-------|------|-------------|
| **@bridge** | Partnerships | Zero value at 0 customers. Partnerships require leverage we don't have yet. |
| **@forge** | Tech Lead | Product exists. No feature development needed until customers demand it. |
| **@pixel** | Frontend Engineer | Same — no new UI work until customer feedback justifies it. |
| **@vault** | DevOps | Infrastructure is stable. Monitor passively, activate for incidents only. |
| **@pulse** | User Research | No users to research. Activate after Customer #5 for feedback synthesis. |
| **@craft** | UX Designer | No UX iteration without user data. |
| **@compass** | Product Manager | Roadmap is: get customers. Formal roadmap planning starts after Customer #10. |
| **@plan** | Feature Planner | No features being planned. |
| **@review** | Code Reviewer | No code being written (bug fixes only). |

**Result: 6 active agents (down from 14). 57% reduction in coordination overhead.**

---

### 2.3 The Single Most Important Process: Lead-to-Customer Pipeline

This is the ONLY process that needs formal structure right now. Every other process (content, social, product, support) exists to serve this one.

**Pipeline Stages:**

```
IDENTIFY  →  RESEARCH  →  OUTREACH  →  ENGAGED  →  DEMO  →  CLOSED
Scout        Scout+Ink    Clutch        Founder      Founder   Founder
(daily)      (daily)      (2-3x/wk)    (daily)      (daily)   (weekly)
```

| Stage | Definition | Agent | Founder Action |
|-------|-----------|-------|----------------|
| **IDENTIFY** | Company matching ICP found. Contact info enriched. | Scout | Review list, prioritize top 5-10. |
| **RESEARCH** | Pain points identified (job postings, LinkedIn, tech stack). Value hypothesis formed. | Scout + Ink | Confirm research quality, add founder intuition. |
| **OUTREACH** | Personalized email/LinkedIn message drafted. References research. | Clutch (draft) | Review, personalize further, send. |
| **ENGAGED** | Prospect replied or clicked. Interest confirmed. | — | Founder handles all engagement directly. |
| **DEMO** | Discovery call completed. Demo booked or done. | Clutch (follow-up materials) | Founder runs every demo. No exceptions at this stage. |
| **CLOSED** | Won (trial → paid) or Lost (document why). | Clutch (onboarding sequence) | Founder closes. Nexus updates pipeline. |

**Tool:** Single AFFiNE database — the existing **Leads Database** and **Deal Pipeline**. Merge them into one view. No need for separate trackers at this stage.

**Owner:** Founder (all customer-facing stages). Nexus (tracking and process). Agents (support at each stage).

**Rule:** No process gets documented until it's been executed manually at least 3 times. Documentation follows execution.

---

### 2.4 Target Ramp-Up (Realistic)

The current 50/10/5/2 weekly targets are the destination, not the starting line. Here's the ramp:

| Week | Leads Researched | Outreach Sent | Responses | Demos | Closes | Focus |
|------|-----------------|---------------|-----------|-------|--------|-------|
| **1-2** | 10-15 | 5-8 | 1-2 | 1 | 0 | Build pipeline. Test messaging. Learn what resonates. |
| **3-4** | 20-25 | 10-15 | 3-4 | 2 | 0-1 | Refine ICP based on who responds. Iterate outreach. |
| **5-8** | 30-40 | 20-25 | 6-8 | 3-4 | 1-2 | Scale what works. Double down on best channels. |
| **9-12** | 50 | 30-35 | 8-10 | 5 | 2 | Hit full targets. Start building towards Phase 2. |

**Week 1 priority:** Get 5 outreach messages sent. That's it. Volume compounds — week 1 is about quality, not quantity.

---

### 2.5 Governance: Decision Rights

For the Founder-Led phase, all strategic and customer-facing authority stays with the founder.

| Role | Authority | Escalation |
|------|-----------|------------|
| **Founder** | All strategic decisions. All customer-facing decisions. Final say on everything. | — |
| **Nexus** | Operational decisions: task assignment, agent prioritization, process adherence, pipeline tracking. | Escalates to founder when: strategic choice needed, customer escalation, or blocked >24h. |
| **Agents** | Execution decisions within their domain. No strategic authority. | Escalate to Nexus when: blocked, need more context, discover opportunity. |

**One rule:** If a process, document, meeting, or agent output doesn't contribute to getting Customer #1 within 2 weeks, kill it.

---

## 3. What's Over-Engineered: Strip List

| Component | Current State | 90-Day State | Rationale |
|-----------|--------------|--------------|-----------|
| **Strategy phases** | 3 phases defined (Founder → PLG → Sales+PLG) | Phase 1 only. Archive phases 2-3. | Planning phase 3 before phase 1 has a single customer is fiction. |
| **Active agents** | 14 agents, all theoretically active | 6 active (Nexus, Scout, Ink, Signal, Lens, Clutch). 8 dormant. | Dormant agents create noise without value. Reactivate when traction justifies it. |
| **Q3 OKR Objectives** | 4 objectives across 16 KRs | **1 objective only: Acquire 15 customers.** OKR O2 (self-serve product), O3 (content engine), O4 (platform stability) are secondary. Focus all agent capacity on O1. | At zero customers, focus beats spread. O2-O4 are important but not urgent. |
| **Weekly targets** | 50/10/5/2 from week 1 | Ramp from 10/5/1/0 over 12 weeks. | Unrealistic starting targets destroy morale and credibility. |
| **AFFiNE databases** | 7 operational databases (Content Calendar, Social Calendar, SEO Tracker, Lead Magnet Tracker, Leads, Outreach, Pipeline) | 2 databases: **Pipeline Tracker** (merged Leads + Outreach + Pipeline) and **Content Queue** (Ink's working list, not a calendar). | 7 databases for 0 customers is process theater. Track what needs tracking. |
| **Content calendar** | Pillar/content type/keyword/due date/author/URL | Delete. Replace with: "What content does the next outreach need?" | Content serves pipeline, not an editorial calendar. |
| **SEO keyword tracker** | 6 columns, position/volume/difficulty tracking | Delete. SEO is a 6-12 month game. | At 0 customers, an hour spent on SEO is an hour not spent on outreach. |
| **Lead magnet tracker** | 5 columns, download/conversion rate metrics | Keep the lead magnet (calculator is good) but kill the tracker. | 460 downloads with 0 customers means conversion, not tracking, is the problem. |
| **Product development** | OKR O2: onboarding flow, product tours, time-to-first-run | Pause all feature work. Bug fixes + critical prospect-requested features only. | Build features for customers you have, not customers you might get. |
| **Partnerships** | Strategy defined, Bridge assigned | Archive. Zero relevance at 0 customers. | Partnerships require mutual value. We bring no customer base to the table. |
| **Commission structure for human reps** | Defined: 30% first invoice, 10% recurring | Archive. This matters when hiring, not now. | No human reps exist. This is premature optimization. |
| **"Quick Wins" from STATUS.md** | Accounting tool, email config, help center, Monday dashboard | Kill the list. Only quick win that matters: get a customer. | These are operations tasks for a company with revenue. |
| **Twenty CRM** | Configured as CRM tool | Keep but simplify. Use as pipeline tracker only. | The AFFiNE pipeline database is sufficient. Twenty adds complexity at this stage. |
| **Customer Success / Support** | Journeys mapped, health scores defined, templates ready | One-line rule: "Founder handles all support. Response within 4 hours." | Support process for zero customers is premature. |

---

## 4. Tradeoffs

| Decision | Benefit | Cost | Mitigation |
|----------|---------|------|------------|
| **8 agents dormant** | Maximum founder focus, less coordination noise | Agents lose context; slower reactivation when needed | Nexus maintains a "dormant agent brief" — one paragraph on current state so reactivation is fast. |
| **No product development** | All founder time on sales | May lose a deal due to missing feature | If a prospect needs a feature to close, build it then. That's the right kind of feature work. |
| **Async-only coordination** | Founder controls schedule, deep work possible | Slower response to urgent opportunities | Founder monitors Nexus summary for "URGENT" flags. Agents escalate through Nexus. |
| **Stripped documentation** | Execution velocity | Knowledge loss if founder is unavailable | Nexus maintains a 1-page "current state" doc. Everything else is in the pipeline tracker. |
| **Single-objective focus (O1 only)** | Maximum momentum on customer acquisition | Content, product, stability may degrade | OKRs O2-O4 are paused, not deleted. Revisit when O1 hits 50% (8 customers). |
| **Pipeline-only process** | Clarity, simplicity | Other functions (billing, support) undefined until needed | Defined on-demand when the first situation arises. |

---

## 5. Recommendation: What To Do This Week

### Monday (Day 1): Activate the Core

1. **Nexus:** Set up the daily brief/summary rhythm. Create the merged Pipeline Tracker in AFFiNE (Leads + Outreach + Pipeline → single database with columns: Company, Contact, ICP Fit, Stage, Last Action, Next Action, Notes).
2. **Scout:** Begin daily lead generation. Target: 10 companies matching ICP by Friday. Focus on companies with strong signals (hiring sales ops, recent expansion, spreadsheet pain).
3. **All other agents:** Dormant until explicitly activated.

### Tuesday-Friday (Days 2-5): Build Pipeline

1. **Scout:** Deliver 2-3 qualified leads per day with enriched data.
2. **Ink** (activate Wednesday): Research top 5 leads. Find pain points. Draft value hypotheses.
3. **Clutch** (activate Thursday): Draft 3-5 personalized outreach messages based on Ink's research.
4. **Founder:** Review, personalize, and send outreach. Take any discovery calls.

### Friday: First Weekly Review

1. **Nexus:** Compile pipeline summary. What worked? What didn't?
2. **Lens** (activate Friday only): Run the numbers. Conversion rates. Time per stage.
3. **Founder:** Decide next week's priorities. Adjust ICP if needed. Approve agent activation for next week.

### Week 2: Iterate

1. Based on week 1 learnings, adjust messaging, ICP, or outreach channels.
2. Activate Signal for social presence if founder has bandwidth to review.
3. First demo target: 1 demo by end of week 2.

### Week 3-4: First Process Review

1. **Blueprint** activated for 1-day sprint: Formalize what's working, kill what's not.
2. First close expected: 0-1 by end of month 1.

### Month 2-3: Scale

1. Ramp Scout to 20-30 leads/week.
2. Ramp Clutch to 10-15 outreach/week.
3. Founder continues running all demos.
4. After Customer #5: Activate Pulse for feedback synthesis.
5. After Customer #10: Revisit OKR O2 (self-serve), O4 (stability). Consider reactivating engineering agents.

---

## 6. Success Metrics (90-Day)

| Metric | Week 1 | Week 4 | Week 12 |
|--------|--------|--------|---------|
| Qualified leads/week | 5 | 15 | 30+ |
| Outreach messages sent/week | 5 | 15 | 30+ |
| Discovery calls/week | 1 | 3 | 8+ |
| Demos completed/week | 0-1 | 2 | 5 |
| Customers closed | 0 | 1 | 5+ |
| MRR | $0 | $49-99 | $500+ |
| Active agents | 3 | 5 | 6 |

---

## Appendix: Daily Brief Template (for Nexus)

```
=== MORNING BRIEF ===
Date: [YYYY-MM-DD]
Founder's Focus Today: [1-2 sentences]
Scout Task: [What to research, how many leads, any ICP refinements]
Other Active Agents: [Agent: task]
Escalations/Blockers: [Any]

=== EVENING SUMMARY ===
Date: [YYYY-MM-DD]
Scout Output: [X leads found, top 3 companies]
Ink Output: [Content produced, research completed]
Clutch Output: [Outreach drafts ready for review]
Signal Output: [Posts published, engagements]
Pipeline Status: [Leads total | Outreach sent | Responses | Demos | Closed]
Blockers/Needs Founder Decision: [List]
Tomorrow's Plan: [Agent assignments for tomorrow]
```

---

*This brief is a recommendation pending founder review. Upon approval, Nexus owns execution of the daily rhythm. Blueprint reactivates at the monthly strategy review or on-demand if the system breaks.*

---

## Where to Go Next

- Back to entry point: `AGENTS.md`
- Current OS status: `os/STATUS.md`
- Revenue Command Center: AFFiNE → `Revenue Command Center`
- Agent workforce: `os/agents/`
