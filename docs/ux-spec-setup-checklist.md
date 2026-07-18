# UX Spec — Setup Checklist Widget Redesign

**Author:** @craft (UX Designer)
**Date:** 2026-07-11
**Status:** Design Spec — Ready for Implementation
**Component:** `artifacts/web/src/components/setup-checklist.tsx`

---

## Problem Statement

The current Setup Checklist widget occupies a fixed 420px-wide card in the bottom-right corner of the viewport. It:

- Covers dashboard content (stat cards, tables) on smaller screens
- Cannot be minimized — only dismissed entirely
- Feels heavy for an onboarding hint that should guide, not dominate
- Positioned relative to the viewport, not the content it lives beside

The founder wants it **compact, minimizable, and positioned within the content flow** — not floating over it.

---

## Recommendation: Option A — Collapsible Card (Refined)

### Why not B or C

| Option | Verdict | Reason |
|--------|---------|--------|
| **B — Progress Bar Only** | Rejected | Too subtle for a critical onboarding flow. New users need to see *what* to do, not just *that* progress exists. A thin bar gets ignored. |
| **C — FAB + Popover** | Rejected | FABs signal "primary action" (compose, add, create). Using one for an informational checklist creates semiotic confusion. Also adds a click-to-see layer that reduces discoverability. |
| **A — Collapsible Card** | **Selected** | Keeps full step visibility when expanded, collapses to a lightweight pill when the user wants focus. Familiar pattern. The collapse state solves the "too big" problem without hiding the checklist entirely. |

---

## Architecture Change

### From: Fixed Floating
```
<div class="fixed bottom-4 right-4 z-50 max-w-[420px]">
  ...full card...
</div>
```

### To: Inline Flow Element
The checklist renders **inside** the dashboard's `space-y-7` container, between the page header and the stat cards grid. It becomes part of the page flow — no `fixed` positioning, no `z-50`, no overlay.

```
Dashboard
├── Page header (title + subtitle)
├── SetupChecklist ← lives here, in-flow
├── Stat cards grid (4-col)
└── Lower grid (earners + runs)
```

When collapsed, it becomes a small sticky pill at the bottom-right **of the content container** (not the viewport). This uses `sticky bottom-4` within the scrollable main area.

---

## States & Dimensions

### State 1: Expanded (Default for new workspaces)

**Container:**
- Width: `100%` of parent (max-w-6xl = 1152px, but typically ~720px on lg screens due to sidebar)
- Max-width: `480px` (slightly wider than current 420px for breathing room)
- Border: `1px solid hsl(var(--card-border))`
- Background: `hsl(var(--card))`
- Border-radius: `14px` (rounded-xl, matching design system)
- Shadow: `var(--shadow-card)`
- Padding: `16px` all sides (p-4)

**Layout (top to bottom):**

```
┌──────────────────────────────────────────────┐
│  [CheckCircle]  Get Started           [—] [×]│  ← Header row: 36px tall
│  ●━━━━━━━━━━━━━━━━━━━━━━━━━━━━○  2/3         │  ← Progress: 24px tall
├──────────────────────────────────────────────┤
│  [✓] Add Your Sales Reps              →      │  ← Step row: 44px tall
│  [○] Create a Commission Plan         →      │  ← Step row: 44px tall
│  [○] Import Deals                     →      │  ← Step row: 44px tall
├──────────────────────────────────────────────┤
│  [⚡] Load Sample Data                        │  ← Compact CTA: 40px tall
│      See the product in action with demo data│
├──────────────────────────────────────────────┤
│  [Skip for now]                              │  ← Footer: 36px tall
└──────────────────────────────────────────────┘
```

**Total expanded height:** ~240px (vs current ~380px — **37% reduction**)

**Step cards — compacted:**
- Remove the separate card borders per step. Steps are now **borderless rows** separated by `border-b border-muted/60` (matching the table style in the dashboard).
- Each step: icon (16px) + title (13px semibold) + chevron-right (14px). Description text **removed** from expanded view — it's redundant when the titles are clear.
- Completed steps: icon becomes `CheckCircle` in primary teal. Title gets `text-muted-foreground` + `line-through`.
- Click target: full row, `hover:bg-muted/40`, `cursor-pointer`.

**Progress bar:**
- Height: `6px` (down from 8px/1.5rem). Thinner, less visual weight.
- Track: `bg-muted`, `rounded-full`.
- Fill: `bg-primary`, `rounded-full`, animated `transition-all duration-300`.
- Label: right-aligned `text-[11px] tabular-nums text-muted-foreground` showing `2/3`.

