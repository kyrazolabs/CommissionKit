# AGENTS.md — LinkedIn Company Research & CRM Data Entry System

Multi-agent system for automated LinkedIn-based company research, sales qualification, and structured data entry into Twenty CRM. Uses four specialized sub-agents with distinct models and responsibilities.

---

## Agent Roles & Model Assignments

| Agent | Responsibility | Model |
|---|---|---|
| **Browser Agent** | LinkedIn browsing, company & people research, data extraction | `mimo-v2.5` |
| **Copywriting Agent** | Connection request notes, follow-up messages, objection handling templates | `kimi-k2.5` |
| **CRM Agent** | Data structuring, cleaning, and writing to Twenty CRM via Twenty MCP | `deepseek-v4-flash` |
| **Memory Agent** | Reading/writing persistent memory via Twenty Notes | `deepseek-v4-flash` |

---

## Required Skills

Before beginning any task, each agent must load and follow the relevant skills from `~/.config/opencode/skills`. The following skills are available and must be used where applicable:

| Skill | When to Use | Required By |
|---|---|---|
| `agent-browser` | LinkedIn browsing, page navigation, data extraction, web interaction | Browser Agent |
| `research` | Structuring research, verifying sources, avoiding assumptions | Browser Agent, Copywriting Agent |
| `find-skills` | Discover and load additional/new skills before starting any task | **All agents at startup** |
| `dashboard-building` | Twenty CRM dashboards for pipeline visibility | CRM Agent |
| `data-manipulation` | Cleaning, structuring, and transforming collected data before CRM write | CRM Agent, Memory Agent |
| `pdf-processing` | Extracting data from company reports, brochures, or PDF documents found during research | Browser Agent |
| `word-document-processing` | Processing `.docx` files encountered during research | Browser Agent |

> **Skill Loading Rule:** Every agent MUST call `find-skills` at the start of its run to check for newly added or updated skills. Skills must be read fully before being applied — never skim or assume skill content.

---

## System Workflow Overview

```
Browser Agent (research)
        ↓
  [raw company + people data]
        ↓
CRM Agent (structure + write to Twenty)
        ↓
Memory Agent (read prior notes, write session summary)
        ↓
Copywriting Agent (messages from templates)
        ↓
CRM Agent (write messages to Person Notes)
        ↓
Human Handoff (follow-up tasks in Twenty)
```

---

## Phase 1 — Browser Agent (Research)

**Model:** `mimo-v2.5`
**Skills:** Load `find-skills` → `agent-browser` → `research` (in that order)

### Objective

