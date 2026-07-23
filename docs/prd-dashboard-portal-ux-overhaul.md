# PRD: Dashboard & Portal UX Overhaul

**Author:** @compass (Product Manager)
**Date:** 2026-07-21
**Priority:** P0
**Status:** Draft
**Estimated effort:** 10-14 engineering days

---

## 1. Executive Summary

CommissionKit's dashboard and portals are functional but forgettable. They display data without context, lack interactivity, and treat fundamentally different users (admins vs. reps) identically. The public rep portal is a 913-line monolith that bundles authentication, password management, dispute filing, and data display into a single file.

This overhaul makes every page feel **intentional**. Data becomes scannable, actionable, and contextual. The admin experience diverges from the rep experience. Tables become interactive. Stat cards tell stories. The public portal becomes a focused, mobile-first earnings view.

**Success criteria:** A sales manager opening the dashboard can answer "how is my team doing this month vs. last month?" in under 3 seconds. A rep opening the public portal on their phone can find their commission for a specific deal in under 10 seconds.

---

## 2. Problem Statement

### 2.1 Dashboard (`artifacts/web/src/pages/dashboard.tsx`, 319 lines)

| Problem | Evidence | Impact |
|---------|----------|--------|
| **Stat cards show raw numbers with zero context** | Lines 52-57: each card has `label`, `value`, `delta` — but `delta` is a static string like "Calculated this period", never a trend or comparison | Admin cannot tell if $45K is good or bad without leaving the page |
| **Top Earners table is unsortable** | Lines 117-188: plain `<table>` with no sort controls, no search, no column toggling | With 20+ reps, finding a specific person requires scanning every row |
| **No date range filter** | Line 32: `currentPeriod` is hardcoded to `format(new Date(), "yyyy-MM")` — no way to view other periods | Admin must navigate to Runs page to see historical data |
| **No export capability** | Zero export buttons anywhere on the page | Finance users copy-paste numbers into spreadsheets manually |
| **Recent Runs shows only 3 items** | Line 50: `.slice(0, 3)` with no "view all" link beyond the Runs page | Users can't see run history without navigating away |
| **Commented-out ranking badges** | Lines 139-155: top-3 rank indicators are fully coded but commented out | Visual hierarchy lost; #1 earner looks identical to #10 |
| **Chart is absent** | No chart component at all on the main dashboard | The most information-dense visualization tool is unused |

### 2.2 Admin Rep Portal (`artifacts/web/src/pages/portal/rep-portal.tsx`, 355 lines)

| Problem | Evidence | Impact |
|---------|----------|--------|
| **Identical to public portal** | Compare `rep-portal.tsx` lines 161-193 with `public-portal.tsx` lines 594-628 — same stat cards, same layout, same chart | Admins see the same view as reps; no admin-specific insights |
| **No team context** | No team rank, no % of total commission, no comparison to peers | Manager cannot assess a rep's relative performance |
| **Deal table is unsortable** | Lines 271-324: plain `<Table>` with no sort controls | Cannot quickly find highest-value deals |
| **No quick actions** | No "email rep", no "download CSV", no "view plan details" | Every action requires navigating to another page |
| **Chart uses hardcoded $ formatting** | Line 238: `tickFormatter={(val) => \`$\${val/1000}k\`}` — ignores workspace currency | EUR/GBP/SAR workspaces see wrong currency symbol |

### 2.3 Public Rep Portal (`artifacts/web/src/pages/portal/public-portal.tsx`, 913 lines)

| Problem | Evidence | Impact |
|---------|----------|--------|
| **Monolithic file** | 913 lines containing: auth helpers (lines 90-111), login form (115-200), password change (202-327), dispute modal (331-396), main page (400-887), skeleton (891-913) | Unmaintainable; any change risks breaking unrelated functionality |
| **Tables are not mobile-responsive** | Lines 714-770: standard `<Table>` with 5 columns, no horizontal scroll wrapper, no card layout fallback | Reps on phones see truncated/cramped data |
| **No deal filtering or search** | Lines 708-771: deal breakdown renders all deals with no search, filter, or sort | Rep with 50+ deals cannot find a specific one |
| **Payout status map duplicated** | Lines 799-805: `STATUS_MAP` is redefined inline, duplicating `PAYOUT_STATUS_CLASSES` from lines 31-36 | Maintenance burden; changes must be made in multiple places |
| **Login UX is generic** | Lines 147-199: plain card with "Secure Portal" title, no workspace branding, no rep name preview | Reps don't feel like they're entering *their* portal |
| **No export capability** | Zero download/export buttons | Reps screenshot their earnings for records |
| **Hardcoded English strings** | Lines 155, 194, 373, 706, etc.: "Secure Portal", "Access Portal", "Deal Breakdown" — not using `t()` | i18n is broken on this page despite being set up |

