# UX Spec: Reports Page Charts

**Author:** @craft (UX Designer)
**Date:** 2026-07-12
**Status:** Ready for implementation
**Priority:** P1 — visual consistency + dark mode fix

---

## Problem Statement

The Reports page charts use hardcoded hex colors (`#0D9488`, `#3B82F6`), SVG gradient `<defs>`, and inconsistent styling across 4 chart sections. They break in dark mode and visually mismatch the polished landing page chart style.

The founder wants charts that **"look good and actually serve"** — clean, professional, matching the landing page's Monthly Earnings chart.

## Reference Standard

The landing page `InteractiveRepPortal.tsx` BarChart is the **canonical chart style** for CommissionKit. Every chart on the reports page must conform to this spec:

| Property | Value |
|----------|-------|
| Chart type | BarChart (grouped or single) |
| Colors | `hsl(var(--muted))` for background/secondary data, `hsl(var(--primary))` for primary data |
| Bar radius | `radius={[4, 4, 0, 0]}` (rounded tops, flat bottoms) |
| Grid | `<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />` |
| X-axis | `stroke="hsl(var(--muted-foreground))"`, `fontSize={11}`, `tickLine={false}`, `axisLine={false}` |
| Y-axis | Same as X-axis, `tickFormatter={(v) => \`$\${(v / 1000).toFixed(0)}k\`}` |
| Tooltip | Thin card: `rounded-lg border border-card-border bg-card px-3 py-2 shadow-sm`, 11px font |
| Legend | Manual HTML below chart: `size-2.5 rounded-sm` color squares + `text-[10px] text-muted-foreground` labels |
| Container | Fixed height via `div className="h-[Npx]"` wrapping `ResponsiveContainer` |
| Animations | None. No `isAnimationActive`, no transition effects on bars |
| SVG defs | None. No `<linearGradient>`, no `<filter>`, no `<clipPath>` |
| Margins | `{ top: 4, right: 4, bottom: 0, left: 0 }` (minimal) |

## Color System

All colors use CSS custom properties. No hardcoded hex. No `COLORS` array.

| Role | CSS Variable | Light Mode | Dark Mode |
|------|-------------|------------|-----------|
| Revenue / secondary bars | `--muted` | `#F3F4F6` | `#1F1F1F` |
| Commission / primary bars | `--primary` | `#0D9488` | Teal-500 |
| Grid lines | `--border` | `#E5E7EB` | `#262626` |
| Axis text | `--muted-foreground` | `#6B7280` | `#858585` |
| Tooltip bg | `--card` | `#FFFFFF` | `#171717` |
| Tooltip border | `--card-border` | `#E5E7EB` | `#212121` |
| Tooltip text | `--foreground` / `--muted-foreground` | dark / gray | light / gray |
| Cursor hover | `--muted / 0.3` | 30% opacity gray | 30% opacity dark |

### Multi-series chart colors (for charts with 3+ categories)

Use `--chart-1` through `--chart-5` from `index.css`:

| Token | Light | Dark | Semantic Use |
|-------|-------|------|-------------|
| `--chart-1` | `174 72% 35%` (teal) | `174 60% 48%` | Primary category |
| `--chart-2` | `158 64% 36%` (green) | brighter green | Success / approved |
| `--chart-3` | `36 92% 50%` (amber) | brighter amber | Warning / pending |
| `--chart-4` | `200 89% 48%` (blue) | brighter blue | Info / neutral |
| `--chart-5` | `280 65% 55%` (purple) | brighter purple | Accent / extra |

Reference: `hsl(var(--chart-N))` in fill/stroke attributes.

---

## Chart 1: Revenue & Margin Trends

**Location:** Line ~347 in `reports.tsx` — full-width Card below KPI row
**Current:** AreaChart with `<linearGradient>` defs, hardcoded `COLORS[0]` and `COLORS[1]`
**Target:** Grouped BarChart matching landing page style

### Why BarChart over AreaChart

The landing page established BarChart as the CommissionKit chart language. Switching this chart to BarChart:
- Creates visual consistency across the product
- Eliminates gradient defs entirely
- Reads better for discrete time periods (daily/monthly intervals)
- Simpler to implement and maintain

### Specification