Open LinkedIn and search for target companies matching the [Ideal Client Profile](#ideal-client-profile). For each company, collect **only verified, real data** — never assume, guess, or infer. Missing data must be explicitly flagged for human follow-up.

### Ideal Client Profile

Reference `SALES-PLAYBOOK.md` Phase 1 for full criteria. Summary:

- B2B companies with a dedicated sales team (5+ reps)
- Industries: SaaS, real estate, insurance, distribution, manufacturing, staffing, telecoms
- Pain signal: still managing commissions in Excel or Google Sheets
- Revenue range: $1M–$50M ARR

### Company-Level Data to Collect

| Field | Required | Source |
|---|---|---|
| Company name | Yes | LinkedIn company page |
| Industry | Yes | LinkedIn page |
| Company size (employees) | Yes | LinkedIn page |
| Headquarters location | Yes | LinkedIn page |
| Website URL | Yes | LinkedIn page |
| Business model (B2B / B2C / SaaS / Services / etc.) | Yes | LinkedIn, website, job postings |
| Products and services offered | Yes | LinkedIn, website |
| Do they use commissions in their model? | Assess | Job postings, sales rep profiles, industry signals |
| How they manage commissions (tools, platforms, processes) | If discoverable | Job postings, employee profiles, tech stack signals |
| Public signals about commission structure or sales team setup | If discoverable | Job postings, LinkedIn posts, employee activity |
| Tech stack signals | If discoverable | LinkedIn, job postings, public profiles |
| Sales opportunity assessment: fit for CommissionKit? | Yes (scored) | Analysis of all collected data |

### People-Level Data to Collect (Key Contacts)

| Field | Required | Source |
|---|---|---|
| Full name | Yes | LinkedIn profile |
| Current title | Yes | LinkedIn profile |
| LinkedIn profile URL | Yes | LinkedIn profile |
| Department | Yes | Derived from title |
| Seniority level | Yes | Derived from title |
| Public posts or activity relevant to sales/commissions/RevOps | If any | LinkedIn activity feed |
| Connection degree (1st, 2nd, 3rd+) | Yes | LinkedIn |

### Persona Priority Order

Target **one of these three** at each company (in order):

1. Head of Sales Operations / Revenue Operations
2. CFO or Finance Director
3. VP of Sales

### Research Rules

- **No assumptions.** If data is not explicitly visible on a public source, flag it as `UNKNOWN` with a reason.
- **Verify cross-source.** If a job posting mentions a tool, confirm it with employee profiles before recording it as fact.
- **Flag gaps explicitly.** After each company profile, output a `MISSING_DATA` block listing what could not be found and why.
- **Rate limiting.** Respect LinkedIn's rate limits. Space requests and avoid aggressive scraping patterns.

### Output Format

After researching each company, produce a structured JSON object:

```json
{
  "company": {
    "name": "string",
    "industry": "string",
    "size": "string",
    "location": "string",
    "website": "string",
    "business_model": "string",
    "products_services": ["string"],
    "uses_commissions": "boolean | UNKNOWN",
    "commission_management": "string | UNKNOWN",
    "commission_signals": ["string"],
    "tech_stack_signals": ["string"],
    "opportunity_score": "high | medium | low | none",
    "opportunity_rationale": "string"
  },
  "contacts": [
    {
      "full_name": "string",
      "title": "string",
      "linkedin_url": "string",
      "department": "string",
      "seniority": "string",
      "relevant_activity": ["string"],
      "connection_degree": "1st | 2nd | 3rd+"
    }
  ],
  "missing_data": [
    {
      "field": "string",
      "reason": "string"
    }
  ],
  "research_notes": "string"
}
```

The opportunity score must reference SALES-PLAYBOOK.md qualification criteria:
- **High:** Clear commission pain signals (Excel/Sheets usage, hiring commission analysts, reps disputing payouts), B2B, 5+ reps, in target revenue range
- **Medium:** Some signals, missing key data points, requires human follow-up to confirm
- **Low:** Weak or no signals, but still a potential fit
- **None:** Does not match ICP, no commission pain detected

---

## Phase 2 — CRM Agent (Data Entry)

**Model:** `deepseek-v4-flash`
**Skills:** Load `find-skills` → `data-manipulation` → Twenty MCP tools

### Objective

Take the structured JSON output from the Browser Agent and create all necessary records in Twenty CRM. Reference `PLATFORM.md` for field mappings and record structure.

### Records to Create (per company)

#### 1. Company Record
Save all company-level fields. Map Browser Agent output fields to Twenty Company fields:
- `name` → Company Name
- `industry` → Industry
- `size` → Number of Employees
- `location` → Address fields
- `website` → Website URL
- `business_model` → Custom field or note
- Opportunity assessment → Custom field or tag

#### 2. People Records
For each contact person:
- `full_name` → Person Name
- `title` → Job Title
- `linkedin_url` → LinkedIn URL field
- `department` → Department
- `seniority` → Custom field or tag
- Link the person to the company via a Company relation

#### 3. Company Note
Write a detailed markdown note containing:
- All collected company data in structured format
- Opportunity assessment and rationale
- Missing data items
- Research timestamp and source agent
- Attach the note to the Company record as a relation

**Note template:**
```markdown
# [Company Name] — Research Notes
**Date:** [timestamp]
**Agent:** deepseek-v4-flash
**Source:** LinkedIn

## Company Overview
- Industry: ...
- Size: ...
- Location: ...
- Website: ...
- Business Model: ...

## Commission Assessment
- Uses commissions: [yes/no/UNKNOWN]
- Management approach: ...
- Signals detected: ...
- Opportunity score: [high/medium/low/none]
- Rationale: ...

## Tech Stack Signals
- ...

## Missing Data
- [field]: [reason not found]

## Next Steps
- [ ] Human follow-up questions
```

#### 4. Person Note
For each contact, write a detailed markdown note containing:
- All collected person data
- Relevant LinkedIn activity
- Connection degree and approach strategy
- Generated connection request message (from Copywriting Agent)
- Generated follow-up message template (from Copywriting Agent)
- Objection-handling notes (from Copywriting Agent)
- Discovery question script (from Copywriting Agent)
- Attach the note to the Person record as a relation

#### 5. Task Records
For each contact person, create a Task in Twenty:
- **Title:** `Contact [Person Name] at [Company Name] — LinkedIn Outreach`
- **Assignee:** The human operator (or leave unassigned for manual assignment)
- **Priority:** Based on opportunity score:
  - `high` opportunity → High priority
  - `medium` opportunity → Medium priority
  - `low` opportunity → Low priority
- **Due date:** Suggested timing (high: 2 days, medium: 5 days, low: 10 days)
- **Body (task description):**
  - Summary of the company and opportunity
  - Specific questions to ask (from missing data)
  - Context about the company and why it's a good fit
  - Link to the Person Note and Company Note
  - Connection request message to use
- **Relations:** Link to the Company and Person records

---

## Phase 3 — Memory Agent (Persistence & Continuity)

**Model:** `deepseek-v4-flash`
**Skills:** Load `find-skills` → `data-manipulation` → Twenty MCP tools

### Objective

Use Twenty Notes as the persistent memory layer to ensure continuity across sessions and prevent duplicate research.

### Before Research (Pre-Flight Check)

Before the Browser Agent researches any company:

1. Search Twenty for existing Company records matching the target company name
2. Read existing Company Notes and Person Notes for that company
3. Return a summary to the Browser Agent:
   - **Already researched:** What data exists, when it was collected, what was found
   - **Pending tasks:** Any open tasks for this company
   - **Gaps:** What data is still missing from prior sessions
4. If the company was fully researched within the last 30 days, flag it as `SKIP` to avoid duplication

### After Research (Session Summary)

After the CRM Agent completes data entry, write a **Session Memory Note**:

```markdown
# Session Summary — [Date]
**Agent:** Memory Agent (deepseek-v4-flash)
**Session type:** Company research

## Companies Researched
- [Company A]: high opportunity, 2 contacts found, missing [X, Y, Z]
- [Company B]: medium opportunity, 1 contact found, missing [W]

## Companies Skipped
- [Company C]: fully researched on [date], no new signals

## Pending Human Actions
- [ ] Contact [Person A] at [Company A] (high priority, due [date])
- [ ] Contact [Person B] at [Company B] (medium priority, due [date])

## Missing Data Across All Companies
- [field]: common gap, need human to source
```

This note serves as the checkpoint for the next session.

---

## Phase 4 — Copywriting Agent (Message Generation)

**Model:** `kimi-k2.5`
**Skills:** Load `find-skills` → `research`

### Objective

Generate personalized outreach messages for each contact person. Reference `SALES-PLAYBOOK.md` Phase 2 for tone, structure, and templates.

### Outputs (per contact person)

#### 1. LinkedIn Connection Request Message
- Must be **under 300 characters**
- Personalized with the person's name, company, and industry
- Template reference from SALES-PLAYBOOK.md:
  > "Hi [Name] — I build sales commission automation tools for [industry] teams. Noticed [Company] is scaling its sales org. Would love to connect and swap notes."

#### 2. Follow-Up Message (send 2–3 days after connecting)
- Template reference:
  > "Thanks for connecting, [Name]. Quick question — how does your team currently handle commission calculations at the end of each month? I ask because most sales ops teams I talk to are still doing it in spreadsheets, which gets painful fast. Curious if that's the case for you too."

#### 3. Discovery Call Prompt (if they engage)
- Template reference:
  > "That makes sense. We've seen that a lot. Would you be open to a 20-minute call? I'd love to understand your current setup and show you how we've helped similar teams cut commission processing time by 80%+."

#### 4. Objection-Handling Templates
Generate pre-prepared responses for common objections. Reference SALES-PLAYBOOK.md Phase 6:

| Objection | Response Strategy |
|---|---|
| "We don't have budget" | Suggest revisiting later, offer lighter starting point |
| "Our commission structure is too complex" | Position custom engine as the exact solution |
| "We already looked at [competitor]" | Differentiate on speed of implementation and cost |
| "Can we try it first?" | Offer demo environment with their commission structure |

#### 5. No-Response Follow-Up
If no response after X days (default: 7), generate a polite follow-up message. Log the attempt in the Person Note.

#### 6. Discovery Question Script
Generate a tailored set of discovery questions for the human follow-up call, aligned with the missing data from research. Reference SALES-PLAYBOOK.md Phase 3 for question templates.

### Message Storage

All generated messages must be written to the **Person Note** in Twenty CRM by the CRM Agent. The Person Note should include:
- Connection request message (ready to copy-paste)
- Follow-up message template
- Discovery question script
- Objection handling notes
- No-response follow-up templates

---

## Human Handoff Protocol

### When the Automated Phase Is Complete

The CRM Agent assigns Tasks to a human operator. Each task contains:
- The contact person's name and LinkedIn URL
- The connection request message (ready to copy-paste into LinkedIn)
- Context about the company and opportunity
- Specific questions to ask that the Browser Agent could not answer
- Priority level and suggested timing

### Edge Cases & Follow-Up

| Scenario | Action |
|---|---|
| Person accepts connection | Human sends follow-up message from Person Note. Log acceptance in Person Note. |
| Person responds and engages | Human uses discovery question script. Schedule discovery call. Log in Person Note. |
| No response after 7 days | Human sends no-response follow-up. Log attempt in Person Note. Update task. |
| No response after 14 days | Mark task as deferred. Note in Person Note. Revisit in 30 days. |
| Data discovered during human outreach | Human (or CRM Agent on re-trigger) writes new data to Person/Company Notes. |
| New contact discovered during outreach | Trigger CRM Agent to create new Person record + Note + Task. |
| Company is disqualified | Update Company record status. Note rationale. Close all related tasks. |

### Re-Triggering the System

At the start of each new session, the Memory Agent reads all Company/Person Notes to:
- Identify companies that need re-research
- Identify contacts with pending outreach tasks
- Surface any stale tasks that need updating
- Provide the human operator a prioritized action list

---

## Reference Files

- **`SALES-PLAYBOOK.md`** — Qualification criteria (Phase 1), messaging tone and templates (Phase 2, 6), discovery question scripts (Phase 3), opportunity scoring signals (Phase 3), outreach cadence and follow-up timing
- **`PLATFORM.md`** — CommissionKit product overview, standard vs. custom engine features, pricing tiers, ideal use cases to reference in qualification

---

## Session Kickoff Checklist

When a new research session begins, the coordinating agent (or human) must ensure:

1. [ ] All agents load `find-skills` and check for updated/new skills
2. [ ] Browser Agent loads `agent-browser` and `research` skills fully
3. [ ] CRM Agent loads `data-manipulation` skill fully
4. [ ] Memory Agent reads existing Twenty Notes to avoid duplication
5. [ ] Memory Agent produces a pre-flight summary of already-researched companies
6. [ ] SALES-PLAYBOOK.md and PLATFORM.md are accessible for reference
7. [ ] Twenty MCP is connected and verified
8. [ ] Session memory note is created for continuity

---

## Session Shutdown Checklist

1. [ ] All company records written to Twenty CRM
2. [ ] All person records written and linked to companies
3. [ ] All Company Notes populated with research data
4. [ ] All Person Notes populated with research data + copywriting messages
5. [ ] All human follow-up tasks created with full context
6. [ ] Session memory note written by Memory Agent
7. [ ] Gaps and unknown data documented with specific questions for human follow-up