### 2.4 Payouts Page (`artifacts/web/src/pages/payouts/payouts.tsx`, 815 lines)

| Problem | Evidence | Impact |
|---------|----------|--------|
| **Summary cards lack trends** | Lines 155-191: same pattern as dashboard — raw numbers, static labels | Cannot tell if pending amount is growing or shrinking |
| **Table is not sortable** | Lines 645-775: no sort controls on any column header | Cannot sort by amount to prioritize large payouts |
| **No period filter** | Only has status and rep filters (lines 598-617) | Cannot view "all payouts from Q1" without scrolling pages |

### 2.5 Enterprise Projects (`artifacts/web/src/pages/enterprise/aissol/projects.tsx`, 504 lines)

| Problem | Evidence | Impact |
|---------|----------|--------|
| **No project drill-down from table** | Lines 301: `onClick={() => setLocation(...)}` navigates to a separate page — no inline expansion or side panel | Context switch for every project inspection |
| **Table is not sortable** | Lines 279-325: no sort controls | Cannot sort by value, GM%, or date |

### 2.6 User Pain Points by Persona

**Admin/Finance:**
- "I open the dashboard and see numbers but don't know if they're good or bad"
- "I need to export this month's commission data for the board meeting but there's no export button"
- "I want to see which reps are underperforming but the table only sorts by commission amount"

**Sales Manager:**
- "I need to compare this month to last month but the dashboard only shows the current period"
- "When I look at a rep's portal, I see what they see — but I need to see their rank, their trend, their plan compliance"

**Sales Rep:**
- "I check my portal on my phone during lunch and the table is unreadable"
- "I want to find my commission for the Acme deal but there's no search"
- "I screenshot my earnings because there's no way to download them"

---

## 3. Goals & Success Metrics

### Qualitative Targets
- Dashboard feels like a "command center" — every element earns its place
- Admin rep portal clearly shows **more** than the rep sees (rank, trends, team context)
- Public portal is **fast, focused, mobile-first** — reps check it in < 15 seconds
- Every table with > 5 rows has sort controls
- Every stat card answers "compared to what?"

### Quantitative Targets
| Metric | Current | Target |
|--------|---------|--------|
| Dashboard time-to-insight | ~30s (must navigate to other pages) | < 5s (trends visible on stat cards) |
| Public portal LCP (mobile) | Unknown (no measurement) | < 2.5s |
| Public portal file size | 913 lines, 1 file | < 300 lines per file, 5+ files |
| Tables with sort controls | 0 of 6 portal tables | 6 of 6 |
| Stat cards with trend indicators | 0 of 8 stat cards | 8 of 8 |
| Export availability | 1 of 5 pages (Payouts only) | 4 of 5 pages |

---

## 4. Feature Priority Matrix

### 4.1 Dashboard

| Priority | Feature | Description | Effort |
|----------|---------|-------------|--------|
| **P0** | Trend indicators on stat cards | Show % change vs. previous period with up/down arrow. Requires API to return `previousPeriod` data alongside current. | 1d (@forge API + @pixel UI) |
| **P0** | Sortable Top Earners table | Click column headers to sort by name, deals, revenue, commission. Client-side sort on existing data. | 0.5d (@pixel) |
| **P0** | Uncomment rank badges | Lines 139-155 have working top-3 rank badges that are commented out. Uncomment and polish. | 0.25d (@pixel) |
| **P0** | Revenue trend chart | Add a 6-month commission trend line chart (Recharts `AreaChart`) below stat cards, above earners table. Use existing `monthlyHistory` data or new API field. | 1d (@forge API + @pixel) |
| **P1** | Date range filter | Month/quarter picker in page header that changes `currentPeriod` and refetches. | 0.5d (@pixel) |
| **P1** | Export dashboard CSV | Button in header → downloads stat summary + top earners as CSV. | 0.5d (@forge + @pixel) |
| **P1** | Richer Recent Runs | Show 5 runs instead of 3. Add total commission and deal count per run. Add "View all runs" link. | 0.5d (@pixel) |
| **P2** | Customizable layout | Drag-to-rearrange cards. Save layout per user. | 2d (defer — low ROI for now) |
| **P2** | Saved views | "My Q1 view" with preset filters and date ranges. | 1d (defer) |