**Header:**
- Minimize button: `[—]` (Minus icon, 14px). Positioned between title and close.
- Close button: `[×]` (X icon, 14px). Calls `dismiss()`.
- Both are `ghost` variant, `size-icon` (28px hit target).

**"Load Sample Data" — compacted:**
- Becomes a single-line row within the step list area, not a separate dashed-border card.
- Layout: `Zap` icon (14px, primary) + "Load Sample Data" text (13px, semibold) + right chevron.
- Subtitle removed from the compact view. On hover, show a tooltip with the description.
- Border: none. Background: `bg-accent/30` on hover only.

**"Skip for now":**
- `ghost` button, `size-sm`, left-aligned.
- Text: `text-xs text-muted-foreground`.

---

### State 2: Collapsed (Pill)

When the user clicks the minimize button `[—]`, the card collapses to a **sticky pill** in the bottom-right corner of the content area.

**Pill dimensions:**
- Height: `36px`
- Width: auto (content-driven), typically `140–180px`
- Border-radius: `18px` (full pill shape)
- Background: `hsl(var(--card))`
- Border: `1px solid hsl(var(--card-border))`
- Shadow: `var(--shadow-sm)`
- Padding: `8px 14px` horizontal, centered vertically

**Pill content:**
```
┌─────────────────────────────┐
│  [CheckCircle]  2/3  [▼]   │
└─────────────────────────────┘
```

- Icon: `CheckCircle` (14px, primary) — always visible
- Text: `2/3` — `text-[12px] font-semibold tabular-nums text-foreground`
- Expand chevron: `ChevronUp` (14px, muted-foreground)
- On hover: `bg-muted/40`, border darkens slightly

**Positioning:**
- `sticky bottom-4` within the main scroll container
- `self-end` (right-aligned within the flow)
- `z-10` (above content but below modals)
- Margin: `mt-4` from the last content block above it

**Click behavior:**
- Clicking anywhere on the pill expands the card back to State 1.
- Animation: `scale(0.95) → scale(1)` + `opacity 0 → 1`, 150ms ease-out.

---

### State 3: All Complete (3/3)

When all 3 steps are done:

1. The progress bar fills to 100%.
2. The pill (if collapsed) briefly shows `3/3` with a `CheckCircle` in primary teal.
3. After 1.5 seconds, the entire widget fades out and is removed from the DOM.
4. The `complete()` API call fires (persisting to DB).
5. No success overlay needed — the filled progress bar + disappearing widget is the signal.

**Animation:**
- Progress bar fills to 100% (300ms ease-out).
- Brief pause (500ms).
- Widget fades out: `opacity 1 → 0` + `translateY(0 → -8px)`, 300ms ease-in.
- Widget removed from DOM.

---

### State 4: 0/3 (Fresh workspace)

Same as expanded view, but:
- Progress bar is empty (0%).
- Label: `0/3`.
- All step icons are `Circle` (outline, muted-foreground).
- "Load Sample Data" is **prominent** — consider showing it first or with a subtle `bg-accent/40` highlight to draw attention.
- No completed strikethroughs.

---

### State 5: Dismissed

When the user clicks "Skip for now" or `[×]`:
- Widget fades out: `opacity 0` + `translateY(-8px)`, 200ms.
- Removed from DOM.
- A small **"Setup Guide"** ghost button appears in the page header area (next to the workspace name or as a secondary action). This is the existing `showSetupGuideButton` behavior — preserved as-is.

---

## Animation Spec

