# Product Brief: Setup Checklist + Sample Data Seeding

**Author:** @compass (Product Manager)  
**Date:** July 10, 2026  
**Status:** Ready for Engineering  
**Priority:** P0 — #1 product priority  
**Effort Estimate:** 3-4 days (1 frontend engineer)

---

## 1. Problem Statement

CommissionKit has a fully built product but **zero customers and $0 MRR**. The core blocker is not features — it's activation.

### What happens today

1. A prospect signs up after a founder-led demo.
2. They land on a **blank dashboard** — no reps, no plans, no deals, no runs.
3. They stare at empty tables with no guidance on what to do next.
4. They close the tab. They never come back.

### Why this kills us

| Pain Point | Impact |
|---|---|
| **Blank dashboard shock** | Users don't know where to start. Cognitive load is too high for a first session. |
| **Demos require manual seeding** | Founders spend 10-15 minutes per demo manually creating reps, plans, and deals just to show the product working. |
| **No "aha moment" path** | The value of CommissionKit is seeing a commission run calculate correctly. Users never reach that moment because they quit at step 1. |
| **Rep Portal is invisible** | The portal is a key differentiator, but no one sees it because there's no data to display. |

### The core insight

> **The first 5 minutes determine whether a user becomes a customer.** We need to get them from signup to "commission run completed" in under 5 minutes — without founder assistance.

---

## 2. Solution Overview

Two features that work together as a single activation flow:

```
Signup → Dashboard → Setup Checklist Overlay
                        │
                        ├── Step 1: Add Reps ──────────┐
                        ├── Step 2: Create a Plan ─────┤
                        ├── Step 3: Import Deals ──────┤
                        │                              │
                        └── "Load Sample Data" ────────┘ (one-click: skip all 3 steps)
```

**Feature A** guides users through the minimum steps needed to run their first commission calculation.  
**Feature B** lets users (and founders during demos) skip the manual work entirely and see the product fully populated in seconds.

---

## 3. Feature A: 3-Step Setup Checklist Overlay

### 3.1 User Stories

| ID | Story | Priority |
|---|---|---|
| US-A1 | As a new admin, I see a guided checklist when I first land on the dashboard so I know exactly what to do first. | Must |
| US-A2 | As a new admin, I can click each step to navigate directly to the relevant page so I don't have to find it myself. | Must |
| US-A3 | As a new admin, I see my progress (e.g., "2 of 3 complete") so I feel a sense of momentum. | Must |
| US-A4 | As a new admin, the checklist auto-dismisses when all 3 steps are complete so it doesn't clutter my workspace. | Must |
| US-A5 | As a new admin, I can manually dismiss the checklist if I want to explore on my own. | Must |
| US-A6 | As a returning admin, I can re-open the checklist from the dashboard if I need a reminder of what's left. | Must |
| US-A7 | As an existing admin (workspace already has data), I never see the checklist because it's irrelevant. | Must |

### 3.2 Acceptance Criteria

#### Overlay Display Logic

- [ ] The overlay appears **only** when a workspace has zero reps, zero plans, OR zero deals.
- [ ] The overlay appears on the **dashboard page** (`/dash`) only — not on other routes.
- [ ] The overlay appears on **first load** of the dashboard after workspace creation.
- [ ] The overlay does **not** appear if the user has previously dismissed it manually (unless all steps are now complete and it auto-dismissed, then it stays dismissed).
- [ ] The overlay does **not** appear if all 3 steps are already complete.

#### Step Completion Detection

- [ ] **Step 1 — Add Reps:** Marked complete when the workspace has >= 1 rep record.
- [ ] **Step 2 — Create a Plan:** Marked complete when the workspace has >= 1 commission plan record.
- [ ] **Step 3 — Import Deals:** Marked complete when the workspace has >= 1 deal record.
- [ ] Step status updates **reactively** — when the user navigates back to the dashboard after completing a step, the checklist reflects the new state without requiring a page refresh.