| Property | Value |
|----------|-------|
| Chart type | `BarChart` (vertical, grouped) |
| Container height | `h-[280px]` (slightly taller than landing's 180px for the full-width context) |
| Data source | `reportData.monthlyTrends` |
| Data keys | `period` (X-axis), `revenue` (Bar 1), `commission` (Bar 2) |
| Margin | `{ top: 4, right: 10, bottom: 0, left: 0 }` |

#### Bars

```tsx
<Bar dataKey="revenue" name="Revenue" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
<Bar dataKey="commission" name="Commission" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
```

No `barSize` prop — let Recharts auto-size based on container width.

#### Axes

```tsx
<XAxis
  dataKey="period"
  stroke="hsl(var(--muted-foreground))"
  fontSize={11}
  tickLine={false}
  axisLine={false}
  tickFormatter={(val) => {
    if (interval === "month") return format(new Date(val + "-01"), "MMM yyyy");
    return format(new Date(val), "MMM d");
  }}
/>
<YAxis
  stroke="hsl(var(--muted-foreground))"
  fontSize={11}
  tickLine={false}
  axisLine={false}
  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
/>
```

#### Grid

```tsx
<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
```

#### Tooltip

Use the existing `CustomTooltip` but restyle to match landing page:

```tsx
<Tooltip
  content={<CustomTooltip currency={currency} />}
  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
/>
```

`CustomTooltip` update:
```tsx
<div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-sm">
  <p className="text-[11px] font-semibold text-foreground mb-1">{label}</p>
  {payload.map((p) => (
    <p key={p.name} className="text-[11px] text-muted-foreground">
      {p.name}: <span className="font-medium text-foreground">{formatCurrency(p.value, currency)}</span>
    </p>
  ))}
</div>
```

#### Legend

Manual HTML below chart, centered:

```tsx
<div className="flex items-center justify-center gap-4 mt-3">
  <div className="flex items-center gap-1.5">
    <div className="size-2.5 rounded-sm bg-muted" />
    <span className="text-[10px] text-muted-foreground">Revenue</span>
  </div>
  <div className="flex items-center gap-1.5">
    <div className="size-2.5 rounded-sm bg-primary" />
    <span className="text-[10px] text-muted-foreground">Commission</span>
  </div>
</div>
```

#### Removals

- Delete `<defs>` block (both `colorRevenue` and `colorCommission` gradients)
- Delete `fillOpacity` and `fill="url(#colorRevenue)"` / `fill="url(#colorCommission)"`
- Replace `<Area>` components with `<Bar>` components
- Delete `yAxisId="left"` (only one Y-axis needed)

---

## Chart 2: Commission by Rep

**Location:** Line ~415 in `reports.tsx` — left column, 2-column grid row
**Current:** Horizontal BarChart with hardcoded `COLORS[0]` and `COLORS[1]`
**Target:** EXACT same style as landing page Monthly Earnings chart

### Why this is the primary deliverable

The founder specifically called out this chart. It should feel like you copy-pasted the landing page chart and just swapped the data. Same colors, same tooltip, same legend, same proportions.

### Specification

| Property | Value |
|----------|-------|
| Chart type | `BarChart` with `layout="vertical"` |
| Container height | `h-[300px]` |
| Data source | `reportData.repCommissionBreakdown` |
| Data keys | `name` (Y-axis category), `commission` (Bar 1), `revenue` (Bar 2) |
| Margin | `{ top: 0, right: 20, left: 20, bottom: 0 }` |

#### Bars

```tsx
<Bar dataKey="commission" name="Commission" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={18} />
<Bar dataKey="revenue" name="Revenue" fill="hsl(var(--muted))" radius={[0, 4, 4, 0]} barSize={18} />
```

Note: horizontal bars use `radius={[0, 4, 4, 0]}` (right-side rounding) instead of `[4, 4, 0, 0]`.

#### Axes

```tsx
<XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`} />
<YAxis type="category" dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
  width={100} />
```

#### Grid

```tsx
<CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
```

Note: `horizontal={false}` for vertical layout — shows vertical grid lines only.

#### Tooltip

Same `CustomTooltip` as Chart 1, same restyling. The existing `SimpleBarTooltip` can be replaced with the unified `CustomTooltip`.

#### Legend

Manual HTML below chart, centered:

```tsx
<div className="flex items-center justify-center gap-4 mt-3">
  <div className="flex items-center gap-1.5">
    <div className="size-2.5 rounded-sm bg-primary" />
    <span className="text-[10px] text-muted-foreground">Commission</span>
  </div>
  <div className="flex items-center gap-1.5">
    <div className="size-2.5 rounded-sm bg-muted" />
    <span className="text-[10px] text-muted-foreground">Revenue</span>
  </div>
