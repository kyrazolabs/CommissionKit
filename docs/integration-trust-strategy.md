# Integration Pages — Trust Signal Strategy

**Status:** Pre-customer (zero paying users)
**Scope:** `/integrations/odoo`, `/integrations/hubspot`, `/integrations/salesforce`, `/integrations/custom`
**Author:** @compass
**Date:** 2026-07-23

---

## The Problem

Integration pages are bottom-of-funnel. Visitors already know they need commission software. They are checking one thing: "does this actually work with my stack?"

Right now these pages have zero trust signals. No logos, no quotes, no proof anyone has ever used the connector. The ROI section ("The Math on Time Saved") makes claims backed by nothing — "4-6 hrs saved per month" with no source.

A third-party audit flagged this. Their recommendation: "Since you don't have customers yet, don't fake it — but plan to swap in real logos/quotes the moment you land your first 2-3."

This document is that plan.

---

## 1. What to Collect First (Customer Trust Signals)

When the first paying customer connects an integration, collect these four things in order of effort:

### Tier A — Logo + Permission (ask on Day 1 of paid subscription)

- **Logo usage permission.** One sentence in the welcome email or onboarding call: "Can we display your logo on our integrations page as a customer?" Get written consent (email reply is fine). Store it in a `CustomerAsset` record or a simple spreadsheet.
- **Company name + industry + team size.** Enough to write "15-rep SaaS team using HubSpot" without naming them if they decline logo usage.

### Tier B — Quote (ask at Day 30, after first commission run)

- **One-sentence quote template.** Send them a pre-written prompt: "In one sentence, what changed about your commission process after connecting [CRM] to CommissionKit?" Give three examples so they know the length and tone you want:
  - "We used to spend two days a month on commission spreadsheets. Now it runs itself."
  - "Our reps stopped asking 'is this number right?' because they can see the calculation."
  - "The Odoo sync just works. I set it up once and haven't touched it since."
- **Permission to attribute.** Name + title + company, or "Finance Manager, 20-person SaaS company" if they prefer anonymous.

### Tier C — Result Statement (ask at Day 60, after two commission cycles)

- **One measurable outcome.** "What's one number that changed?" Examples:
  - "Commission processing went from 6 hours to 20 minutes."
  - "We had zero disputes last month for the first time."
  - "Reps check their portal daily now — they never did before."
- This is not a case study. It is a single stat with attribution.

### Tier D — Named Case Study (ask at Day 90+, after sustained usage)

- **Full case study permission.** This is a bigger ask. Only pursue when the customer is clearly happy and has run 3+ commission cycles. Offer to write it for them — they approve the draft.
- **Minimum viable case study:** Problem (2 sentences), Solution (how they use the integration), Result (2-3 numbers), Quote (1-2 sentences from a named person).

### Collection Mechanics

| Signal | When to ask | Method | Storage |
|--------|-------------|--------|---------|
| Logo permission | Day 1 | Welcome email or onboarding call | CRM field: `logo_consent` (boolean + date) |
| Company details | Day 1 | Signup form (optional fields) | CRM record |
| Quote | Day 30 | Email with prompt + examples | CRM field: `testimonial_quote` (text) |
| Result statement | Day 60 | Email or check-in call | CRM field: `result_statement` (text) |
| Case study | Day 90+ | Personal outreach from founder | Google Doc draft → customer approval |

---

## 2. Where to Place Trust Signals on Integration Pages

The current page structure (all four pages share this template):

```
1. Hero (connector visual)
2. Problem Statement (3 pain cards)
3. Features (6 feature cards)
4. How It Works (4 steps)
5. ROI — "The Math on Time Saved" ← THIS IS THE SLOT
6. FAQ
7. Final CTA
```

### Section 5 Transformation: ROI → Trust + ROI Block

The ROI section currently has 4 stat cards and a dollar-savings line. It becomes a hybrid trust section.

**Phase 1 (now, pre-customer):** Keep the 4 stat cards but add sourcing. Replace unsourced claims with honest framing:

| Current | Replace with |
|---------|-------------|
| "4-6 hrs saved per month" | "4-6 hrs/month estimated for a 20-rep team based on industry benchmarks" |
| "100% calculation accuracy" | "Eliminates spreadsheet formula errors — the #1 source of commission disputes" |
| "Real-time rep visibility" | Keep as-is (this is a feature claim, not a social proof claim) |
| "Zero CSV exports" | Keep as-is (this is a feature claim) |