#### Progress Indicator

- [ ] A progress counter displays as `"{completed}/3 complete"` (e.g., "0/3 complete", "1/3 complete", "2/3 complete", "3/3 complete").
- [ ] When the counter reaches "3/3 complete", the overlay shows a brief success state (1.5 seconds) before auto-dismissing.

#### Navigation

- [ ] Each step is a clickable card/row that navigates to the corresponding route:
  - Step 1 → `/dash/reps`
  - Step 2 → `/dash/plans`
  - Step 3 → `/dash/deals`
- [ ] Clicking a completed step still navigates (it's a shortcut, not disabled).

#### Dismissal & Re-show

- [ ] A "Dismiss" or close button (X icon) is visible in the overlay header.
- [ ] Manual dismissal is persisted (localStorage or API) so it survives page reloads.
- [ ] A "Setup Guide" button/link exists on the dashboard header area to re-open the checklist at any time.
- [ ] The "Setup Guide" button is hidden when the overlay is currently visible.

#### Sample Data Integration

- [ ] The overlay includes a secondary action: **"Load Sample Data"** (outline button style).
- [ ] Clicking "Load Sample Data" triggers Feature B (see Section 4).
- [ ] After sample data loads successfully, all 3 steps flip to "complete" and the overlay auto-dismisses.

### 3.3 UI Specification

#### Overlay Layout

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ┌─────────────────────────────────────────────┐    │
│  │                                             │    │
│  │  [CheckCircle icon]  Get Started            │    │
│  │  Complete these steps to calculate          │    │
│  │  your first commission run.                 │    │
│  │                                             │    │
│  │  Progress: 1/3 complete                     │    │
│  │  ████████░░░░░░░░░░░░░░░░                   │    │
│  │                                             │    │
│  │  ┌─────────────────────────────────────┐    │    │
│  │  │ ✓  Add Your Sales Reps             │    │    │
│  │  │    Add team members who earn        │    │    │
│  │  │    commissions.                     │    │    │
│  │  └─────────────────────────────────────┘    │    │
│  │                                             │    │
│  │  ┌─────────────────────────────────────┐    │    │
│  │  │ ○  Create a Commission Plan         │    │    │
│  │  │    Define rates, tiers, and rules.  │    │    │
│  │  └─────────────────────────────────────┘    │    │
│  │                                             │    │
│  │  ┌─────────────────────────────────────┐    │    │
│  │  │ ○  Import Deals                     │    │    │
│  │  │    Upload deals or connect your CRM.│    │    │
│  │  └─────────────────────────────────────┘    │    │
│  │                                             │    │
│  │  ┌─────────────────────────────────────┐    │    │
│  │  │  [Zap icon] Load Sample Data        │    │    │
│  │  │  See the product in action with     │    │    │
│  │  │  pre-loaded demo data.              │    │    │
│  │  └─────────────────────────────────────┘    │    │
│  │                                             │    │
│  │  ─────────────────────────────────────      │    │
│  │  [Skip for now]              [X close]      │    │
│  │                                             │    │
│  └─────────────────────────────────────────────┘    │
│                                                     │
│              (dimmed dashboard behind)               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

#### Visual Design Tokens

| Element | Specification |
|---|---|
| **Overlay backdrop** | `bg-foreground/50` with backdrop-blur-sm |
| **Card** | `rounded-xl border border-card-border bg-card shadow-md`, max-width 480px, centered |
| **Heading** | League Spartan, `text-xl font-bold tracking-tight`, with `CheckCircle` Lucide icon (teal) |
| **Description** | Outfit body, `text-sm text-muted-foreground` |
| **Progress bar** | `h-2 rounded-full bg-muted`, fill `bg-primary` (teal), animated width transition |
| **Progress text** | `text-xs font-medium text-muted-foreground`, tabular-nums |
| **Step cards** | `rounded-lg border border-card-border bg-background p-4`, hover: `border-primary/50 bg-accent/30`, cursor pointer |
| **Step icon (complete)** | `CheckCircle` Lucide icon, `text-primary` (teal), size 20px |
| **Step icon (incomplete)** | `Circle` Lucide icon, `text-muted-foreground`, size 20px |
| **Step title** | `text-sm font-semibold text-foreground` |
| **Step description** | `text-xs text-muted-foreground` |
| **Sample Data card** | `rounded-lg border border-dashed border-primary/40 bg-accent/20 p-4`, `Zap` Lucide icon |
| **Sample Data button** | `variant="outline"` (secondary), teal border on hover |
| **Skip button** | `variant="ghost"`, `text-sm text-muted-foreground` |
| **Close button** | `variant="ghost"` icon-only, `X` Lucide icon, top-right of card |

#### Animations

- Overlay fade-in: `opacity 0→1` over 200ms
- Card scale-in: `scale(0.95)→scale(1)` over 200ms with spring easing
- Step completion: icon swap with `rotate` micro-animation (150ms)
- Progress bar: `width` transition over 300ms ease-out
- Auto-dismiss success: brief `CheckCircle` pulse + "All set!" text, then fade-out over 300ms

### 3.4 State Management

```
SetupChecklistState {
  isVisible: boolean           // overlay currently shown
  isDismissed: boolean         // user manually dismissed
  steps: {
    reps: boolean              // workspace has >= 1 rep
    plans: boolean             // workspace has >= 1 plan
    deals: boolean             // workspace has >= 1 deal
  }
  completedCount: number       // sum of true steps
  allComplete: boolean         // all 3 true
}
```

**Persistence:** `isDismissed` stored in `localStorage` key `ck_setup_dismissed_{workspaceId}`. Cleared when workspace data changes (sample data loaded). Steps are derived from live API data — not stored.

**Derivation:** Step status is computed on dashboard mount by checking existing React Query cache or making lightweight count queries:
- `GET /api/reps?limit=1` → `totalCount > 0`
- `GET /api/plans?limit=1` → `totalCount > 0`
- `GET /api/deals?limit=1` → `totalCount > 0`

### 3.5 Edge Cases

| Scenario | Behavior |
|---|---|
| User completes steps on another device | Steps re-derive from API on next dashboard visit. Checklist shows updated state. |
| User deletes all reps after completing step 1 | Step reverts to incomplete on next dashboard visit. Overlay does NOT re-show (dismissed state persists). User can re-open via "Setup Guide" button. |
| Workspace already has data at creation (e.g., enterprise onboarding) | Checklist never shows — all steps are already complete. |
| Sample data load fails | Toast error: "Failed to load sample data. Please try again." Overlay remains open. Steps unchanged. |
| User navigates away mid-setup | Overlay state persists. Returns to dashboard → overlay re-appears if not dismissed and steps incomplete. |
| Multiple workspace members | Each member sees the checklist independently based on their own dismissal state. Steps are workspace-scoped (shared). |
| Free trial with 3-rep limit | Sample data loads 5 reps — must respect plan limits. See Section 4.4 for resolution. |

---

## 4. Feature B: "Load Sample Data" Seeding

### 4.1 User Stories

| ID | Story | Priority |
|---|---|---|
| US-B1 | As a new admin, I can click one button to populate my workspace with realistic sample data so I can explore the product immediately. | Must |
| US-B2 | As a founder doing a demo, I can seed a fresh workspace in seconds so I can show the full product flow without manual setup. | Must |
| US-B3 | As a new admin, after loading sample data, I can see a completed commission run so I understand the end-to-end value. | Must |
| US-B4 | As a new admin, after loading sample data, I can access the Rep Portal so I can experience what my reps will see. | Must |
| US-B5 | As an admin, I can clear sample data and start fresh if I want to replace it with real data. | Should |

### 4.2 Acceptance Criteria

#### API Endpoint

- [ ] `POST /api/workspace/sample-data` — seeds the current workspace with sample data.
- [ ] Requires authentication (`requireAuth`) and workspace membership (`requireWorkspaceMember("admin")`).
- [ ] Returns `201` with `{ seeded: true, counts: { reps, plans, deals, runs, results } }`.
- [ ] Returns `409 Conflict` if sample data has already been seeded (prevents double-seeding). The response includes `{ alreadySeeded: true }`.
- [ ] Returns `403` if workspace is not on a plan that supports the sample rep count (see 4.4).

#### Seeded Data

- [ ] **5-8 sample reps** with realistic names, email addresses, and portal access codes.
- [ ] **1 sample commission plan** with 3 tiers (tiered model):
  - Tier 1: $0–$10,000 → 5% commission
  - Tier 2: $10,001–$25,000 → 8% commission
  - Tier 3: $25,001+ → 12% commission
- [ ] **15-20 sample deals** distributed across reps, with varied amounts ($2,000–$45,000), statuses (closed-won, in-progress), and close dates within the last 60 days.
- [ ] **1 completed commission run** for the current period, with per-deal results calculated using the seeded plan.
- [ ] **Portal access codes** generated for all seeded reps so the Rep Portal is immediately demo-able.

#### Data Quality

- [ ] Rep names are realistic and diverse (e.g., "Sarah Chen", "Marcus Johnson", "Priya Patel").
- [ ] Deal names reference realistic products/services (e.g., "Acme Corp — Enterprise License", "TechFlow — Annual Renewal").
- [ ] Deal amounts are realistic for B2B SaaS ($2,000–$45,000 range).
- [ ] All seeded records have `isSampleData: true` flag for future cleanup.
- [ ] Commission run results are mathematically correct based on the tiered plan.

#### UX Flow

- [ ] Clicking "Load Sample Data" shows a loading state on the button (spinner + "Loading..." text).
- [ ] On success: toast notification "Sample data loaded — explore your workspace!" + overlay auto-dismisses with success animation.
- [ ] On failure: toast error with retry suggestion.
- [ ] Dashboard data refreshes automatically (invalidate React Query cache for reps, plans, deals, runs).

#### Clear Sample Data (Should-have)

- [ ] `DELETE /api/workspace/sample-data` — removes all records with `isSampleData: true`.
- [ ] Available from Settings page as "Clear Sample Data" button (destructive variant).
- [ ] Requires confirmation dialog: "This will remove all sample reps, plans, deals, and runs. Your own data will not be affected."

### 4.3 Sample Data Specification

#### Reps (6 records)

| Name | Email | Region |
|---|---|---|
| Sarah Chen | sarah.chen@sample.com | West |
| Marcus Johnson | marcus.j@sample.com | East |
| Priya Patel | priya.p@sample.com | Central |
| James O'Brien | james.ob@sample.com | West |
| Aisha Mohammed | aisha.m@sample.com | East |
| Carlos Rivera | carlos.r@sample.com | Central |

#### Commission Plan (1 record, 3 tiers)

| Field | Value |
|---|---|
| Name | "Standard Commission Plan" |
| Type | tiered |
| Currency | Workspace default currency |
| Tier 1 | $0–$10,000 at 5% |
| Tier 2 | $10,001–$25,000 at 8% |
| Tier 3 | $25,001+ at 12% |

#### Deals (18 records)

Distributed across the 6 reps (3 deals each), with varied amounts and statuses:

| Rep | Deal | Amount | Status |
|---|---|---|---|
| Sarah Chen | Acme Corp — Enterprise License | $32,000 | closed-won |
| Sarah Chen | DataSync — Platform Upgrade | $18,500 | closed-won |
| Sarah Chen | CloudNine — New Subscription | $8,200 | closed-won |
| Marcus Johnson | TechFlow — Annual Renewal | $27,000 | closed-won |
| Marcus Johnson | BrightEdge — Expansion Deal | $14,800 | closed-won |
| Marcus Johnson | NovaStar — Pilot Program | $5,500 | in-progress |
| Priya Patel | Meridian — Full Suite | $41,000 | closed-won |
| Priya Patel | Apex Solutions — Add-on | $9,750 | closed-won |
| Priya Patel | Vertex Inc — Starter Pack | $3,200 | closed-won |
| James O'Brien | Pinnacle — Enterprise Deal | $38,500 | closed-won |
| James O'Brien | Horizon Labs — Mid-Market | $16,200 | closed-won |
| James O'Brien | SwiftScale — Growth Plan | $7,800 | in-progress |
| Aisha Mohammed | Quantum Dynamics — Platform | $29,000 | closed-won |
| Aisha Mohammed | BlueWave — Renewal | $12,400 | closed-won |
| Aisha Mohammed | Ember Tech — Starter | $4,600 | closed-won |
| Carlos Rivera | Atlas Group — Enterprise | $45,000 | closed-won |
| Carlos Rivera | Compass AI — Expansion | $22,300 | closed-won |
| Carlos Rivera | Relay Systems — Pilot | $6,900 | in-progress |

#### Commission Run (1 record)

| Field | Value |
|---|---|
| Period | Current month (e.g., "July 2026") |
| Status | completed |
| Payment statuses included | closed-won only |
| Results | Per-deal calculations for all closed-won deals using the tiered plan |

### 4.4 Plan Limit Considerations

The Free/Trial plan allows **3 reps**. Sample data seeds **6 reps**. Resolution:

- [ ] The seeding endpoint **temporarily lifts the rep limit** for sample data. The workspace is flagged with `sampleDataLoaded: true`.
- [ ] The user sees a banner on the Reps page: "You have 6 sample reps. Your plan allows 3. Upgrade to keep all sample reps or clear sample data to add your own."
- [ ] If the user clears sample data, the normal plan limit is re-enforced.
- [ ] This approach lets users experience the full product on the free tier while creating upgrade motivation.

### 4.5 Edge Cases

| Scenario | Behavior |
|---|---|
| User already has real data + clicks "Load Sample Data" | Sample data is added alongside real data. All sample records are flagged `isSampleData: true`. A warning dialog appears: "This will add sample data alongside your existing records. Sample data can be removed later from Settings." |
| User clicks "Load Sample Data" twice | Second click returns 409 Conflict. Toast: "Sample data is already loaded." |
| Workspace is deleted and recreated | Fresh workspace — sample data can be loaded again. |
| Sample data load partially fails (e.g., reps created but run fails) | Atomic operation — if any step fails, all seeded records are rolled back. Toast: "Something went wrong. Please try again." |
| User on Growth/Pro plan | Same behavior — sample data loads normally. No rep limit conflict. |

---

## 5. Technical Notes

### 5.1 Frontend Implementation

#### New Files

| File | Purpose |
|---|---|
| `artifacts/web/src/components/setup-checklist.tsx` | Overlay component with step cards, progress bar, sample data button |
| `artifacts/web/src/hooks/use-setup-checklist.ts` | Hook: derives step status, manages visibility/dismissal state |

#### Modified Files

| File | Change |
|---|---|
| `artifacts/web/src/pages/dashboard.tsx` | Render `<SetupChecklist />` conditionally; add "Setup Guide" button in header |

#### Hook Design (`use-setup-checklist`)

```typescript
interface UseSetupChecklistReturn {
  isVisible: boolean;
  isDismissed: boolean;
  steps: {
    reps: boolean;
    plans: boolean;
    deals: boolean;
  };
  completedCount: number;
  allComplete: boolean;
  dismiss: () => void;
  show: () => void;
  loadSampleData: () => Promise<void>;
  isSeeding: boolean;
}
```

- Uses existing React Query hooks (`useGetReps`, `useGetPlans`, `useGetDeals`) to derive step status.
- Dismissal state persisted in `localStorage`.
- `loadSampleData` calls `POST /api/workspace/sample-data` and invalidates relevant query caches on success.

### 5.2 Backend Implementation

#### New Files

| File | Purpose |
|---|---|
| `artifacts/api/src/routes/workspace/sample-data.routes.ts` | POST and DELETE endpoints |
| `artifacts/api/src/lib/sample-data.ts` | Seed data definitions + seeding logic |

#### Modified Files

| File | Change |
|---|---|
| `artifacts/api/src/routes/index.ts` | Mount sample-data routes |
| `lib/db/src/schema/workspaces.ts` | Add `sampleDataLoaded: boolean` field (default false) |
| `lib/db/src/schema/reps.ts` | Add `isSampleData: boolean` field (default false) |
| `lib/db/src/schema/plans.ts` | Add `isSampleData: boolean` field (default false) |
| `lib/db/src/schema/deals.ts` | Add `isSampleData: boolean` field (default false) |
| `lib/db/src/schema/commissionRuns.ts` | Add `isSampleData: boolean` field (default false) |

#### Seeding Logic (Pseudocode)

```typescript
async function seedSampleData(workspaceId: string) {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Check not already seeded
    const workspace = await Workspace.findById(workspaceId);
    if (workspace.sampleDataLoaded) throw new ConflictError();

    // 2. Create reps (6)
    const reps = await Rep.insertMany(sampleReps, { session });

    // 3. Create plan (1 with 3 tiers)
    const plan = await Plan.create(samplePlan, { session });
    await PlanTier.insertMany(sampleTiers.map(t => ({ ...t, planId: plan._id })), { session });

    // 4. Create deals (18)
    const deals = await Deal.insertMany(sampleDeals, { session });

    // 5. Run commission calculation (inline, not queued)
    const run = await CommissionRun.create({ workspaceId, period: currentPeriod, status: 'completed', isSampleData: true }, { session });
    const results = await calculateResults(plan, deals.filter(d => d.status === 'closed-won'), run._id, session);

    // 6. Generate portal access codes for reps
    await generatePortalCodes(reps, session);

    // 7. Mark workspace
    workspace.sampleDataLoaded = true;
    await workspace.save({ session });

    await session.commitTransaction();
    return { reps: 6, plans: 1, deals: 18, runs: 1, results: results.length };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}
```

**Key decision:** Commission run is calculated **inline** (not via BullMQ queue) to ensure the user sees results immediately. This is acceptable because sample data is small and predictable.

### 5.3 Testing Requirements

| Test | Type | Scope |
|---|---|---|
| Sample data seeding creates correct records | Unit | `sample-data.ts` |
| Commission calculations are mathematically correct | Unit | `sample-data.ts` |
| Double-seed returns 409 | Integration | `sample-data.routes.ts` |
| Auth + workspace membership required | Integration | `sample-data.routes.ts` |
| Transaction rollback on partial failure | Integration | `sample-data.routes.ts` |
| Clear sample data removes only flagged records | Integration | `sample-data.routes.ts` |
| Checklist shows/hides based on data state | Component | `setup-checklist.tsx` |
| Step completion updates reactively | Component | `setup-checklist.tsx` |
| Dismissal persists across reloads | Component | `use-setup-checklist.ts` |
| Sample data button loading state | Component | `setup-checklist.tsx` |

---

## 6. Success Metrics

### Primary Metrics

| Metric | Current | Target (30 days post-launch) | Measurement |
|---|---|---|---|
| **Activation rate** (signup → first commission run) | ~0% | 40% | Workspaces with >= 1 completed run within 7 days of creation |
| **Time to first run** | N/A (never happens) | < 5 minutes (sample data) or < 30 minutes (manual) | Median time from workspace creation to first run completion |
| **Demo-to-close rate** | Low (anecdotal) | Track after launch | Percentage of demoed prospects that convert to paid |

### Secondary Metrics

| Metric | Target | Measurement |
|---|---|---|
| Sample data adoption rate | > 60% of new workspaces | Percentage of new workspaces that click "Load Sample Data" |
| Checklist completion rate | > 50% of non-sample-data workspaces | Percentage of workspaces (excluding sample data) that complete all 3 steps |
| Checklist dismiss rate | < 30% dismiss without completing any step | Percentage of dismissals at 0/3 |
| Rep Portal visits post-sample-data | > 70% of sample-data workspaces | Workspaces that visit `/dash/reps/:id` or `/portal/:code` after seeding |
| Trial-to-paid conversion | Lift of > 10 percentage points | Compare cohort with vs. without sample data activation |

### Instrumentation Required

- [ ] Track event: `setup_checklist_shown` (workspace_id, completed_count)
- [ ] Track event: `setup_checklist_step_completed` (workspace_id, step_name)
- [ ] Track event: `setup_checklist_dismissed` (workspace_id, completed_count)
- [ ] Track event: `sample_data_loaded` (workspace_id, duration_ms)
- [ ] Track event: `sample_data_cleared` (workspace_id)
- [ ] Track event: `setup_guide_reopened` (workspace_id)

---

## 7. Timeline

| Phase | Work | Owner | Duration |
|---|---|---|---|
| **Day 1** | Backend: schema changes + sample data definitions + seeding endpoint | @forge | 1 day |
| **Day 2** | Backend: tests + clear endpoint + plan limit handling | @forge | 0.5 day |
| **Day 2** | Frontend: `use-setup-checklist` hook + state management | @pixel | 0.5 day |
| **Day 3** | Frontend: `SetupChecklist` overlay component + animations | @pixel | 1 day |
| **Day 4** | Frontend: dashboard integration + "Setup Guide" button + tests | @pixel | 0.5 day |
| **Day 4** | QA: end-to-end testing, edge case verification | @forge + @pixel | 0.5 day |

**Total: 3-4 days.** Ships in one sprint cycle.

---

## 8. Out of Scope (For Now)

| Item | Reason |
|---|---|
| Interactive product tour / tooltips | Higher effort, lower immediate impact. Revisit after activation metrics improve. |
| Email drip sequence for incomplete setup | Requires email infrastructure decisions. Manual follow-up for now. |
| Video walkthrough embed | Content creation dependency. Can add later. |
| Multi-language sample data | English-only for v1. i18n sample data in v2 if needed. |
| Customizable sample data (industry-specific) | Cool but not urgent. Ship generic B2B SaaS data first. |

---

## 9. Open Questions

| Question | Decision Needed By | Recommendation |
|---|---|---|
| Should sample data be available on all plan tiers or only trial? | @compass | All tiers. Founders need it for demos on any workspace. |
| Should the checklist appear for workspaces created via API (enterprise)? | @forge | No. Enterprise workspaces are onboarded manually. |
| Should we gate the "Load Sample Data" button behind a confirmation dialog? | @craft | Yes, if the workspace already has real data. No, if the workspace is empty. |
| Should the commission run use the workspace's default currency? | @forge | Yes. Sample plan tiers are currency-agnostic (percentage-based). |

---

## 10. Appendix: Competitive Context

| Competitor | Onboarding Approach | What We Can Learn |
|---|---|---|
| **QuotaPath** | Guided setup wizard with CRM connect step | Good pattern — we should emphasize CRM integration in a future v2 checklist |
| **Xactly** | Enterprise onboarding with CSM | Not comparable — they don't self-serve |
| **CaptivateIQ** | Sample workspace with pre-loaded data | Exactly our approach — validates the strategy |
| **Everstage** | Video tutorials on dashboard | Low-effort but passive — our interactive approach is better |

**Our differentiation:** One-click sample data that produces a *real, mathematically correct commission run* — not just mockups. Users see the actual product working, not a screenshot.

---

*This PRD is ready for engineering review. Assign to @forge for backend and @pixel for frontend. Target ship date: within 1 week of approval.*
