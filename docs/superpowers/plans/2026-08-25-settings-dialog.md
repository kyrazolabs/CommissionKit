# Settings Dialog Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move Settings from a routed full page into a responsive modal dialog with a left-hand section rail (horizontal chips on mobile), opened from the sidebar.

**Architecture:** A Zustand store (`useSettingsDialog`) holds open state. `SettingsDialog` mounts once in `Layout` and wraps the existing `SettingsPage` content. Sidebar nav + user-dropdown items call `open()` instead of navigating. `/dash/settings` redirects to `/dash`.

**Tech Stack:** React 19, Wouter, Radix Dialog + Tabs, Zustand, Tailwind CSS 4, Bun test + Testing Library.

## Global Constraints

- Bun only. No npm/yarn/pnpm.
- No hardcoded hex. Use CSS variables (`bg-primary`, `text-muted-foreground`, `border-card-border`, `bg-sidebar-accent`).
- No React Router. Router is Wouter.
- No `console.log` in production source.
- No emojis in UI. Lucide icons only, stroke 2px, `size-4`.
- Do not commit unless the founder asks.

---

## File map

- Create: `artifacts/web/src/hooks/use-settings-dialog.ts`
- Create: `artifacts/web/src/hooks/use-settings-dialog.test.ts`
- Create: `artifacts/web/src/components/settings/settings-dialog.tsx`
- Create: `artifacts/web/src/components/settings/settings-dialog.test.tsx`
- Modify: `artifacts/web/src/pages/settings/settings.tsx` (drop page chrome + `usePageMeta`; restyle Tabs into left rail / mobile chips)
- Modify: `artifacts/web/src/components/layout/sidebar.tsx` (Settings nav item + user dropdown open the dialog)
- Modify: `artifacts/web/src/App.tsx` (mount dialog; redirect `/dash/settings`)

---

### Task 1: `useSettingsDialog` store

**Files:**
- Create: `artifacts/web/src/hooks/use-settings-dialog.ts`
- Test: `artifacts/web/src/hooks/use-settings-dialog.test.ts`

**Interfaces:**
- Consumes: `zustand` `create` (same pattern as `use-sync-store.ts`)
- Produces:
  ```ts
  interface SettingsDialogState {
    isOpen: boolean;
    open: () => void;
    close: () => void;
  }
  export const useSettingsDialog: () => SettingsDialogState;
  ```

- [ ] **Step 1: Write the failing test**

```ts
import { beforeEach, describe, expect, test } from "bun:test";
import { useSettingsDialog } from "./use-settings-dialog";

describe("useSettingsDialog", () => {
  beforeEach(() => {
    useSettingsDialog.setState({ isOpen: false });
  });

  test("starts closed", () => {
    expect(useSettingsDialog.getState().isOpen).toBe(false);
  });

  test("open() sets isOpen true", () => {
    useSettingsDialog.getState().open();
    expect(useSettingsDialog.getState().isOpen).toBe(true);
  });

  test("close() sets isOpen false", () => {
    useSettingsDialog.getState().open();
    useSettingsDialog.getState().close();
    expect(useSettingsDialog.getState().isOpen).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test artifacts/web/src/hooks/use-settings-dialog.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write minimal implementation**

```ts
import { create } from "zustand";

interface SettingsDialogState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
}