</div>
```

Note: Commission listed first here (it's the primary metric in this view).

#### Removals

- Delete hardcoded `COLORS` references
- Replace `fill={COLORS[0]}` and `fill={COLORS[1]}` with CSS variables
- Delete `SimpleBarTooltip` (consolidate into single `CustomTooltip`)

---

## Chart 3: Payment Status

**Location:** Line ~468 in `reports.tsx` — right column, 2-column grid row
**Current:** PieChart with hardcoded `COLORS` array, no legend on chart, legend exists but uses inline styles
**Target:** Donut chart with theme-adaptive colors and clean legend

### Why keep as PieChart

Payment status is categorical (Paid / Pending / Overdue / etc.) with no inherent order. A donut chart is the right choice — it shows proportional composition at a glance. But it needs visual cleanup.

### Specification

| Property | Value |
|----------|-------|
| Chart type | `PieChart` with `Pie` (donut via `innerRadius`) |
| Container height | `h-[220px]` for chart, plus `mt-4` for legend |
| Data source | `reportData.paymentStatusBreakdown` |
| Data keys | `name` (label), `value` (count) |
| Slice colors | Cycle through `--chart-1` to `--chart-5` |

#### Pie

```tsx
<Pie
  data={reportData.paymentStatusBreakdown}
  cx="50%"
  cy="50%"
  innerRadius={50}
  outerRadius={80}
  paddingAngle={2}
  dataKey="value"
  stroke="none"
>
  {reportData.paymentStatusBreakdown.map((_, index) => (
    <Cell key={`cell-${index}`} fill={`hsl(var(--chart-${(index % 5) + 1}))`} />
  ))}