### 4.2 Admin Rep Portal

| Priority | Feature | Description | Effort |
|----------|---------|-------------|--------|
| **P0** | Admin-only context panel | Add a card above the existing stats showing: team rank (#3 of 15), % of total team commission (18%), vs. team average (+$2.4K). Requires new API fields. | 1d (@forge API + @pixel) |
| **P0** | Sortable deal table | Client-side sort on all columns. | 0.5d (@pixel) |
| **P0** | Visual differentiation | Different header treatment from public portal — admin badge, "Viewing as Admin" indicator, different accent on stat cards. | 0.5d (@pixel) |
| **P1** | Quick actions bar | "Download CSV" button, "Email Rep" link (opens mailto), "View Plan" link to plan detail page. | 0.5d (@pixel) |
| **P1** | Fix chart currency | Replace hardcoded `$` in tick formatter with workspace currency symbol. | 0.25d (@pixel) |
| **P1** | Period comparison | Side-by-side stat cards: "This Month" vs "Last Month" with delta arrows. | 0.5d (@pixel) |
| **P2** | Bulk deal actions | Select deals → bulk recalculate, bulk reassign. | 1.5d (defer — complex backend) |

### 4.3 Public Rep Portal

| Priority | Feature | Description | Effort |
|----------|---------|-------------|--------|
| **P0** | Decompose monolith | Split 913-line file into: `portal-auth.tsx` (login + password change), `portal-dispute.tsx` (dispute modal), `portal-dashboard.tsx` (stats + chart), `portal-deals.tsx` (deal table), `portal-payouts.tsx` (payout history). Main file becomes orchestrator only. | 1.5d (@pixel) |
| **P0** | Mobile-responsive tables | Deal table: horizontal scroll on mobile with sticky first column. Payout table: card layout on mobile (stack fields vertically). | 1d (@pixel) |
| **P0** | Fix i18n | Replace all hardcoded English strings with `t()` calls. Add translation keys for portal-specific strings. | 0.5d (@pixel) |
| **P0** | Branded login experience | Show workspace name + logo on login screen. Show rep name preview after first successful auth (stored in localStorage). | 0.5d (@pixel) |
| **P1** | Deal search and filter | Text search on deal name + filter by close date range. Client-side. | 0.5d (@pixel) |
| **P1** | Period comparison card | "Last month you earned $X. This month: $Y (+Z%)." Single card above stats. | 0.5d (@forge API + @pixel) |
| **P1** | Export earnings | "Download CSV" button for deal breakdown and payout history. | 0.5d (@forge + @pixel) |
| **P2** | Push notifications | Browser notification when a new commission run includes this rep. | 1.5d (defer — requires service worker) |

### 4.4 Enterprise Portal (AISSOL)

| Priority | Feature | Description | Effort |
|----------|---------|-------------|--------|
| **P0** | Sortable project table | Client-side sort on name, value, GM%, period. | 0.5d (@pixel) |
| **P0** | Inline project expansion | Click row → expand to show invoice-level breakdown below the row (like payouts notes expansion). Avoids page navigation for quick inspection. | 1d (@pixel) |
| **P1** | Invoice drill-down | Within expanded project, show per-invoice commission with clickable rows to invoice detail. | 1d (@pixel + @forge if API changes needed) |
| **P2** | Custom report builder | Select projects, date range, metrics → generate PDF report. | 3d (defer — significant scope) |

### 4.5 Payouts Page

| Priority | Feature | Description | Effort |
|----------|---------|-------------|--------|
| **P0** | Sortable table | Client-side sort on rep, period, amount, status. | 0.5d (@pixel) |
| **P0** | Trend on summary cards | "Total Pending: $12K (↑ 3 from last week)" — show count delta vs. 7 days ago. | 0.5d (@forge API + @pixel) |
| **P1** | Period filter | Date range picker alongside existing status/rep filters. | 0.5d (@pixel) |
| **P1** | YTD summary row | Bottom-of-table row showing year-to-date totals per rep. | 0.5d (@forge API + @pixel) |
| **P2** | Scheduled payout notifications | Email/browser alert when a payout moves to "paid". | 1d (defer — notification system exists but needs wiring) |

---

## 5. Scope Boundaries

### IN Scope
- Frontend UX improvements to all 5 pages listed above
- New shared components (SortableTable, TrendIndicator, StatCardWithDelta, MobileTableCard)
- Minor API additions (previous period data, team rank, period comparison)
- File decomposition of public portal
- Mobile-responsive table patterns
- i18n fixes for public portal
- Client-side sorting, searching, and filtering
- CSV export from dashboard and portals

### OUT of Scope
- **New integrations** (no new CRM/ERP connectors)
- **Auth system changes** (portal JWT system stays as-is)
- **Real-time updates** (no WebSocket push for live commission changes)
- **Custom report builder** (deferred to P2)
- **Mobile app** (responsive web only)
- **Payout provider integrations** (Stripe Payouts, Wise — separate initiative)
- **Dashboard drag-and-drop customization** (P2, not worth the complexity now)
- **Notification system overhaul** (existing system is sufficient; just needs wiring)

---

## 6. Component Architecture

### New Shared Components

| Component | Location | Purpose | Used By |
|-----------|----------|---------|---------|
| `StatCard` | `components/stat-card.tsx` | Unified stat card with: value, label, icon, trend arrow + %, delta text, optional sparkline | Dashboard, Admin Portal, Public Portal, Payouts |
| `SortableTableHead` | `components/sortable-table-head.tsx` | Drop-in replacement for `<TableHead>` with sort arrow indicator and `onSort` callback | All portal tables |
| `useTableSort` | `hooks/use-table-sort.ts` | Hook for client-side multi-column sort with stable ordering | All pages with tables |
| `MobileTableCard` | `components/mobile-table-card.tsx` | Renders table data as stacked cards on mobile, with configurable field layout | Public Portal, Admin Portal |
| `TrendBadge` | `components/trend-badge.tsx` | Small pill showing ↑/↓ with percentage, colored green/red | StatCard, summary cards |
| `ExportButton` | `components/export-button.tsx` | Standardized CSV export button with loading state and error handling | Dashboard, Portals, Payouts |
| `PeriodPicker` | `components/period-picker.tsx` | Month/quarter/year selector that emits a period string | Dashboard, Admin Portal |

### Existing Components to Enhance

| Component | Enhancement |
|-----------|-------------|
| `Card` | Add optional `trend` prop to render a `TrendBadge` in the header |
| `Table` | Add `responsive` prop that wraps in horizontal scroll + mobile card fallback |
| `Badge` | Add `trend` variant (green-up / red-down) |

### Cross-Page Patterns

1. **Page header pattern**: Already established in audit log (`text-[20px] font-semibold tracking-tight` + icon badge). Apply consistently to all 5 pages.
2. **Stat card grid**: 4-column on desktop, 2-column on tablet, 1-column on mobile. All cards use `StatCard` component.
3. **Table toolbar**: Search input + filter dropdowns + export button, consistent across all table views.
4. **Empty state pattern**: Lucide icon + headline + subtext + CTA (from audit log registry).

---

## 7. Implementation Phasing

### Phase 1: Dashboard + Shared Components (3-4 days)

**Owner:** @pixel (frontend), @forge (API additions)

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| 1 | Build `StatCard`, `TrendBadge`, `SortableTableHead`, `useTableSort` | @pixel | 4 new components + 1 hook, tested |
| 1 | Add `previousPeriod` fields to `GET /api/dashboard/summary` | @forge | API returns trend data |
| 2 | Refactor dashboard stat cards to use `StatCard` with trends | @pixel | Dashboard shows ↑/↓ on all 4 cards |
| 2 | Add sort to Top Earners, uncomment rank badges | @pixel | Sortable table with visual rank |
| 3 | Add revenue trend chart (AreaChart) | @pixel | 6-month commission chart on dashboard |
| 3 | Add date range filter + export CSV | @pixel + @forge | Period picker + download button |
| 4 | Polish, test, review | @pixel + @review | Phase 1 complete |

**Acceptance:** Dashboard shows trend arrows on all stat cards, Top Earners is sortable with rank badges, chart renders with 6 months of data, export downloads a valid CSV.

### Phase 2: Public Portal Decomposition + Mobile (3-4 days)

**Owner:** @pixel (frontend)

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| 1 | Extract `portal-auth.tsx` (login + password change) | @pixel | 2 components, main file shrinks by ~230 lines |
| 1 | Extract `portal-dispute.tsx` (dispute modal) | @pixel | 1 component, main file shrinks by ~65 lines |
| 2 | Extract `portal-deals.tsx` + `portal-payouts.tsx` | @pixel | 2 components, main file shrinks by ~200 lines |
| 2 | Build `MobileTableCard` + responsive table pattern | @pixel | Deal table scrolls horizontally on mobile, payouts stack as cards |
| 3 | Fix all i18n hardcoded strings | @pixel | All strings use `t()`, translation keys added |
| 3 | Branded login (workspace name + logo) | @pixel | Login screen shows workspace identity |
| 4 | Add deal search, export button, polish | @pixel | Search works, CSV downloads, tests pass |

**Acceptance:** `public-portal.tsx` is < 300 lines. All sub-components are independently testable. Deal table is usable on a 375px viewport. All strings are translated.

### Phase 3: Admin Rep Portal Differentiation (2-3 days)

**Owner:** @pixel (frontend), @forge (API additions)

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| 1 | Add team rank + % of total to `GET /api/reps/:id/summary` | @forge | API returns admin-only context |
| 1 | Build admin context panel (rank, %, vs. average) | @pixel | New card above stats |
| 2 | Add sort to deal table, fix chart currency | @pixel | Sortable deals, correct currency on chart |
| 2 | Add quick actions bar (export, email, view plan) | @pixel | Action buttons in header |
| 3 | Visual differentiation (admin badge, treatment) | @pixel | Clear visual distinction from public portal |

**Acceptance:** Admin portal shows team rank and relative performance metrics. Deal table is sortable. Chart uses workspace currency. Export works.

### Phase 4: Enterprise Portal + Payouts (2-3 days)

**Owner:** @pixel (frontend), @forge (API if needed)

| Day | Task | Owner | Output |
|-----|------|-------|--------|
| 1 | Sortable project table + inline expansion | @pixel | Click row to expand with invoice summary |
| 1 | Sortable payouts table + trend on summary cards | @pixel | Sort controls, trend badges on Payouts |
| 2 | Invoice drill-down within expanded project | @pixel | Per-invoice commission visible |
| 2 | Period filter on payouts, YTD summary | @pixel + @forge | Date range filter, YTD row |
| 3 | Polish, full test pass, review | @pixel + @review | All 4 phases complete |

**Acceptance:** Enterprise projects table is sortable with inline expansion. Payouts table is sortable with trend indicators and period filter.

---

## 8. Dependencies & Risks

### Backend API Changes (@forge)

| Endpoint | Change | Effort | Risk |
|----------|--------|--------|------|
| `GET /api/dashboard/summary` | Add `previousPeriod: { totalCommission, totalRevenue, totalDeals }` | 0.5d | Low — additive field |
| `GET /api/dashboard/summary` | Add `monthlyTrend: Array<{ period, totalCommission }>` for chart | 0.5d | Low — may already exist in `repEarnings` |
| `GET /api/reps/:id/summary` | Add `teamRank`, `teamSize`, `percentOfTotal`, `teamAverageCommission` | 0.5d | Medium — requires aggregation across all reps |
| `GET /api/dashboard/summary` | Add `export` query param for CSV download | 0.5d | Low — reuse existing export pattern |
| `GET /api/portal/:code` | Add `previousPeriod` data for comparison card | 0.5d | Low — additive |

**Total backend effort: ~2.5 days**

### Shared Component Dependencies

- `StatCard` must be built first — used by all 5 pages
- `useTableSort` must be built first — used by all sortable tables
- `MobileTableCard` must be built before public portal responsive work

### Testing Requirements

| Area | Tests Needed |
|------|-------------|
| `StatCard` component | Renders trend badge, handles missing trend data gracefully |
| `SortableTableHead` | Sort toggling (asc → desc → none), multi-column |
| `useTableSort` hook | Stable sort, handles empty arrays, type-safe column keys |
| `MobileTableCard` | Renders all fields, responsive breakpoint |
| Dashboard | Trend data displays correctly, chart renders, export downloads |
| Public portal decomposition | Each sub-component renders independently, auth flow still works |
| Mobile tables | Deal table at 375px, payout cards at 375px |
| API additions | Previous period calculation, team rank accuracy |

### Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Team rank query is slow on large workspaces | Low | Medium | Add MongoDB index on `{ workspaceId, totalCommission }` in commission results |
| Decomposing public portal breaks auth flow | Medium | High | Write integration test for full login → data → logout flow before starting |
| Recharts chart performance with many data points | Low | Low | Limit to 12 months max; use `isAnimationActive={false}` for > 6 points |
| Mobile card layout confuses desktop users | Low | Low | Only activate below `md` breakpoint; desktop keeps table |

---

## 9. Acceptance Criteria

### Dashboard
- [ ] All 4 stat cards show trend arrow + % change vs. previous period
- [ ] Top Earners table has clickable column headers for sorting (name, deals, revenue, commission)
- [ ] Top 3 earners show rank badges (gold, silver, bronze)
- [ ] Revenue trend chart renders with 6 months of data
- [ ] Date range picker changes the displayed period and refetches data
- [ ] Export button downloads a CSV with stat summary + top earners
- [ ] Recent Runs shows 5 items with commission totals
- [ ] All loading states use skeleton loaders (no spinners)
- [ ] Empty state has icon + headline + CTA

### Admin Rep Portal
- [ ] Admin context card shows: team rank, % of total commission, vs. team average
- [ ] "Viewing as Admin" badge visible in header
- [ ] Deal table is sortable on all columns
- [ ] Chart uses workspace currency symbol (not hardcoded `$`)
- [ ] Quick actions: Download CSV, Email Rep, View Plan
- [ ] Visually distinct from public portal (different header treatment)

### Public Rep Portal
- [ ] `public-portal.tsx` is < 300 lines (orchestrator only)
- [ ] Auth components extracted to `portal-auth.tsx`
- [ ] Dispute modal extracted to `portal-dispute.tsx`
- [ ] Deal table has horizontal scroll on mobile (< 768px)
- [ ] Payout table renders as stacked cards on mobile
- [ ] All strings use `t()` — zero hardcoded English
- [ ] Login screen shows workspace name
- [ ] Deal search filters visible deals by name
- [ ] Export CSV button works for deals and payouts

### Enterprise Portal
- [ ] Project table is sortable on name, value, GM%, period
- [ ] Click row expands to show invoice summary (no page navigation)
- [ ] Expanded view shows per-invoice commission amounts

### Payouts Page
- [ ] Table is sortable on rep, period, amount, status
- [ ] Summary cards show trend badges (count delta vs. 7 days ago)
- [ ] Period filter (date range picker) works alongside existing filters
- [ ] YTD summary row at bottom of table

### Cross-Cutting
- [ ] All new components have unit tests
- [ ] No regression in existing tests (`bun test` passes)
- [ ] Typecheck clean (`bun run typecheck`)
- [ ] Both light and dark mode verified on all new components
- [ ] Mobile viewport (375px) verified on public portal
- [ ] No new hardcoded hex values — all CSS variables
- [ ] No emojis — Lucide icons only

---

## 10. Design Reference

The quality bar is the **Audit Log** patterns registered in `context/ui-registry.md`:

- **Page header**: Icon-in-primary-badge + 20px semibold title + muted subtitle
- **Table**: `rounded-md border border-card-border bg-card overflow-hidden`, alternating rows with `even:bg-muted/10`, expandable rows with `bg-muted/20 border-t`
- **Filter chips**: `rounded-full bg-sidebar-accent border-sidebar-border`, removable with X button
- **Diff view**: 4-column grid for before/after comparison (adapt for trend indicators)

Every new component should match these established patterns. When in doubt, reference the audit log implementation.

---

## 11. Agent Assignments

| Agent | Responsibility | Phase |
|-------|---------------|-------|
| **@forge** | API additions (previous period, team rank, export endpoints) | All phases |
| **@pixel** | Frontend implementation (components, pages, responsive) | All phases |
| **@review** | Post-build verification (plan review, system review, production review) | After each phase |
| **@craft** | UX review of mobile layouts and new patterns | Phase 2 |
| **@compass** | PRD clarification, scope decisions, priority calls | All phases |

---

*This PRD is a living document. Update it as scope decisions are made during implementation.*
