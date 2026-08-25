# Settings Dialog — Design Spec

**Date:** 2026-08-25
**Status:** Approved design
**Owner:** @nexus (routing) → @pixel (implementation)

## Goal

Move the Settings page from a routed full-page (`/dash/settings`) into a modal dialog with a left-hand vertical section nav, and make the dialog fully responsive. The top nav of settings tabs becomes a left rail.

## Non-goals

- No changes to individual settings section content (Account, Appearance, Workspace, Notifications, Security, Roles, API Keys) beyond what the layout change requires.
- No redesign of the app's global header/sidebar chrome (logo, theme, language, notifications stay in the top header).

## Current state

- `artifacts/web/src/pages/settings/settings.tsx` (`SettingsPage`) renders 8 sections in a horizontal `Tabs` (Radix via `@/components/ui/tabs`), ~967 lines.
- Two entry points link to `/dash/settings`:
  - Sidebar nav item (`components/layout/sidebar.tsx`, line ~375).
  - User dropdown "Account Settings" (`sidebar.tsx`, line ~563).
- Route registered in `App.tsx` (line ~361): `<Route path="/dash/settings" component={SettingsPage} />`.
- Layout shell (`App.tsx` `Layout`) = `Header` + `Sidebar` + main content. `Dialog` primitive exists (`components/ui/dialog.tsx`).

## Approach

**A. SettingsDialog + vertical left nav** (chosen). Wrap the existing settings content in a `Dialog`. Sidebar and user-dropdown entries become buttons that open it. A small Zustand store holds open state.

## Architecture

### 1. New store — `useSettingsDialog`

- File: `artifacts/web/src/hooks/use-settings-dialog.ts`
- Zustand store following the existing `useSyncStore` pattern:
  - `isOpen: boolean`
  - `open(): void`
  - `close(): void`
- Purpose: let any component (sidebar nav, user dropdown) open the dialog without prop drilling.

### 2. New component — `SettingsDialog`

- File: `artifacts/web/src/components/settings/settings-dialog.tsx`
- Renders a Radix `Dialog` controlled by `useSettingsDialog`:
  - `open={isOpen}` / `onOpenChange={(o) => o ? open() : close()}`
- `DialogContent` overrides:
  - Desktop: `max-w-5xl`, `h-[min(85vh,900px)]`, `p-0`, `overflow-hidden`.
  - Mobile: full-screen `h-[100dvh] w-full max-w-none rounded-none`.
- Dialog header: `DialogHeader` with `DialogTitle` "Settings" (visible, `text-left`, satisfies Radix a11y requirement) and no description. The default Radix close icon is kept (top-right).
- Body: two-pane layout — left rail + right content pane (see 3).

### 3. Left rail → right pane

- Left rail (desktop, `sm:` and up):
  - Width `w-56`, `border-r border-card-border`, `bg-muted/40`, full-height.
  - Stacked buttons, one per section (8 total): Account, Appearance, Workspace, Notifications, Security, Roles, API Keys.
  - Active state: `bg-sidebar-accent text-sidebar-accent-foreground font-semibold`.
  - Inactive: `text-sidebar-foreground hover:bg-muted hover:text-foreground`.
  - Icons: reuse `lucide-react` icons already used in the settings page; stroke 2px, `size-4`.
- Right pane:
  - `flex-1 overflow-y-auto custom-scrollbar`, `p-6`.
  - Renders the active section's content (reuses existing `TabsContent` panes).
- Responsive (mobile, below `sm`):
  - Rail collapses to a horizontal scrollable chip row pinned at the top of the dialog body:
    - `flex gap-1 overflow-x-auto px-3 py-3 border-b border-card-border`, `sm:hidden`.
  - Chips use the same active/inactive tokens; `shrink-0` so they don't compress.
  - Known minor nuance: Radix `orientation="vertical"` keeps up/down arrow-key navigation, which on the mobile horizontal chip row is a mild mismatch. Accepted for now; flag for the a11y audit follow-up if desired.

### 4. SettingsPage refactor

- `SettingsPage` (`pages/settings/settings.tsx`):
  - Drop `usePageMeta` (no longer a routed page; avoids overriding page title while dialog is open).
  - Replace horizontal `TabsList` with the vertical-left / horizontal-mobile layout described in §3. Implementation detail: Radix `Tabs` supports `orientation="vertical"`; alternatively drive sections with local `useState` active key + a plain button list. **Decision: keep Radix `Tabs`** (`orientation="vertical"`) to preserve accessible arrow-key/roving-tabindex behavior, and restyle `TabsList`/`TabsTrigger` to the rail/chips classes. `TabsContent` panes stay untouched.
  - Export remains `SettingsPage`, now rendered inside `SettingsDialog` rather than by a route.

### 5. Wiring (entry points + route)

- `components/layout/sidebar.tsx`:
  - Sidebar "Settings" nav item: change `<Link href="/dash/settings">` → `<button onClick={() => open()}>` (same icon/label). Fire `Analytics.navClick("Account", "settings", ...)` to preserve analytics parity.
  - User dropdown "Account Settings" item: same change, close the dropdown before opening the dialog.
- `App.tsx`:
  - Remove `<Route path="/dash/settings" component={SettingsPage} />`.
  - Add a tiny `SettingsRedirect` component (Wouter has no `Redirect` export here) that navigates to `/dash` with `replace: true` via `useLocation`, mounted at `/dash/settings` so stale bookmarks land safely on the dashboard.
  - Mount `<SettingsDialog />` once inside `Layout` so it is available on every authenticated page.

### 6. Data flow

```
Sidebar "Settings" (or user dropdown) --onClick--> useSettingsDialog.open()
  --> SettingsDialog (Dialog open)
      --> left rail (Tabs vertical) --> active section state
          --> right pane renders active TabsContent
  --close (X / overlay / Esc)--> useSettingsDialog.close()
```

No data fetching changes. All sections keep their existing React Query hooks and local state.

## Error handling

- None new. Existing section error/toast handling is unchanged.
- `SettingsDialog` mount must not throw when `user`/`activeWorkspace` are briefly undefined during auth hydration — sections already handle this (existing loading/skeleton states).

## Testing

- Add/update web tests:
  - `use-settings-dialog` store: open/close toggles state.
  - `SettingsDialog`: renders rail + active pane; clicking a rail item switches section; mobile breakpoint renders chip row.
  - Sidebar: clicking "Settings" opens the dialog (assert store `isOpen` flips or dialog portal appears); user dropdown "Account Settings" likewise.
- Verify existing `settings` page tests still pass after the Tabs orientation refactor (or update expectations if they asserted horizontal tab markup).
- Manual: `bun run typecheck`, `bun run lint`, targeted web tests.

## Out of scope / follow-ups

- Deep-link persistence of a specific section (e.g. reopening to "Roles") — not required now; dialog always opens on "Account".
- Converting Settings to a `Sheet` drawer (rejected in favor of a true dialog).