</Pie>
```

Key changes:
- `innerRadius={50}`, `outerRadius={80}` — slightly smaller for tighter composition
- `fill={\`hsl(var(--chart-${(index % 5) + 1}))\`}` — theme-adaptive, cycles through 5 chart colors
- `stroke="none"` — clean edges

#### Tooltip

Replace the inline `contentStyle` with a proper React component:

```tsx
<Tooltip
  content={({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const data = payload[0];
    return (
      <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-sm">
        <p className="text-[11px] text-muted-foreground">
          <span className="inline-block size-2 rounded-sm mr-1.5" style={{ backgroundColor: `hsl(var(--chart-${(reportData.paymentStatusBreakdown.indexOf(data.payload) % 5) + 1}))` }} />
          {data.name}
        </p>
        <p className="text-[11px] font-medium text-foreground">{data.value} deals</p>
      </div>
    );
  }}
/>
```

#### Legend

Replace inline `style={{ backgroundColor: COLORS[...] }}` with CSS variable references:

```tsx
<div className="flex flex-wrap gap-x-5 gap-y-2 mt-4 justify-center">
  {reportData.paymentStatusBreakdown.map((entry, index) => (
    <div key={entry.name} className="flex items-center gap-1.5">
      <div
        className="size-2.5 rounded-sm"
        style={{ backgroundColor: `hsl(var(--chart-${(index % 5) + 1}))` }}
      />
      <span className="text-[10px] text-muted-foreground">{entry.name}</span>
      <span className="text-[10px] font-medium text-foreground tabular-nums">{entry.value}</span>
    </div>
  ))}
</div>
```

#### Removals

- Delete `COLORS` array entirely
- Delete inline `style={{ backgroundColor: COLORS[index % COLORS.length] }}` 
- Delete `contentStyle` prop on Tooltip (use custom content component instead)
- The existing legend div at line ~499 stays but gets restyled to match the manual legend pattern

---

## Chart 4: Deal Value Distribution

**Location:** Line ~441 in `reports.tsx` — right column (same grid row as Commission by Rep)
**Current:** BarChart with hardcoded `COLORS[2]` (amber), no legend needed (single series)
**Target:** Clean vertical BarChart matching landing page style

### Specification

| Property | Value |
|----------|-------|
| Chart type | `BarChart` (vertical, single series) |
| Container height | `h-[300px]` (match Commission by Rep) |
| Data source | `reportData.dealValueDistribution` |
| Data keys | `label` (X-axis), `count` (Bar) |
| Margin | `{ top: 0, right: 10, left: 0, bottom: 0 }` |

#### Bar

```tsx
<Bar dataKey="count" name="Deals" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={36} />
```

Single series uses `--primary` (teal) — the brand color. This is intentional: deal distribution is a factual count, not a comparison, so it gets the primary color.

#### Axes

```tsx
<XAxis
  dataKey="label"
  stroke="hsl(var(--muted-foreground))"
  fontSize={11}
  tickLine={false}
  axisLine={false}
/>
<YAxis
  stroke="hsl(var(--muted-foreground))"
  fontSize={11}
  tickLine={false}
  axisLine={false}
/>
```

Note: Y-axis does NOT use `$Xk` format here — this is a count, not currency. Plain numbers.

#### Grid

```tsx
<CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
```

#### Tooltip

Replace `CountTooltip` with unified `CustomTooltip` adapted for count data:

```tsx
<Tooltip
  content={({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded-lg border border-card-border bg-card px-3 py-2 shadow-sm">
        <p className="text-[11px] font-semibold text-foreground mb-1">{label}</p>
        <p className="text-[11px] text-muted-foreground">
          Deals: <span className="font-medium text-foreground">{payload[0].value}</span>
        </p>
      </div>
    );
  }}
  cursor={{ fill: "hsl(var(--muted) / 0.3)" }}
/>
```

#### Legend

No legend needed — single series. The card title "Deal Value Distribution" and subtitle "Deal distribution across bands" provide sufficient context.

#### Removals

- Delete `COLORS[2]` reference
- Delete `CountTooltip` component (consolidate)
- Delete `yAxisId="left"` (only one Y-axis)

---

## Implementation Checklist

### Global changes (all 4 charts)

- [ ] **Delete `COLORS` array** (line 23) — replace all references with CSS variables
- [ ] **Consolidate tooltips** — replace `CustomTooltip`, `SimpleBarTooltip`, `CountTooltip` with a single flexible `ChartTooltip` component
- [ ] **Delete SVG `<defs>`** block from Revenue & Margin Trends chart
- [ ] **Add `cursor={{ fill: "hsl(var(--muted) / 0.3)" }}`** to all `<Tooltip>` components for consistent hover feedback
- [ ] **Verify dark mode** — toggle `.dark` class on `<html>` and confirm all 4 charts render correctly

### Chart-specific changes

| Chart | Action | Lines affected |
|-------|--------|---------------|
| Revenue & Margin Trends | AreaChart → BarChart, delete gradients | ~353–408 |
| Commission by Rep | Replace `COLORS` with CSS vars, restyle tooltip | ~423–434 |
| Payment Status | Replace `COLORS` with `--chart-N` vars, add styled legend, custom tooltip | ~476–507 |
| Deal Value Distribution | Replace `COLORS[2]` with `--primary`, delete `CountTooltip` | ~449–457 |

### Shared component to extract

```tsx
// artifacts/web/src/components/charts/chart-tooltip.tsx
interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ name: string; value: number; color: string }>;
  label?: string;
  currency?: string;
  formatValue?: (value: number, name: string) => string;
}
```

This replaces all 3 existing tooltip components with one. It reads colors from the payload (which Recharts provides from the `fill` prop), so it's fully theme-adaptive.

### Shared legend to extract

```tsx
// artifacts/web/src/components/charts/chart-legend.tsx
interface ChartLegendProps {
  items: Array<{ label: string; color: string }>;
}
```

Renders the centered flex row of `size-2.5 rounded-sm` squares + `text-[10px]` labels. Used by Charts 1, 2, and 3.

---

## Visual Treatment Summary

| Property | All BarCharts | PieChart |
|----------|--------------|----------|
| Bar/slice radius | `[4, 4, 0, 0]` (vertical) or `[0, 4, 4, 0]` (horizontal) | N/A |
| Grid | `strokeDasharray="3 3"`, `vertical={false}` or `horizontal={false}` | None |
| Axis font | `fontSize={11}`, `tickLine={false}`, `axisLine={false}` | N/A |
| Axis color | `hsl(var(--muted-foreground))` | N/A |
| Y-axis format | `$Xk` for currency, plain for counts | N/A |
| Tooltip | Thin card, 11px font, `border-card-border`, `bg-card` | Same |
| Legend | Manual HTML: `size-2.5 rounded-sm` squares + `text-[10px]` labels | Same |
| Container | Fixed height `div` wrapping `ResponsiveContainer` | Same |
| Animations | None | None |
| SVG defs | None | None |
| Cursor | `fill: "hsl(var(--muted) / 0.3)"` | None (pie hover is native) |

---

## Dark Mode Verification

After implementation, verify these specific scenarios:

1. **Revenue & Margin Trends**: Bars visible against dark card background, grid lines subtle but present
2. **Commission by Rep**: Revenue bars (`--muted`) don't disappear into dark background — `--muted` in dark mode is `#1F1F1F` which has enough contrast against `--card` (`#171717`) thanks to the 3% lightness difference + border/grid context
3. **Payment Status**: All 5 `--chart-N` colors render distinctly in dark mode
4. **Deal Value Distribution**: Primary teal bars pop against dark background
5. **Tooltips**: Readable text, visible border, proper shadow

If Revenue bars in dark mode lack contrast (muted on dark card), consider using `--secondary` instead of `--muted` for the secondary bar fill. `--secondary` in dark mode is `0 0% 13%` which is slightly lighter.

---

## File Paths

| File | Change |
|------|--------|
| `artifacts/web/src/pages/reports/reports.tsx` | Main implementation — all 4 charts |
| `artifacts/web/src/components/charts/chart-tooltip.tsx` | New — shared tooltip component |
| `artifacts/web/src/components/charts/chart-legend.tsx` | New — shared legend component |
| `context/ui-registry.md` | Update — add chart components to registry |
| `docs/ux-spec-reports-charts.md` | This spec |