export const useSettingsDialog = create<SettingsDialogState>((set) => ({
  isOpen: false,
  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test artifacts/web/src/hooks/use-settings-dialog.test.ts`
Expected: PASS (3 tests).

---

### Task 2: `SettingsDialog` shell

**Files:**
- Create: `artifacts/web/src/components/settings/settings-dialog.tsx`
- Test: `artifacts/web/src/components/settings/settings-dialog.test.tsx`

**Interfaces:**
- Consumes: `useSettingsDialog` from Task 1; `@/components/ui/dialog`; `SettingsPage` from `@/pages/settings/settings`
- Produces: `export function SettingsDialog(): JSX.Element`

Dialog content classes (exact):
- Always: `p-0 gap-0 overflow-hidden flex flex-col`
- Desktop (`sm:`): `sm:max-w-5xl sm:h-[min(85vh,900px)] sm:rounded-lg`
- Mobile: `w-full h-[100dvh] max-w-none rounded-none`

Header: `DialogHeader` + `DialogTitle` using `t("settings.title")`, `text-left px-6 pt-6 pb-3`.

Body: `flex-1 min-h-0 overflow-hidden` wrapping `<SettingsPage />`.

`onOpenChange`: `(next) => (next ? open() : close())`.

- [ ] **Step 1: Write the failing test**

Mock `SettingsPage` so the test does not pull in auth/workspace. Mock `useTranslation` to return the key. Render `SettingsDialog`, call `open()`, assert the dialog title and mocked page appear. Call `close()`, assert gone.

```tsx
import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test";
import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { useSettingsDialog } from "@/hooks/use-settings-dialog";

mock.module("react-i18next", () => ({
  useTranslation: () => ({ t: (k: string) => k }),
}));

mock.module("@/pages/settings/settings", () => ({
  SettingsPage: () => React.createElement("div", { "data-testid": "settings-page" }, "page"),
}));

describe("SettingsDialog", () => {
  beforeEach(() => {
    useSettingsDialog.setState({ isOpen: false });
  });
  afterEach(() => cleanup());

  test("does not render content when closed", async () => {
    const { SettingsDialog } = await import("./settings-dialog");
    render(React.createElement(SettingsDialog));
    expect(screen.queryByTestId("settings-page")).toBeNull();
  });

  test("renders title and page when open", async () => {
    useSettingsDialog.setState({ isOpen: true });
    const { SettingsDialog } = await import("./settings-dialog");
    render(React.createElement(SettingsDialog));
    expect(screen.getByText("settings.title")).not.toBeNull();
    expect(screen.getByTestId("settings-page")).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `bun test artifacts/web/src/components/settings/settings-dialog.test.tsx`
Expected: FAIL — module not found.

- [ ] **Step 3: Write `SettingsDialog`**

```tsx
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useSettingsDialog } from "@/hooks/use-settings-dialog";
import { SettingsPage } from "@/pages/settings/settings";

export function SettingsDialog() {
  const { t } = useTranslation();
  const { isOpen, open, close } = useSettingsDialog();

  return (
    <Dialog open={isOpen} onOpenChange={(next) => (next ? open() : close())}>
      <DialogContent className="flex h-[100dvh] w-full max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[min(85vh,900px)] sm:max-w-5xl sm:rounded-lg">
        <DialogHeader className="px-6 pt-6 pb-3 text-left">
          <DialogTitle>{t("settings.title")}</DialogTitle>
        </DialogHeader>
        <div className="min-h-0 flex-1 overflow-hidden">
          <SettingsPage />
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `bun test artifacts/web/src/components/settings/settings-dialog.test.tsx`
Expected: PASS.

---

### Task 3: Restyle `SettingsPage` into left rail / mobile chips

**Files:**
- Modify: `artifacts/web/src/pages/settings/settings.tsx`

**Interfaces:**
- Consumes: existing Radix `Tabs` / `TabsList` / `TabsTrigger` / `TabsContent`
- Produces: same `export function SettingsPage()` — no page chrome, no `usePageMeta`, two-pane layout

Required edits (do not rewrite section content):

1. Remove the `usePageMeta` import and the `usePageMeta({...})` call.
2. Remove the page header block:
   ```tsx
   <div>
     <p className="text-[12px] font-semibold text-primary mb-1">{t("settings.configuration")}</p>
     <h1>...</h1>
     <p className="text-[14px] text-muted-foreground mt-1">{t("settings.description")}</p>
   </div>
   ```
3. Change the outer wrapper from `className="space-y-7 max-w-3xl"` to `className="h-full"`.
4. Change `<Tabs>` to:
   ```tsx
   <Tabs
     defaultValue="account"
     orientation="vertical"
     className="flex h-full w-full flex-col sm:flex-row"
   >
   ```
5. Replace `TabsList` classes with:
   ```tsx
   <TabsList className="h-auto w-full shrink-0 justify-start gap-1 overflow-x-auto rounded-none border-b border-card-border bg-transparent p-3 sm:h-full sm:w-56 sm:flex-col sm:items-stretch sm:overflow-y-auto sm:overflow-x-hidden sm:border-b-0 sm:border-r sm:bg-muted/40">
   ```
6. Each `TabsTrigger` classes:
   ```tsx
   className="min-w-fit shrink-0 justify-start px-3 py-2 data-[state=active]:bg-sidebar-accent data-[state=active]:text-sidebar-accent-foreground data-[state=active]:shadow-none sm:w-full"
   ```
7. Wrap all `TabsContent` siblings in:
   ```tsx
   <div className="min-h-0 flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6">
   ```
   and add `className="mt-0 outline-none"` on every `TabsContent` (override the default `mt-2`).

Do not change Account / Appearance / Workspace / Notifications / Security / Roles / API Keys inner markup.

- [ ] **Step 1: Apply the layout edits above**
- [ ] **Step 2: Typecheck**

Run: `bun run --filter @workspace/web typecheck` (or `bun run typecheck` if filter is slow)
Expected: clean.

---

### Task 4: Wire sidebar + dropdown + Layout + redirect

**Files:**
- Modify: `artifacts/web/src/components/layout/sidebar.tsx`
- Modify: `artifacts/web/src/App.tsx`

**Interfaces:**
- Consumes: `useSettingsDialog().open` / `.isOpen`
- Produces: Settings no longer navigates; dialog opens from both entry points

**Sidebar nav item**

Change the settings item from a href-only object to:

```ts
{
  name: t("layout.settings"),
  href: "/dash/settings",
  icon: "Settings",
  action: "openSettings" as const,
}
```

In the `group.items.map` renderer, if `item.action === "openSettings"`:

- Render a `<button type="button">` (same visual classes as the existing `Link`) instead of `<Link>`.
- `onClick`: `Analytics.navClick(group.label, "settings", item.name); useSettingsDialog.getState().open(); onCloseMobile?.();`
- `isActive`: `useSettingsDialog().isOpen` (do not treat `/dash/settings` as active).
- Keep the collapsed-tooltip wrap.

Import: `import { useSettingsDialog } from "@/hooks/use-settings-dialog";`

**User dropdown**

Replace:

```tsx
<DropdownMenuItem asChild>
  <Link href="/dash/settings" className="w-full cursor-pointer flex items-center gap-2.5 rounded-lg py-2">
    <Settings className="size-3.75 opacity-70" />
    {t("sidebar.accountSettings")}
  </Link>
</DropdownMenuItem>
```

with:

```tsx
<DropdownMenuItem
  className="w-full cursor-pointer flex items-center gap-2.5 rounded-lg py-2"
  onClick={() => useSettingsDialog.getState().open()}
>
  <Settings className="size-3.75 opacity-70" />
  {t("sidebar.accountSettings")}
</DropdownMenuItem>
```

**App.tsx**

1. Import `SettingsDialog` from `@/components/settings/settings-dialog`.
2. Inside `Layout`, after `<Header />` (or as last child of the outer flex column), render `<SettingsDialog />`.
3. Replace the settings route with a redirect component:

```tsx
function SettingsRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    navigate("/dash", { replace: true });
  }, [navigate]);
  return null;
}
```

```tsx
<Route path="/dash/settings" component={SettingsRedirect} />
```

4. Keep the `SettingsPage` import only if still needed (it is used inside `SettingsDialog`, not App). Remove unused `SettingsPage` import from `App.tsx`.

- [ ] **Step 1: Apply the wiring edits**
- [ ] **Step 2: Typecheck + targeted tests**

Run:
```
bun test artifacts/web/src/hooks/use-settings-dialog.test.ts artifacts/web/src/components/settings/settings-dialog.test.tsx
bun run typecheck
```
Expected: tests PASS, typecheck clean.

- [ ] **Step 3: Update progress tracker**

Add a Recent Changes bullet in `context/progress-tracker.md` describing the Settings dialog + left rail + mobile chips + route redirect.

---

## Self-review

1. **Spec coverage**
   - Store + open/close → Task 1
   - Dialog shell, size, header title → Task 2
   - Left rail desktop / chips mobile, content panes untouched → Task 3
   - Sidebar + dropdown + Layout mount + `/dash/settings` redirect → Task 4
   - Drop `usePageMeta` → Task 3
2. **Placeholders:** none.
3. **Types:** `useSettingsDialog` shape is identical across tasks (`isOpen`, `open`, `close`).
