# UI Tokens — CommissionKit

CommissionKit uses CSS custom properties (variables) defined in `artifacts/web/src/index.css`. The design system supports light and dark modes via the `.dark` class on `<html>`.

## Typography

### Fonts

| Token | Value | Usage |
|-------|-------|-------|
| `--app-font-sans` | `'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif` | Body, UI text |
| `--app-font-display` | `'League Spartan', 'Outfit', -apple-system, ...` | Headings, display |
| `--app-font-mono` | `'JetBrains Mono', ui-monospace, ...` | Code, mono data |

### Font Loading

Google Fonts import at the top of `index.css`:

```css
@import url('https://fonts.googleapis.com/css2?family=League+Spartan:wght@100..900&family=Outfit:wght@100..900&display=swap');
```

### Base Body

```css
body {
  font-size: 15px;
  line-height: 1.55;
}
```

### Typographic Rules

- Financial data uses `tabular-nums` for column alignment.
- Headings use tight tracking (`tracking-tight`).
- Table headers are `text-[11px] font-semibold uppercase tracking-wider text-muted-foreground`.
- Card titles are `text-[15px] font-semibold leading-snug tracking-tight`.

## Color Tokens (Light Mode)

| Token | HSL | Hex approx | Usage |
|-------|-----|------------|-------|
| `--background` | `0 0% 100%` | `#FFFFFF` | App canvas |
| `--foreground` | `222 39% 11%` | `#111827` | Primary text |
| `--border` | `220 13% 91%` | `#E5E7EB` | Borders, dividers |
| `--input` | `220 13% 91%` | `#E5E7EB` | Input borders |
| `--ring` | `174 72% 35%` | teal | Focus rings |
| `--card` | `0 0% 100%` | `#FFFFFF` | Card surface |
| `--card-foreground` | `222 39% 11%` | `#111827` | Card text |
| `--card-border` | `220 13% 91%` | `#E5E7EB` | Card borders |
| `--popover` | `0 0% 100%` | `#FFFFFF` | Popover surface |
| `--primary` | `174 72% 35%` | `#0D9488` | Primary actions, accent |
| `--primary-foreground` | `0 0% 100%` | `#FFFFFF` | Text on primary |
| `--secondary` | `166 77% 94%` | `#F0FDFA` | Secondary chips |
| `--secondary-foreground` | `174 72% 28%` | dark teal | Text on secondary |
| `--muted` | `220 9% 96%` | `#F3F4F6` | Muted backgrounds |
| `--muted-foreground` | `220 9% 46%` | `#6B7280` | Secondary text |
| `--accent` | `166 77% 94%` | `#F0FDFA` | Accent surfaces |
| `--accent-foreground` | `174 72% 28%` | dark teal | Text on accent |
| `--destructive` | `0 84% 57%` | red | Errors, destructive actions |
| `--destructive-foreground` | `0 0% 100%` | white | Text on destructive |
| `--header` | `0 0% 98%` | `#FAFAFA` | Header background |
| `--header-border` | `220 13% 91%` | `#E5E7EB` | Header border |
| `--header-foreground` | `222 39% 11%` | `#111827` | Header text |
| `--sidebar` | `0 0% 98%` | `#FAFAFA` | Sidebar background |
| `--sidebar-foreground` | `220 9% 35%` | `#4B5563` | Sidebar text |
| `--sidebar-muted-foreground` | `220 8% 63%` | `#9CA3AF` | Sidebar muted text |
| `--sidebar-border` | `220 13% 91%` | `#E5E7EB` | Sidebar borders |
| `--sidebar-primary` | `174 72% 35%` | teal | Active nav indicator |
| `--sidebar-accent` | `166 77% 94%` | `#F0FDFA` | Active nav background |
| `--sidebar-accent-foreground` | `174 72% 30%` | dark teal | Active nav text |

## Color Tokens (Dark Mode)