| Action | Animation | Duration | Easing |
|--------|-----------|----------|--------|
| Expand (pill → card) | `scale(0.95) → scale(1)`, `opacity 0 → 1` | 200ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` (spring) |
| Collapse (card → pill) | `scale(1) → scale(0.95)`, `opacity 1 → 0` then pill appears | 150ms | `ease-out` |
| Step completion | Icon morphs `Circle → CheckCircle`, title gets `line-through` | 200ms | `ease-out` |
| Progress bar fill | Width transition | 300ms | `ease-out` |
| All-complete fade out | `opacity 1 → 0`, `translateY(0 → -8px)` | 300ms | `ease-in` |
| Hover on step row | `bg-muted/40` | 150ms | `transition-colors` |

---

## Spacing & Typography

| Element | Font Size | Weight | Color Token |
|---------|-----------|--------|-------------|
| "Get Started" title | 15px | 700 | `--foreground` |
| Step title | 13px | 600 | `--foreground` (or `--muted-foreground` + line-through when complete) |
| Progress label | 11px | 500 | `--muted-foreground` |
| "Load Sample Data" | 13px | 600 | `--foreground` |
| "Skip for now" | 12px | 500 | `--muted-foreground` |
| Pill text (`2/3`) | 12px | 600 | `--foreground` |

**Spacing:**
- Card padding: `16px` (p-4)
- Gap between step rows: `0` (border-separated, not gap-separated)
- Progress bar margin-bottom: `12px`
- Header margin-bottom: `8px`
- Footer margin-top: `4px`

---

## Mobile Behavior (< 768px)

- **Expanded card:** Full-width within the content area (`w-full`). No max-width cap. Padding reduces to `12px` (p-3).
- **Collapsed pill:** Still sticky at bottom-right. On very small screens (< 375px), the pill text shortens to just the icon + progress (no "2/3" label, just the filled progress bar segment).
- **Touch targets:** All interactive elements maintain minimum `44px` touch target (buttons already do via `size-icon` or `size-sm`).
- **Scroll behavior:** The pill stays visible as the user scrolls the dashboard, anchored to the bottom of the viewport within the content scroll container.

---

## Keyboard & Accessibility

- **Focus management:** Tab order follows visual layout: minimize → close → step rows → sample data → skip.
- **Keyboard shortcuts:**
  - `Escape` on expanded card: collapses to pill (does NOT dismiss).
  - `Escape` on pill: no action (already minimal).
- **ARIA:**
  - Expanded card: `role="region"` with `aria-label="Setup checklist"`. Remove `aria-modal="true"` (it's no longer a modal overlay).
  - Each step row: `role="link"` with `aria-label="Step: Add Your Sales Reps — completed/not completed"`.
  - Progress bar: `role="progressbar"` with `aria-valuenow`, `aria-valuemin="0"`, `aria-valuemax="3"`.
  - Pill: `role="button"` with `aria-label="Setup checklist: 2 of 3 complete. Click to expand."` and `aria-expanded="false"`.
- **Screen reader:** On step completion, announce via `aria-live="polite"` region: "Step completed: Add Your Sales Reps. 2 of 3 complete."

---

## Implementation Notes

1. **Positioning change:** Remove `fixed bottom-4 right-4 z-50` from the outer div. The component renders inline in the dashboard's `space-y-7` container. For the collapsed pill, use `sticky bottom-4 self-end z-10`.

2. **New state:** Add `isCollapsed` (boolean) to component state. Default: `false`. Persisted to `localStorage` key `ck_checklist_collapsed` so the user's preference survives page reloads.

3. **Hook changes:** No changes to `useSetupChecklist` hook. The collapse/expand is purely local UI state.

4. **Step row refactor:** Replace the current `StepCard` component with a simpler `StepRow` component — borderless, single-line, icon + title + chevron.

5. **Remove:** The `showSuccess` state and success overlay animation. Replace with the fade-out-on-complete behavior described above.

6. **Remove:** The `<style>` tag with `@keyframes`. Use Tailwind's `animate-in` / `animate-out` utilities or inline `style` for the remaining animations.

---

## Before / After Comparison

| Aspect | Before | After |
|--------|--------|-------|
| Position | `fixed bottom-4 right-4` (viewport) | Inline flow + `sticky` pill |
| Width | `max-w-[420px]` fixed | `max-w-[480px]` in-flow, responsive |
| Height (expanded) | ~380px | ~240px (37% shorter) |
| Height (collapsed) | N/A | 36px pill |
| Step cards | Bordered cards with descriptions | Borderless rows, no descriptions |
| Sample data | Dashed-border card, 2 lines | Single row with tooltip |
| Minimize | Not possible | `[—]` button → pill |
| Close | `[×]` only (full dismiss) | `[×]` dismisses, `[—]` minimizes |
| Success state | Large overlay card | Fade-out animation |
| z-index | `z-50` (covers content) | `z-10` (pill only, above content) |

---

## File Changes Required

| File | Change |
|------|--------|
| `artifacts/web/src/components/setup-checklist.tsx` | Full rewrite of rendering logic, add collapse state, new StepRow component, pill variant, remove fixed positioning |
| `artifacts/web/src/pages/dashboard.tsx` | No change needed — `<SetupChecklist />` stays in the same position in the JSX tree |
| `artifacts/web/src/hooks/use-setup-checklist.ts` | No change needed |

---

*End of spec. Ready for @pixel to implement.*
