# UX Design Spec — Dashboard & Rep Portal Overhaul

**Author:** @craft (UX Designer)
**Date:** 2026-07-21
**Status:** Ready for @pixel implementation
**Scope:** 5 pages — Dashboard, Admin Rep Portal, Public Rep Portal, Enterprise Rep Portal, My Payouts

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Information Architecture](#2-information-architecture)
3. [Component Decomposition Plan](#3-component-decomposition-plan)
4. [Visual Design Direction](#4-visual-design-direction)
5. [Stat Card Redesign](#5-stat-card-redesign)
6. [Table Enhancements](#6-table-enhancements)
7. [Chart Improvements](#7-chart-improvements)
8. [Responsive Design](#8-responsive-design)
9. [Empty, Loading, Error States](#9-empty-loading-error-states)
10. [Admin vs Rep Differentiation](#10-admin-vs-rep-differentiation)
11. [Interaction Patterns](#11-interaction-patterns)
12. [Mobile Adaptations](#12-mobile-adaptations)
13. [File-Level Implementation Notes](#13-file-level-implementation-notes)

---

## 1. Executive Summary

The current Dashboard and Rep Portal pages suffer from "vibe code" patterns: stat cards without trends, tables without sorting, bare-bones charts, and a 913-line monolithic public portal. This spec redesigns all 5 pages into a polished, professional SaaS experience that matches the quality bar set by the Audit Log page.

**Key outcomes:**
- Stat cards gain period-over-period trend indicators (% change, directional arrows)
- All tables gain sortable headers, search, filter chips, and mobile card layout
- Charts get proper tooltips, trend lines, and responsive sizing
- Public portal decomposes from 1 file (913 lines) into 8 focused components
- Admin portal differentiates from public portal (more data density, action controls)
- Every page gains proper empty, loading, and error states

---

## 2. Information Architecture

### 2.1 Dashboard (`/dash`)

```
Dashboard
├── Page Header (icon + title + subtitle + period label)
├── SetupChecklist (conditional — new workspaces only)
├── Stat Cards Row (4 cards: Total Commissions, Pipeline Revenue, Deals Closed, Active Reps)
│   └── Each card: label + icon + value + trend indicator (% change + arrow)
├── Main Content Grid (3fr / 2fr)
│   ├── Left: Top Earners Table
│   │   ├── Table Header (title + "View All" link)
│   │   ├── Search + Filter Bar
│   │   └── Sortable Table (Rank, Rep, Plan, Deals, Revenue, Commission)
│   │       └── Row click → /dash/reps/:id (admin portal)
│   └── Right Column
│       ├── Quick Action Card (Run Calculation)
│       └── Recent Runs Card
│           └── Each run: icon + period + date + status badge + link to run details
└── Export dropdown (CSV dashboard summary)
```

### 2.2 Admin Rep Portal (`/dash/reps/:id`)

```
Admin Rep Portal
├── Page Header
│   ├── Breadcrumb: Reps → [Rep Name]
│   ├── Rep Avatar + Name + Email + Plan Badge
│   └── Controls: MonthPicker + Export dropdown
├── Stat Cards Row (4 cards: Commission, Revenue, Deals, Avg Deal Size)
│   └── Each card: value + trend indicator + period comparison
├── Currency Breakdown (conditional — multi-currency only)
├── Earnings History Chart (BarChart with trend line, tooltips, responsive)
├── Deal Breakdown Table
│   ├── Search + Filter Bar
│   ├── Sortable Table (Deal, Close Date, Amount, Rate, Commission)
│   └── Mobile: card layout
├── Payout History Table (read-only for admin viewing)
│   ├── Sortable columns
│   └── Status badges
└── Admin Actions Bar (Edit Rep, Adjust Commission, Send Portal Access)
```

### 2.3 Public Rep Portal (`/portal/:accessCode`)

```
Public Rep Portal
├── Auth Gate
│   ├── Login Form → JWT → force password check
│   └── Force Password Change (if mustChangePassword)
├── Portal Shell (once authenticated)
│   ├── Top Bar (workspace name + CommissionKit link + Password + Sign Out)
│   ├── Page Header (Avatar + Name + Email + Plan + MonthPicker)
│   ├── Stat Cards (3: Commission, Revenue, Deals) — rep-focused, no admin actions
│   ├── Currency Breakdown (conditional)
│   ├── Earnings History Chart
│   ├── Deal Breakdown Table
│   │   └── Mobile: card layout
│   ├── Payout History Table
│   │   └── Dispute button per row (rep-facing)
│   └── Footer (read-only attribution)
└── Dispute Modal
└── Password Change Dialog
```

### 2.4 Enterprise Rep Portal (`/dash/reps/:id` — AISSOL engine)

```
Enterprise Rep Portal
├── Page Header (Back link + Avatar + Name + Email + MonthPicker)
├── Stat Cards (4: Commission, Projects, Invoices, Project Value)
├── Earnings History Chart
├── Project Breakdown Table
│   ├── Sortable (Project, Value, Cost, GM%, Invoices, Commission)
│   └── Row click → /dash/enterprise/projects/:id (drill-down)
├── Payout History Table
└── Export dropdown
```

### 2.5 My Payouts (`/dash/payouts` for reps)

```
My Payouts
├── Page Header (icon + title + subtitle)
├── Subscription Gate (Growth+ required)
├── Summary Stat Cards (4: Current Period, Last Payout, Last Payment Date, YTD Total)
├── Payout History Table
│   ├── Sortable columns
│   ├── Filter chips (Status: All | Pending | Approved | Paid | Disputed)
│   └── Dispute button per row
└── Dispute Modal
```

---

## 3. Component Decomposition Plan

### 3.1 Public Portal Decomposition (913 lines → 8 files)

The current `public-portal.tsx` is 913 lines. Split into:

| New File | Lines (est.) | Responsibility |
|----------|-------------|----------------|
| `portal/public-portal.tsx` | ~80 | Page shell: auth gate routing, state management, layout wrapper |
| `portal/portal-login.tsx` | ~60 | Login form component |
| `portal/portal-password-change.tsx` | ~80 | Force password change form |
| `portal/portal-top-bar.tsx` | ~30 | Workspace name + links bar |
| `portal/portal-header.tsx` | ~40 | Avatar + name + email + plan + MonthPicker |
| `portal/portal-deal-table.tsx` | ~100 | Deal breakdown table with sort + mobile cards |
| `portal/portal-payout-table.tsx` | ~120 | Payout history table with status badges + dispute |
| `portal/portal-dispute-modal.tsx` | ~60 | Dispute form dialog |

Shared types (`PortalSummary`, `DealBreakdown`, etc.) move to `portal/portal-types.ts`.

The `portalAuth` helpers (`getPortalToken`, `setPortalToken`, `clearPortalToken`, `portalFetch`) move to `portal/portal-auth.ts`.

### 3.2 Shared Components (new)

These components are reused across multiple pages:

| Component | File | Used By |
|-----------|------|---------|
| `StatCard` | `components/stat-card.tsx` | Dashboard, Admin Portal, Public Portal, Enterprise Portal, My Payouts |
| `SortableTable` | `components/sortable-table.tsx` | All table instances (wraps shadcn Table) |
| `TableSearchBar` | `components/table-search-bar.tsx` | All table instances |
| `FilterChips` | `components/filter-chips.tsx` | My Payouts, Dashboard |
| `EarningsChart` | `components/earnings-chart.tsx` | Admin Portal, Public Portal, Enterprise Portal |
| `ExportDropdown` | `components/export-dropdown.tsx` | Dashboard, Admin Portal, Enterprise Portal |
| `PayoutTable` | `components/payout-table.tsx` | Admin Portal, Public Portal, Enterprise Portal |
| `EmptyState` | `components/empty-state.tsx` | All empty states |
| `TrendIndicator` | `components/trend-indicator.tsx` | Stat cards |

### 3.3 Component Hierarchy Per Page

**Dashboard:**
```
<Dashboard>
  <DashboardSkeleton /> (or content)
  <StatCard /> x4
  <TopEarnersSection>
    <TableSearchBar />
    <SortableTable />
  </TopEarnersSection>
  <RunCalculationCard />
  <RecentRunsCard />
</Dashboard>
```

**Admin Rep Portal:**
```
<RepPortal>
  <RepPortalHeader />
  <StatCard /> x4
  <CurrencyBreakdown /> (conditional)
  <EarningsChart />
  <DealBreakdownSection>
    <TableSearchBar />
    <SortableTable />
  </DealBreakdownSection>
  <PayoutTable />
  <AdminActionsBar />
</RepPortal>
```

---

## 4. Visual Design Direction

### 4.1 Philosophy

Move from "default shadcn/ui" to "polished SaaS dashboard" by:
1. **Subtle elevation** — Cards get a more refined shadow + border treatment
2. **Consistent icon treatment** — All icon badges use `rounded-lg bg-primary/10 text-primary size-10` (matches Audit Log page header pattern)
3. **Tighter visual hierarchy** — Title → subtitle → content flow is clearer
4. **Purposeful whitespace** — More breathing room between sections, tighter within cards
5. **Data density where needed** — Admin views get more compact; rep views get more breathing room

### 4.2 Card Design Upgrade

**Current:**
```html
<div className="bg-card border border-card-border rounded-2xl px-[22px] py-5" style={{ boxShadow: "var(--shadow-card)" }}>
```

**New (matching Audit Log Card pattern):**
```html
<div className="bg-card border border-card-border rounded-xl px-5 py-4 transition-shadow hover:shadow-md" style={{ boxShadow: "var(--shadow-sm)" }}>
```

Key changes:
- `rounded-xl` (14px) instead of `rounded-2xl` — consistent with Card component
- `px-5 py-4` instead of `px-[22px] py-5` — use whole numbers, tighter padding
- Add `transition-shadow hover:shadow-md` for subtle hover elevation
- Use `shadow-sm` as default instead of `shadow-card` — more refined
- Keep `border border-card-border bg-card` (from pattern registry)

### 4.3 Page Header Upgrade

**Current (Dashboard):**
```html
<div>
  <p className="text-[12px] font-semibold text-primary mb-1">Overview</p>
  <h1 className="text-[28px] font-semibold tracking-tight text-foreground leading-tight">Dashboard</h1>
  <p className="text-[14px] text-muted-foreground mt-1 leading-relaxed">...</p>
</div>
```

**New (matching Audit Log pattern):**
```html
<div className="flex items-center justify-between">
  <div className="flex items-center gap-3">
    <div className="rounded-lg bg-primary/10 text-primary size-10 flex items-center justify-center">
      <LayoutDashboard className="size-5" />
    </div>
    <div>
      <h1 className="text-[20px] font-semibold tracking-tight text-foreground">Dashboard</h1>
      <p className="text-sm text-muted-foreground">Commission performance for July 2026</p>
    </div>
  </div>
  <ExportDropdown />
</div>
```

This matches the icon-in-primary-badge pattern from the Audit Log page header.

### 4.4 Typography Hierarchy

| Element | Current | New |
|---------|---------|-----|
| Page title | `text-[28px] font-semibold` | `text-[20px] font-semibold tracking-tight` |
| Page subtitle | `text-[14px] text-muted-foreground` | `text-sm text-muted-foreground` |
| Section label | `text-[12px] font-semibold text-primary` | Removed (icon badge replaces) |
| Card title | `text-[14.5px] font-semibold` | `text-[15px] font-semibold leading-snug tracking-tight` |
| Card subtitle | `text-[12px] text-muted-foreground` | `text-xs text-muted-foreground` |
| Stat value | `text-[26px] font-semibold` | `text-[22px] font-semibold tabular-nums tracking-tight` |
| Stat label | `text-[12px] font-medium text-muted-foreground` | `text-xs font-medium text-muted-foreground` |
| Table header | `text-[11px] font-semibold uppercase tracking-wider` | Same (matches pattern registry) |
| Table cell | `text-[13px] font-medium` | `text-sm tabular-nums` |

### 4.5 Spacing Improvements

| Section | Current | New |
|---------|---------|-----|
| Page vertical rhythm | `space-y-7` | `space-y-6` |
| Stat card grid gap | `gap-4` | `gap-4` (keep) |
| Main content grid gap | `gap-5` | `gap-5` (keep) |
| Card internal padding | `px-[22px] py-[18px]` | `px-5 py-4` |
| Table row padding | `py-2` | `py-2.5` (slightly more breathing room) |
| Section-to-section margin | varies | `space-y-6` consistently |

---

## 5. Stat Card Redesign

### 5.1 Design Spec

Every stat card gets a **trend indicator** showing period-over-period change.

```
┌─────────────────────────────────┐
│ Total Commissions        [$]   │  ← label + icon badge (bg-primary/10)
│                                 │
│ $47,250                         │  ← value (text-[22px] font-semibold tabular-nums)
│                                 │
│ ↑ 12.3% vs last month           │  ← trend indicator (TrendIndicator component)
└─────────────────────────────────┘
```

### 5.2 TrendIndicator Component

```tsx
// components/trend-indicator.tsx
interface TrendIndicatorProps {
  value: number;          // percentage change (e.g., 12.3 or -5.2)
  label?: string;         // "vs last month" (default based on context)
  size?: "sm" | "md";
}

// Rendering:
// - Positive: green text, TrendingUp icon
// - Negative: destructive text, TrendingDown icon
// - Zero: muted text, Minus icon
// - Null/undefined: hidden (no trend data available)
```

**Classes:**

| State | Container | Icon | Text |
|-------|-----------|------|------|
| Positive | `inline-flex items-center gap-1` | `size-3 text-emerald-600 dark:text-emerald-400` | `text-xs font-medium text-emerald-600 dark:text-emerald-400` |
| Negative | `inline-flex items-center gap-1` | `size-3 text-destructive` | `text-xs font-medium text-destructive` |
| Neutral | `inline-flex items-center gap-1` | `size-3 text-muted-foreground` | `text-xs font-medium text-muted-foreground` |

### 5.3 StatCard Component

```tsx
// components/stat-card.tsx
interface StatCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: { value: number; label?: string } | null;
  variant?: "default" | "primary";  // primary = teal bg for main metric
  tooltip?: string;
  className?: string;
}
```

**Default variant:**
```html
<div className="bg-card border border-card-border rounded-xl px-5 py-4 transition-shadow hover:shadow-md" style={{ boxShadow: "var(--shadow-sm)" }}>
  <div className="flex items-center justify-between mb-3">
    <div className="flex items-center gap-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {tooltip && <HelpTooltip content={tooltip} />}
    </div>
    <div className="rounded-lg bg-primary/10 text-primary size-8 flex items-center justify-center">
      <Icon className="size-4" />
    </div>
  </div>
  <div className="text-[22px] font-semibold tracking-tight text-foreground leading-none tabular-nums">
    {value}
  </div>
  <div className="mt-2">
    <TrendIndicator value={trend?.value} label={trend?.label} />
  </div>
</div>
```

**Primary variant (for Commission card in portals):**
```html
<div className="bg-primary text-primary-foreground border border-primary-foreground/10 rounded-xl px-5 py-4">
  <!-- Same structure, but text colors use primary-foreground variants -->
  <span className="text-xs font-medium text-primary-foreground/80">{label}</span>
  <div className="rounded-lg bg-primary-foreground/15 ...">
    <Icon className="size-4 text-primary-foreground/80" />
  </div>
  <div className="text-[22px] font-semibold ...">{value}</div>
  <TrendIndicator value={...} light />
</div>
```

### 5.4 Mobile Adaptation

Stat cards grid: `grid grid-cols-2 lg:grid-cols-4 gap-4`

On mobile (< 640px):
- 2-column grid (2 cards per row)
- Card padding: `px-4 py-3`
- Value size: `text-lg` (smaller)
- Icon badge: `size-7` (smaller)
- Trend indicator: hide label, show only icon + percentage

### 5.5 Dashboard Stat Cards

| Card | Label | Value Source | Trend Source | Icon |
|------|-------|-------------|-------------|------|
| 1 | Total Commissions | `summary.totalCommission` | API: `summary.commissionTrend` | `DollarSign` |
| 2 | Pipeline Revenue | `summary.totalRevenue` | API: `summary.revenueTrend` | `TrendingUp` |
| 3 | Deals Closed | `summary.totalDeals` | API: `summary.dealsTrend` | `Briefcase` |
| 4 | Active Reps | `summary.totalReps` | API: `summary.repsTrend` | `Users` |

**Note for @forge:** The API `GET /api/dashboard/summary` needs to return trend data: `commissionTrend`, `revenueTrend`, `dealsTrend`, `repsTrend` — each `{ value: number, label: string }` representing % change vs previous period.

### 5.6 Portal Stat Cards

| Page | Card 1 | Card 2 | Card 3 | Card 4 |
|------|--------|--------|--------|--------|
| Admin Portal | Commission (primary) | Revenue | Deals | Avg Deal Size |
| Public Portal | Commission (primary) | Revenue | Deals | — |
| Enterprise Portal | Commission (primary) | Projects | Invoices | Project Value |
| My Payouts | Current Period | Last Payout | Last Payment Date | YTD Total |

---

## 6. Table Enhancements

### 6.1 SortableTable Component

A wrapper around shadcn Table that adds sorting, searching, and mobile card layout.

```tsx
// components/sortable-table.tsx
interface SortableTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
  searchPlaceholder?: string;
  searchFields?: (keyof T)[];
  emptyIcon?: LucideIcon;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: React.ReactNode;
  onRowClick?: (row: T) => void;
  mobileRender?: (row: T) => React.ReactNode;  // card layout for mobile
  pagination?: { page: number; totalPages: number; onPageChange: (page: number) => void };
}

interface ColumnDef<T> {
  key: string;
  header: string;
  sortable?: boolean;
  align?: "left" | "center" | "right";
  className?: string;
  render: (row: T) => React.ReactNode;
  mobileLabel?: string;  // label shown in mobile card layout
}
```

### 6.2 Sortable Column Headers

```html
<!-- Sorted ascending -->
<th className="cursor-pointer select-none hover:bg-muted/20 transition-colors">
  <div className="flex items-center gap-1">
    Commission
    <ArrowUp className="size-3 text-primary" />
  </div>
</th>

<!-- Sorted descending -->
<th className="cursor-pointer select-none hover:bg-muted/20 transition-colors">
  <div className="flex items-center gap-1">
    Commission
    <ArrowDown className="size-3 text-primary" />
  </div>
</th>

<!-- Unsorted -->
<th className="cursor-pointer select-none hover:bg-muted/20 transition-colors">
  <div className="flex items-center gap-1">
    Commission
    <ArrowUpDown className="size-3 text-muted-foreground/50" />
  </div>
</th>
```

**Classes:**
- Header cell: `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:bg-muted/20 transition-colors`
- Sort icon: `size-3` with color matching state
- Active sort: `text-primary`
- Inactive sort: `text-muted-foreground/50`

### 6.3 Table Search Bar

Placed above the table, within the card header area.

```html
<div className="flex items-center justify-between px-5 pb-4">
  <div>
    <p className="text-[15px] font-semibold leading-snug tracking-tight">Top Earners</p>
    <p className="text-xs text-muted-foreground">Ranked by commission earned</p>
  </div>
  <div className="flex items-center gap-2">
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
      <Input
        placeholder="Search..."
        className="h-8 pl-8 pr-3 text-xs w-48"
        value={search}
        onChange={...}
      />
    </div>
    <Button variant="ghost" size="sm" className="h-8 text-xs gap-1">
      View All <ArrowUpRight className="size-3" />
    </Button>
  </div>
</div>
```

### 6.4 Filter Chips (for My Payouts status filter)

Reuse the FilterChip pattern from `audit-log/filter-chip.tsx`:

```html
<div className="flex items-center gap-1.5 flex-wrap">
  <FilterChip label="Status" value="All" active onClick={...} />
  <FilterChip label="Status" value="Pending" onClick={...} />
  <FilterChip label="Status" value="Approved" onClick={...} />
  <FilterChip label="Status" value="Paid" onClick={...} />
  <FilterChip label="Status" value="Disputed" onClick={...} />
</div>
```

**FilterChip classes** (from pattern registry):
```
bg-sidebar-accent border border-sidebar-border rounded-full px-2.5 py-0.5
text-xs font-medium text-sidebar-accent-foreground
```

Active state: `bg-primary/10 border-primary/30 text-primary`

### 6.5 Table Row States

| State | Classes |
|-------|---------|
| Default | `border-b border-card-border` |
| Even row | `even:bg-muted/10` |
| Hover | `hover:bg-muted/20 transition-colors` |
| Clickable | `cursor-pointer` |
| Selected | `bg-muted/30` |
| Expanded | `bg-muted/50` |

### 6.6 Mobile Card Layout

When screen < 768px, tables switch to a card layout. Each row becomes:

```html
<div className="border-b border-card-border p-4 space-y-2 last:border-0">
  <div className="flex items-center justify-between">
    <div className="flex items-center gap-3">
      <RepAvatar ... />
      <div>
        <p className="text-sm font-semibold">{deal.dealName}</p>
        <p className="text-xs text-muted-foreground">{closeDate}</p>
      </div>
    </div>
    <Badge>{status}</Badge>
  </div>
  <div className="grid grid-cols-2 gap-2 text-xs">
    <div>
      <p className="text-muted-foreground">Amount</p>
      <p className="font-medium tabular-nums">{formatCurrency(amount)}</p>
    </div>
    <div className="text-right">
      <p className="text-muted-foreground">Commission</p>
      <p className="font-semibold text-primary tabular-nums">{formatCurrency(commission)}</p>
    </div>
  </div>
</div>
```

### 6.7 Pagination

Use existing `Pagination` component from ui-registry. Place below the table:

```html
<div className="flex items-center justify-between px-5 py-3 border-t border-card-border">
  <p className="text-sm text-muted-foreground">
    Showing <span className="tabular-nums font-medium">1-10</span> of <span className="tabular-nums font-medium">42</span>
  </p>
  <Pagination>
    <PaginationContent>
      <PaginationItem><PaginationPrevious /></PaginationItem>
      <PaginationItem><PaginationLink>1</PaginationLink></PaginationItem>
      <PaginationItem><PaginationNext /></PaginationItem>
    </PaginationContent>
  </Pagination>
</div>
```

---

## 7. Chart Improvements

### 7.1 EarningsChart Component

Extract the duplicated BarChart into a shared component:

```tsx
// components/earnings-chart.tsx
interface EarningsChartProps {
  data: Array<{ period: string; totalCommission: number; totalDeals?: number }>;
  currency: string;
  height?: number;        // default 280
  showTrendLine?: boolean; // default true
  showDealsLine?: boolean; // overlay deals as secondary line
  loading?: boolean;
}
```

### 7.2 Chart Customization

**Current chart (bare-bones):**
- No grid lines
- Hardcoded `$` prefix (breaks multi-currency)
- No trend line
- Generic tooltip
- No responsive adaptation

**New chart:**

```html
<ResponsiveContainer width="100%" height={280}>
  <BarChart data={data} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
    <defs>
      <linearGradient id="commissionGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
      </linearGradient>
    </defs>
    <CartesianGrid
      strokeDasharray="3 3"
      stroke="hsl(var(--border))"
      vertical={false}
    />
    <XAxis
      dataKey="period"
      tickFormatter={(val) => format(new Date(val + "-01"), "MMM")}
      fontSize={12}
      tickLine={false}
      axisLine={false}
      tick={{ fill: "hsl(var(--muted-foreground))" }}
    />
    <YAxis
      tickFormatter={(val) => formatCompactCurrency(val, currency)}
      fontSize={12}
      tickLine={false}
      axisLine={false}
      tick={{ fill: "hsl(var(--muted-foreground))" }}
      width={60}
    />
    <RechartsTooltip
      content={<CustomTooltip currency={currency} />}
      cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
    />
    <Bar
      dataKey="totalCommission"
      fill="url(#commissionGradient)"
      radius={[4, 4, 0, 0]}
      maxBarSize={48}
    />
    {showTrendLine && (
      <Line
        type="monotone"
        dataKey="totalCommission"
        stroke="hsl(var(--destructive))"
        strokeWidth={2}
        dot={false}
        strokeDasharray="5 5"
      />
    )}
  </BarChart>
</ResponsiveContainer>
```

### 7.3 Custom Tooltip

```tsx
function CustomTooltip({ active, payload, label, currency }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground mb-1">
        {format(new Date(label + "-01"), "MMMM yyyy")}
      </p>
      <div className="flex items-center gap-2">
        <div className="size-2 rounded-full bg-primary" />
        <span className="text-xs text-muted-foreground">Commission:</span>
        <span className="text-xs font-semibold tabular-nums">
          {formatCurrency(payload[0].value, currency)}
        </span>
      </div>
    </div>
  );
}
```

### 7.4 Chart Loading State

```html
<div className="h-[280px] w-full flex items-center justify-center">
  <div className="space-y-3 w-full px-4">
    <div className="flex items-end gap-2 h-48">
      {[...Array(6)].map((_, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-t"
          style={{ height: `${30 + Math.random() * 70}%` }}
        />
      ))}
    </div>
    <div className="flex gap-8 justify-center">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-3 w-8" />
      ))}
    </div>
  </div>
</div>
```

### 7.5 Responsive Sizing

| Breakpoint | Height | Margin | Max Bar Size |
|------------|--------|--------|-------------|
| Desktop (> 1024px) | 280px | `{ top: 8, right: 8, left: -8, bottom: 0 }` | 48px |
| Tablet (768-1024px) | 240px | `{ top: 8, right: 4, left: -12, bottom: 0 }` | 40px |
| Mobile (< 768px) | 200px | `{ top: 4, right: 0, left: -16, bottom: 0 }` | 32px |

---

## 8. Responsive Design

### 8.1 Breakpoints

| Token | Width | Usage |
|-------|-------|-------|
| Mobile | < 640px | Stat cards 2-col, tables → cards, charts smaller |
| Tablet | 640px–1024px | Stat cards 2-col, tables scrollable, charts medium |
| Desktop | > 1024px | Stat cards 4-col, full tables, full charts |

### 8.2 Stat Card Grid

```
Mobile:  grid-cols-2 (2 cards per row, 2 rows)
Tablet:  grid-cols-2 (2 cards per row, 2 rows)
Desktop: grid-cols-4 (4 cards per row, 1 row)
```

### 8.3 Main Content Grid (Dashboard)

```
Mobile:  grid-cols-1 (stack vertically)
Tablet:  grid-cols-1 (stack vertically)
Desktop: grid-cols-[3fr_2fr] (side by side)
```

### 8.4 Table → Card Transition

Use the `useMobile()` hook to detect breakpoint:

```tsx
const isMobile = useMobile();

// In table rendering:
if (isMobile) {
  return (
    <div className="divide-y divide-card-border">
      {data.map(row => (
        <div key={row.id} className="p-4 space-y-2">
          {/* Card layout */}
        </div>
      ))}
    </div>
  );
}
return <Table>...</Table>;  // Desktop table
```

### 8.5 Page Content Width

All pages use: `max-w-5xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8`

This is slightly narrower than the current `max-w-6xl` and adds responsive horizontal padding.

### 8.6 Sidebar Behavior

Already handled by the Sidebar component — collapses to overlay on mobile. No changes needed.

---

## 9. Empty, Loading, Error States

### 9.1 Loading States

**Current:** Generic rectangles (`Skeleton className="h-10 w-full"`)
**New:** Shape-matched skeletons that preview the actual content layout

**Dashboard Skeleton:**
```html
<div className="space-y-6">
  <!-- Header -->
  <div className="flex items-center gap-3">
    <Skeleton className="size-10 rounded-lg" />
    <div className="space-y-1.5">
      <Skeleton className="h-5 w-32" />
      <Skeleton className="h-4 w-48" />
    </div>
  </div>

  <!-- Stat cards -->
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
    {[...Array(4)].map((_, i) => (
      <div key={i} className="border border-card-border rounded-xl px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="size-8 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-24 mb-2" />
        <Skeleton className="h-3 w-16" />
      </div>
    ))}
  </div>

  <!-- Table + right column -->
  <div className="grid gap-5 grid-cols-1 lg:grid-cols-[3fr_2fr]">
    <div className="border border-card-border rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-card-border">
        <Skeleton className="h-5 w-28 mb-1" />
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="p-5 space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className="size-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    </div>
    <div className="space-y-4">
      <Skeleton className="h-32 rounded-xl" />
      <Skeleton className="h-48 rounded-xl" />
    </div>
  </div>
</div>
```

**Chart Skeleton:**
```html
<div className="h-[280px] w-full flex items-end gap-2 px-4 pb-8">
  {[40, 65, 50, 80, 45, 70].map((h, i) => (
    <Skeleton
      key={i}
      className="flex-1 rounded-t transition-all"
      style={{ height: `${h}%`, animationDelay: `${i * 100}ms` }}
    />
  ))}
</div>
```

### 9.2 Empty States

**Current:**
```html
<div className="text-center py-10 border border-dashed rounded-lg">
  <p className="text-muted-foreground">No deals found for this period.</p>
</div>
```

**New (using Empty component + action-oriented copy):**

```html
<div className="flex flex-col items-center justify-center py-12 text-center">
  <div className="rounded-full bg-muted/50 p-4 mb-4">
    <Briefcase className="size-8 text-muted-foreground" />
  </div>
  <h3 className="text-sm font-semibold text-foreground mb-1">No deals this period</h3>
  <p className="text-xs text-muted-foreground max-w-xs mb-4">
    Deals will appear here once they're imported or synced from your CRM.
  </p>
  <Button variant="outline" size="sm" className="text-xs gap-1.5">
    <Download className="size-3" />
    Import Deals
  </Button>
</div>
```

**Empty state per table:**

| Table | Icon | Title | Description | CTA |
|-------|------|-------|-------------|-----|
| Top Earners | `Users` | No reps yet | Add reps to see earnings data | "Add Reps" → /dash/reps |
| Deal Breakdown | `Briefcase` | No deals this period | Deals appear after import or sync | "Import Deals" → /dash/deals |
| Payout History | `Wallet` | No payouts yet | Payouts are created by your admin | — (no CTA) |
| Recent Runs | `PlayCircle` | No runs yet | Run your first commission calculation | "Run Calculation" → dialog |
| Project Breakdown | `FolderKanban` | No projects this period | Projects appear after sync | — |

### 9.3 Error States

```html
<div className="flex flex-col items-center justify-center py-24 text-center gap-4">
  <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center">
    <AlertTriangle className="size-8 text-destructive" />
  </div>
  <h1 className="text-xl font-semibold text-foreground">Something went wrong</h1>
  <p className="text-muted-foreground max-w-sm text-sm">
    We couldn't load your dashboard data. Please try again or contact support if the issue persists.
  </p>
  <Button variant="outline" size="sm" onClick={() => window.location.reload()} className="gap-1.5">
    <RefreshCw className="size-3.5" />
    Retry
  </Button>
</div>
```

---

## 10. Admin vs Rep Differentiation

### 10.1 Admin Portal (`/dash/reps/:id`)

**Admin-only features:**
- **Admin Actions Bar** at bottom: "Edit Rep" button, "Adjust Commission" button, "Send Portal Access" button
- **4 stat cards** (includes Avg Deal Size as 4th card)
- **Payout table** is read-only (no dispute button — admin resolves disputes)
- **More data density**: smaller text, tighter spacing, more columns visible
- **Export dropdown** in header: CSV/JSON export options
- **Breadcrumb navigation**: Reps → [Rep Name]

**Visual treatment:**
- Header has breadcrumb above the name
- Stat cards use default variant (not primary Commission card)
- Page has admin chrome (sidebar + header already present)

### 10.2 Public Portal (`/portal/:accessCode`)

**Rep-only features:**
- **3 stat cards** (no Avg Deal Size — rep doesn't need that view)
- **Dispute button** on payout rows (rep can dispute pending/approved payouts)
- **Password change** in top bar
- **Sign Out** button
- **Less data density**: more breathing room, larger text
- **No admin actions** — rep sees their own data only
- **Footer attribution**: "This is a read-only view..."

**Visual treatment:**
- No sidebar — standalone page with custom top bar
- Commission card uses primary variant (teal bg) — this is THE rep's key metric
- Page has standalone chrome (no app shell)

### 10.3 Enterprise Portal

Same as Admin Portal but with enterprise-specific stat cards (Projects, Invoices, Project Value) and project breakdown table. Row click drills down to project detail.

---

## 11. Interaction Patterns

### 11.1 Sorting

- **Trigger:** Click column header
- **Behavior:** Toggle between unsorted → ascending → descending → unsorted
- **Indicator:** ArrowUp / ArrowDown / ArrowUpDown icons in header
- **Visual:** Active sort column header gets `text-primary` color
- **Persistence:** Sort state lives in component state (not URL params)

### 11.2 Filtering

- **Trigger:** Filter chips or dropdown
- **Behavior:** Click chip to toggle filter, multiple chips can be active (AND logic)
- **Visual:** Active chips use `bg-primary/10 border-primary/30 text-primary`
- **Clear:** Individual chip X button or "Clear all" link

### 11.3 Search

- **Trigger:** Search input above table
- **Behavior:** Live filter as user types (debounced 300ms)
- **Scope:** Filters across all visible text columns
- **Visual:** Search icon inside input, clear button when active

### 11.4 Export

- **Trigger:** Dropdown button in page header
- **Options:** CSV, JSON (PDF deferred to future)
- **Behavior:** Generate file client-side from current data, trigger download
- **Visual:** `Download` icon + "Export" text, DropdownMenu with options

```html
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
      <Download className="size-3.5" />
      Export
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => exportCSV()}>
      <FileText className="size-3.5 mr-2" />
      Export as CSV
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportJSON()}>
      <FileText className="size-3.5 mr-2" />
      Export as JSON
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

### 11.5 Drill-Down

- **Dashboard → Rep:** Click rep name in Top Earners → `/dash/reps/:id`
- **Dashboard → Run:** Click run status badge → `/dash/runs/:id`
- **Enterprise Portal → Project:** Click project row → `/dash/enterprise/projects/:id`
- **Rep Portal → Deal:** No drill-down (rep sees their own deals only)

### 11.6 Period Selection

Keep existing MonthPicker. Improvement:
- Move to page header (right-aligned) instead of inline with content
- Add "This Month" / "Last 3 Months" / "This Year" quick presets as a Select dropdown next to MonthPicker

### 11.7 Row Click Behavior

- **SortableTable** supports `onRowClick` prop
- Rows get `cursor-pointer` class
- Hover state: `hover:bg-muted/20 transition-colors`
- Active/pressed: `active:bg-muted/30`
- Keyboard: `Tab` to focus row, `Enter` to activate

---

## 12. Mobile Adaptations

### 12.1 Stat Cards

```
Mobile (< 640px):
├── Grid: grid-cols-2
├── Card padding: px-4 py-3
├── Value: text-lg (down from text-[22px])
├── Icon badge: size-7 rounded-md
├── Trend: hide label, show icon + percentage only
└── Gap: gap-3

Tablet (640-1024px):
├── Grid: grid-cols-2
├── Card padding: px-5 py-4 (same as desktop)
├── Value: text-[20px]
└── Gap: gap-4
```

### 12.2 Tables → Cards

On mobile, each table row becomes a card with:
- **Top row:** Primary info (name/deal) + status badge (right-aligned)
- **Bottom row:** Key metrics in a 2-column grid
- **Border:** `border-b border-card-border` between cards
- **Padding:** `p-4`

### 12.3 Charts

- Height reduces from 280px → 200px
- XAxis labels may truncate (show first 3 chars: "Jan", "Feb")
- YAxis hidden on mobile (< 400px width)
- Tooltip uses full width on mobile

### 12.4 Touch Targets

- All interactive elements minimum 44x44px touch target
- Buttons: `h-9` minimum (current `h-8` is slightly small — use `min-h-[44px]` on mobile)
- Table row click targets: full-width rows with adequate padding

### 12.5 Filter Bar on Mobile

- Filter chips wrap to multiple lines
- Search input goes full-width above chips
- Alternatively: bottom sheet for filters (use Drawer component)

```html
<!-- Mobile filter bar -->
<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
  <Input placeholder="Search..." className="sm:w-48 h-8 text-xs" />
  <div className="flex items-center gap-1.5 flex-wrap">
    <FilterChip ... />
    <FilterChip ... />
  </div>
</div>
```

### 12.6 Page Header on Mobile

```
Mobile:
├── Stacked layout (icon + text left, actions below)
├── Title: text-lg (down from text-[20px])
└── Actions row below title

Desktop:
├── Horizontal layout (icon + text left, actions right)
├── Title: text-[20px]
└── Actions aligned right
```

---

## 13. File-Level Implementation Notes

### 13.1 New Files to Create

| File | Purpose |
|------|---------|
| `components/stat-card.tsx` | Reusable stat card with trend indicator |
| `components/trend-indicator.tsx` | % change + arrow component |
| `components/sortable-table.tsx` | Table with sort, search, mobile cards |
| `components/table-search-bar.tsx` | Search input for tables |
| `components/filter-chip.tsx` | Reusable filter chip (or reuse audit-log one) |
| `components/earnings-chart.tsx` | Shared BarChart with customization |
| `components/export-dropdown.tsx` | CSV/JSON export menu |
| `components/payout-table.tsx` | Shared payout table with status badges |
| `components/empty-state.tsx` | Action-oriented empty state |
| `portal/portal-types.ts` | Shared portal types |
| `portal/portal-auth.ts` | Portal JWT auth helpers |
| `portal/portal-login.tsx` | Login form |
| `portal/portal-password-change.tsx` | Password change form |
| `portal/portal-top-bar.tsx` | Top bar with workspace info |
| `portal/portal-header.tsx` | Rep header (avatar + name + plan) |
| `portal/portal-deal-table.tsx` | Deal breakdown table |
| `portal/portal-payout-table.tsx` | Payout history table |
| `portal/portal-dispute-modal.tsx` | Dispute form dialog |

### 13.2 Files to Modify

| File | Changes |
|------|---------|
| `pages/dashboard.tsx` | New header pattern, StatCard components, SortableTable for Top Earners, ExportDropdown |
| `pages/portal/rep-portal.tsx` | StatCard components, EarningsChart, SortableTable for deals, PayoutTable, AdminActionsBar |
| `pages/portal/public-portal.tsx` | Decompose into components, StatCard, EarningsChart, SortableTable, PayoutTable |
| `pages/enterprise/aissol/rep-portal.tsx` | StatCard, EarningsChart, SortableTable for projects, row click drill-down, ExportDropdown |
| `pages/portal/my-payouts.tsx` | StatCard with trends, SortableTable, FilterChips for status, improved empty state |

### 13.3 API Changes Needed (@forge)

| Endpoint | Change |
|----------|--------|
| `GET /api/dashboard/summary` | Add `commissionTrend`, `revenueTrend`, `dealsTrend`, `repsTrend` fields |
| `GET /api/rep/:id/summary` | Add per-card trend data (commission trend, revenue trend, deals trend) |
| `GET /api/portal/:code` | Same trend fields for public portal |
| `GET /api/enterprise/reps/:id/summary` | Add trend fields for enterprise portal |

Trend data shape:
```ts
interface TrendData {
  value: number;      // percentage change (e.g., 12.3 or -5.2)
  previousValue: number;  // absolute value of previous period
  label: string;      // "vs last month" or "vs previous period"
}
```

### 13.4 Implementation Priority

| Phase | Components | Est. Hours |
|-------|-----------|-----------|
| 1 | StatCard, TrendIndicator, EmptyState | 2h |
| 2 | SortableTable, TableSearchBar, FilterChips | 4h |
| 3 | EarningsChart, CustomTooltip | 2h |
| 4 | ExportDropdown, PayoutTable | 2h |
| 5 | Dashboard page rewrite | 3h |
| 6 | Admin Rep Portal rewrite | 3h |
| 7 | Public Portal decomposition + rewrite | 5h |
| 8 | Enterprise Portal rewrite | 2h |
| 9 | My Payouts rewrite | 2h |
| 10 | Mobile responsive pass | 3h |
| **Total** | | **~28h** |

---

*This spec is ready for @pixel implementation. All CSS classes reference the existing token system in `context/ui-tokens.md`. All component patterns follow the Visual Pattern Registry in `context/ui-registry.md`. Run `/imprint` after building each new component to update the registry.*