Add a small note under the section: *"Estimates based on typical manual commission workflows for teams of this size. Actual results vary."*

**Phase 2 (first 3 customers):** Replace one stat card with a customer quote card. The quote card uses the same visual treatment (rounded-xl border bg-card) but with a quote icon, the quote text, and attribution. The remaining 3 stat cards stay.

**Phase 3 (first 10 customers):** Add a logo strip above the stat cards — 3-5 grayscale logos of customers using this specific integration. Below the stat cards, add one result statement as a pull quote.

**Phase 4 (first 50 customers):** Full transformation. Logo strip (5+ logos), 2 stat cards, 1 customer quote, 1 result statement. Add a "Trusted by X teams using [CRM]" line in the hero section.

### Placement Map

```
Hero
  └─ Phase 4: "Trusted by X teams using [Odoo/HubSpot/Salesforce]"

[... sections 2-4 unchanged ...]

Section 5: Trust + ROI
  ├─ Phase 2: Customer quote card (replaces 1 stat card)
  ├─ Phase 3: Logo strip above + result statement below
  └─ Phase 4: Logo strip + 2 stats + quote + result

FAQ
  └─ Phase 3: Add "What do your customers say?" FAQ item with a quote

Final CTA
  └─ Phase 2: Add "Join [N] teams already using CommissionKit with [CRM]" above the button
```

---

## 3. What Can Go In Right Now (Honest Signals, Zero Customers)

These are trust signals that do not require customers. They are technical credibility, transparency, and commitment signals.

### Technical Credibility (per integration)

Add a "Built on [Platform] Standards" callout in the FAQ section or as a small banner between Features and How It Works. Each integration gets specific, verifiable claims:

**Odoo:**
- "Built on Odoo's JSON-RPC API (documented since v14, stable across v15-v18)"
- "Reads `sale.order`, `res.users`, and `account.move` — standard Odoo models, no custom modules required"
- "Invoice payment states derived from actual `account.payment` records, not order status guesses"

**HubSpot:**
- "Auth via HubSpot Private App tokens — no OAuth redirect complexity"
- "Uses HubSpot's CRM v3 API (current generation, not legacy v1)"
- "Pipeline stage auto-discovery reads your actual `pipelines` configuration — no hardcoded stage names"

**Salesforce:**
- "OAuth 2.0 Client Credentials flow — no user login prompts during sync"
- "Reads Opportunities, Users, and custom fields via SOQL — works with any Salesforce edition that includes API access"
- "Sandbox support included — test your integration against a Salesforce sandbox before going live"

**Custom REST:**
- "JSONPath field mapping — point at any REST API response structure"
- "Four auth methods: Bearer token, API key header, Basic auth, custom header"
- "Three pagination strategies: offset, cursor, and page-based"
- "$div compute fields for APIs that return amounts in micro-units (cents, paise, etc.)"

### Security & Reliability Commitments

Add to the FAQ section on every integration page:

- **"Is my data secure?"** — "All data is encrypted in transit (TLS 1.3) and at rest. We never store your [CRM] credentials — only encrypted API tokens. You can revoke access from your [CRM] settings at any time."
- **"What happens if the sync fails?"** — "Failed syncs are retried automatically with exponential backoff. You get an email notification if a sync fails three times in a row. No data is lost — the next successful sync picks up where it left off."
- **"Do you sell my data?"** — "No. Your commission data is yours. We do not sell, share, or use it for anything other than running your commission calculations."

### Founder & Company Transparency

Add a small "Built by" block near the footer CTA. Not a full bio — just enough to show there are real people behind the product:

> **CommissionKit** is built by a small, self-funded team focused exclusively on commission management. No venture capital, no growth-at-all-costs pressure. We build what customers need and we answer support messages ourselves.

This is honest, differentiates from VC-funded competitors who may pivot, and sets expectations appropriately for a small team.

### Product Maturity Signals

These are things the product already does that signal competence:

- **14-day free trial, no credit card.** Shows confidence in the product. Already on the page — keep it.
- **"Start in under 15 minutes"** in the How It Works section. This is a strong claim backed by the 4-step visual. Keep it.
- **Multi-currency support (170+ currencies).** Mentioned in features. This is a technical depth signal — most competitors do not have it.
- **Exchange-rate snapshots for auditability.** Not just "we convert currencies" but "we convert at the rate from the deal close date, so your audit trail is clean." This matters to finance teams.

---

## 4. Trigger Plan — Milestone → Trust Signal

| Milestone | Unlocks | Action Items |
|-----------|---------|-------------|
| **First 1 paying customer on any integration** | Logo permission, company details | Send welcome email with logo consent ask. Record in CRM. |
| **First 3 paying customers** | Logo strip (Phase 2), first quote card | Collect quotes at Day 30. Add 1-3 logos + 1 quote to the relevant integration page. Update hero CTA to "Join [N] teams." |
| **First 5 paying customers** | Result statements (Phase 3) | Collect measurable outcomes at Day 60. Add result pull-quote below stat cards. |
| **First 10 paying customers** | Named case study, FAQ quote | Write first case study (offer to draft it). Publish on `/blog` and link from integration page. Add customer quote to FAQ. |
| **First 25 paying customers** | "Trusted by" hero line, expanded logo strip | Add "Trusted by 25+ teams" to hero. Expand logo strip to 5+ logos. |
| **First 50 paying customers** | Full trust section (Phase 4) | Logo strip + stats + quote + result statement. Consider a dedicated `/customers` page. |
| **First customer per integration** | Integration-specific proof | Even if you have 10 HubSpot customers, the Odoo page needs its own Odoo customer. Track consent per-integration. |

### Per-Integration Tracking

Each integration page needs its own trust signal inventory. A HubSpot customer quote does not help the Odoo page.

| Integration | Customers | Logos | Quotes | Results | Case Studies |
|-------------|-----------|-------|--------|---------|-------------|
| Odoo | 0 | 0 | 0 | 0 | 0 |
| HubSpot | 0 | 0 | 0 | 0 | 0 |
| Salesforce | 0 | 0 | 0 | 0 | 0 |
| Custom REST | 0 | 0 | 0 | 0 | 0 |

Update this table monthly. When any cell hits 1, trigger the corresponding phase.

### Escalation Rules

- **If a customer says yes to logo but no to quote:** Use the logo. Do not pressure for the quote. Revisit at Day 60.
- **If a customer says yes to quote but no to logo:** Use the quote with anonymous attribution ("Finance Manager, SaaS company"). Still valuable.
- **If a customer churns:** Remove their logo and quote within 7 days. Do not use former customer assets.
- **If a customer asks to review before publishing:** Always say yes. Send the draft, wait for approval, publish only after written confirmation.

---

## Immediate Action Items

These are the things to do this week, before any customers exist:

1. **Fix ROI section sourcing.** Add "estimated" language to the 4 stat cards. Add the disclaimer note. This takes 30 minutes across 4 files.

2. **Add technical credibility callouts.** Write integration-specific "Built on [Platform] Standards" text for each page. Add as a small banner or FAQ item. 2 hours of work.

3. **Add security FAQ items.** The "Is my data secure?" and "What happens if sync fails?" questions should be in every integration page FAQ. 1 hour.

4. **Add founder transparency block.** Small "Built by" text near the footer CTA. Same text across all 4 pages. 30 minutes.

5. **Set up consent tracking.** Add fields to whatever CRM or spreadsheet tracks customers: `logo_consent`, `testimonial_quote`, `result_statement`, `case_study_consent`. Ask for logo permission in the welcome email template. 1 hour.

6. **Prepare quote templates.** Write the 3 example quotes per integration that you will send to customers at Day 30. Store them in a doc so they are ready to go. 1 hour.

Total: ~6 hours of work. Zero fake claims. Ready to swap in real proof the moment the first customer says yes.

---

## What This Is NOT

- This is not a plan to fabricate social proof. No fake logos, no invented testimonials, no "trusted by 500+ teams" when the number is zero.
- This is not a PRD. There are no component specs, no API changes, no engineering estimates.
- This is a collection and placement plan. Collect the right things, put them in the right places, at the right time.

The goal is simple: when a prospect lands on `/integrations/hubspot` and thinks "does this actually work?", the page should answer that question honestly — with technical proof today and customer proof as soon as it exists.