| Token | HSL | Hex approx |
|-------|-----|------------|
| `--background` | `0 0% 6%` | `#0F0F0F` |
| `--foreground` | `0 0% 93%` | `#EDEDED` |
| `--border` | `0 0% 15%` | `#262626` |
| `--input` | `0 0% 15%` | `#262626` |
| `--ring` | `174 60% 48%` | brighter teal |
| `--card` | `0 0% 9%` | `#171717` |
| `--card-border` | `0 0% 13%` | `#212121` |
| `--popover` | `0 0% 11%` | `#1C1C1C` |
| `--primary` | `174 60% 48%` | brighter teal |
| `--secondary` | `0 0% 13%` | neutral dark |
| `--secondary-foreground` | `174 60% 68%` | light teal |
| `--muted` | `0 0% 12%` | `#1F1F1F` |
| `--muted-foreground` | `0 0% 52%` | `#858585` |
| `--accent` | `0 0% 13%` | neutral dark |
| `--accent-foreground` | `174 60% 68%` | light teal |
| `--header` | `0 0% 6%` | `#0F0F0F` |
| `--sidebar` | `0 0% 6%` | `#0F0F0F` |
| `--sidebar-foreground` | `0 0% 70%` | `#B3B3B3` |
| `--sidebar-muted-foreground` | `0 0% 42%` | `#6B6B6B` |

## Semantic Border Colors

Buttons use computed opaque borders via `hsl(from ...)` to avoid overlapping transparency issues:

```css
--primary-border: hsl(from hsl(var(--primary)) h s calc(l + var(--opaque-button-border-intensity)) / alpha);
--secondary-border: ...
--muted-border: ...
--accent-border: ...
--destructive-border: ...
--sidebar-primary-border: ...
```

Light mode intensity: `-8` (darken). Dark mode intensity: `9` (lighten).

## Shadows

```css
--shadow-card: 0 1px 3px 0 rgba(0, 0, 0, .05);
--shadow-xs:   0 1px 3px 0 rgba(0, 0, 0, .05);
--shadow-sm:   0 1px 4px 0 rgba(0, 0, 0, .07);
--shadow:      0 2px 8px 0 rgba(0, 0, 0, .08);
--shadow-md:   0 4px 12px -2px rgba(0, 0, 0, .10);
```

Dark mode shadows are stronger with higher opacity.

## Radius

| Token | Value | Notes |
|-------|-------|-------|
| `--radius` | `0.625rem` | 10px base |
| `--radius-sm` | `calc(var(--radius) - 4px)` | 6px |
| `--radius-md` | `calc(var(--radius) - 2px)` | 8px |
| `--radius-lg` | `var(--radius)` | 10px |
| `--radius-xl` | `calc(var(--radius) + 4px)` | 14px |

Cards and stat cards typically use `rounded-xl` (14px). Buttons use `rounded-md` (10px). Sidebar nav items use `rounded-[10px]`.

## Charts

```css
--chart-1: 174 72% 35%;   /* teal */
--chart-2: 158 64% 36%;   /* green */
--chart-3: 36 92% 50%;    /* amber */
--chart-4: 200 89% 48%;   /* blue */
--chart-5: 280 65% 55%;   /* purple */
```

## Status Colors

| Status | Light Background | Dark Text | Usage |
|--------|------------------|-----------|-------|
| Pending / Warning | amber/yellow | dark yellow | Pending deals, unpaid |
| Approved / Closed Won | teal/emerald | dark teal | Success, paid |
| Rejected / Closed Lost | rose | dark red | Errors, lost deals |

## Elevation Utilities

- `--elevate-1`: `rgba(0, 0, 0, .03)` — hover overlay in light mode.
- `--elevate-2`: `rgba(0, 0, 0, .06)` — active overlay in light mode.
- Dark mode uses white overlays (`rgba(255,255,255,.04)` and `.06`).

## Custom Scrollbar

```css
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: hsl(var(--primary)); border-radius: 10px; }
```

Global scrollbar uses `scrollbar-width: thin` and `scrollbar-color: hsl(var(--primary) / 0.8) transparent`.
