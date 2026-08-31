# Setup Checklist Close Confirmation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a confirmation dialog when the user clicks the X (close) icon on the setup checklist, and rename the footer "Skip for now" button to "Skip Onboarding" for clarity.

**Architecture:** Single component change in `artifacts/web/src/components/setup-checklist.tsx`. Refactor `handleDismiss` to open a `ConfirmDialog` instead of firing immediately. Add a new `handleConfirmClose` for the actual dismiss. Render a second `ConfirmDialog` instance (reusing the existing primitive). The footer button keeps the same handler but its visible text and `aria-label` change. No hook, backend, or layout changes.

**Tech Stack:** React 19, TypeScript, Bun test, Radix `AlertDialog` (via the existing `ConfirmDialog` primitive), TanStack React Query (no changes), `lucide-react` icons (no changes).

## Global Constraints

- Bun is the only package manager. Run tests with `bun test --preload ./test/dom-setup.ts <file>`.
- No emojis in UI. Use Lucide icons (already used throughout).
- No hardcoded hex values. Use semantic tokens (`bg-card`, `text-muted-foreground`, etc.).
- No `console.log` in production code.
- Existing design tokens, button variants, and `ConfirmDialog` primitive are reused as-is.
- Existing file structure: `artifacts/web/src/components/setup-checklist.tsx` (component), `artifacts/web/src/hooks/use-setup-checklist.ts` (hook, no changes), `artifacts/web/src/components/ui/confirm-dialog.tsx` (primitive, no changes).
- Existing test infrastructure: `setup-checklist.test.tsx` uses `mock.module` for `@/hooks/use-workspace`, `@tanstack/react-query`, `@workspace/api-client-react`, `@/hooks/use-auth`, `@/lib/api`, `wouter`, `@/hooks/use-toast`. The `mockApiFetch` is stateful and simulates the backend by mutating `mockOnboarding` on PATCH calls.

---

### Task 1: Refactor `handleDismiss` and add `handleConfirmClose`

**Files:**
- Modify: `artifacts/web/src/components/setup-checklist.tsx:164-169`

**Interfaces:**
- Consumes: existing `dismiss` from `useSetupChecklist()` (unchanged)
- Produces: new `handleConfirmClose` callback that wraps the existing dismiss flow

- [ ] **Step 1: Locate the current `handleDismiss`**

Read `artifacts/web/src/components/setup-checklist.tsx` lines 164-169. Current code:

```tsx
const handleDismiss = useCallback(async () => {
  setIsExiting(true);
  setTimeout(async () => {
    await dismiss();
  }, 200);
}, [dismiss]);
```

- [ ] **Step 2: Replace `handleDismiss` and add `handleConfirmClose`**

Replace lines 164-169 with:

```tsx
// X icon button: opens the confirmation dialog. The actual dismiss happens
// in handleConfirmClose after the user confirms.
const handleDismiss = useCallback(() => {
  setShowCloseConfirm(true);
}, []);

// Footer "Skip Onboarding" button: also opens the same dialog (same handler),
// but the dialog copy makes the action's permanent effect explicit.
const handleConfirmClose = useCallback(async () => {
  setShowCloseConfirm(false);
  setIsExiting(true);
  setTimeout(async () => {
    await dismiss();
  }, 200);
}, [dismiss]);
```

- [ ] **Step 3: Verify typecheck passes**

Run: `bun run typecheck 2>&1 | tail -20`
Expected: all workspaces pass. The `dismiss` reference is no longer used inside `handleDismiss`, but it's used inside `handleConfirmClose`, so the `useCallback` dep array is correct.

Note: At this point the code references `setShowCloseConfirm` which doesn't exist yet. Typecheck will FAIL with "Cannot find name 'setShowCloseConfirm'". That's expected — Task 2 adds the state.

- [ ] **Step 4: Don't commit yet**

Hold this change for Task 2 (state) and Task 3 (dialog render) so they land together in one atomic commit.

---

### Task 2: Add `showCloseConfirm` state

**Files:**
- Modify: `artifacts/web/src/components/setup-checklist.tsx:86-88`

- [ ] **Step 1: Locate existing state declarations**

Read `artifacts/web/src/components/setup-checklist.tsx` lines 86-88. Current code:

```tsx
const [isCollapsed, setIsCollapsed] = useState(false);
const [isExiting, setIsExiting] = useState(false);
const [showConfirmDialog, setShowConfirmDialog] = useState(false);
```

- [ ] **Step 2: Add the new state**

Add one new line right after the existing `showConfirmDialog` line:

```tsx
const [isCollapsed, setIsCollapsed] = useState(false);
const [isExiting, setIsExiting] = useState(false);
const [showConfirmDialog, setShowConfirmDialog] = useState(false);
const [showCloseConfirm, setShowCloseConfirm] = useState(false);
```

- [ ] **Step 3: Verify typecheck passes**

Run: `bun run typecheck 2>&1 | tail -20`
Expected: PASS. The state is declared and referenced by the new handlers from Task 1, so types resolve.

---

### Task 3: Render the close confirmation dialog

**Files:**
- Modify: `artifacts/web/src/components/setup-checklist.tsx:412-422` (after the existing `ConfirmDialog`)

- [ ] **Step 1: Locate the existing `ConfirmDialog` for "Load Sample Data"**

Read `artifacts/web/src/components/setup-checklist.tsx` lines 412-422. Current code:

```tsx
<ConfirmDialog
  open={showConfirmDialog}
  onOpenChange={setShowConfirmDialog}
  title="Load Sample Data"
  description="This will add sample reps, a commission plan, and 18 deals to your workspace. You can remove them later from Settings."
  confirmLabel="Load Sample Data"
  cancelLabel="Cancel"
  variant="default"
  onConfirm={handleConfirmLoad}
  loading={isSeeding}
/>
```

- [ ] **Step 2: Add a new `ConfirmDialog` right after it**

```tsx
<ConfirmDialog
  open={showConfirmDialog}
  onOpenChange={setShowConfirmDialog}
  title="Load Sample Data"
  description="This will add sample reps, a commission plan, and 18 deals to your workspace. You can remove them later from Settings."
  confirmLabel="Load Sample Data"
  cancelLabel="Cancel"
  variant="default"
  onConfirm={handleConfirmLoad}
  loading={isSeeding}
/>

<ConfirmDialog
  open={showCloseConfirm}
  onOpenChange={setShowCloseConfirm}
  title="Close setup checklist?"
  description="You won't see this setup checklist again for this workspace."
  confirmLabel="Close checklist"
  cancelLabel="Keep open"
  variant="default"
  onConfirm={handleConfirmClose}
/>
```

- [ ] **Step 3: Verify typecheck passes**

Run: `bun run typecheck 2>&1 | tail -20`
Expected: PASS.

- [ ] **Step 4: Commit Tasks 1-3 together**

```bash
git add artifacts/web/src/components/setup-checklist.tsx
git commit -m "feat(web): add confirmation dialog for setup checklist X button"
```

---

### Task 4: Rename footer button to "Skip Onboarding"

**Files:**
- Modify: `artifacts/web/src/components/setup-checklist.tsx` (the footer Button text + aria-label)

- [ ] **Step 1: Locate the footer button**

Read `artifacts/web/src/components/setup-checklist.tsx` around lines 397-405. The footer has a `Button` with `onClick={handleDismiss}` and visible text `allComplete ? "Dismiss" : "Skip for now"`. Current code:

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={handleDismiss}
  className="text-xs text-muted-foreground font-medium"
>
  {allComplete ? "Dismiss" : "Skip for now"}
</Button>
```

- [ ] **Step 2: Rename the button text and add aria-label**

The footer button is only rendered in the `!allComplete` branch (the `allComplete` branch shows the "Run Your First Commission" CTA, no footer). So the conditional `allComplete ? "Dismiss" : "Skip for now"` only ever renders "Skip for now" in practice. But `allComplete` is also gated by `!allComplete` in `shouldRender`, so the `allComplete` branch is dead code here — but keep the conditional for safety.

Replace with:

```tsx
<Button
  variant="ghost"
  size="sm"
  onClick={handleDismiss}
  aria-label="Skip onboarding"
  className="text-xs text-muted-foreground font-medium"
>
  {allComplete ? "Dismiss" : "Skip Onboarding"}
</Button>
```

- [ ] **Step 3: Verify typecheck passes**

Run: `bun run typecheck 2>&1 | tail -20`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add artifacts/web/src/components/setup-checklist.tsx
git commit -m "feat(web): rename Skip for now to Skip Onboarding"
```

---

### Task 5: Add tests for the new behavior

**Files:**
- Modify: `artifacts/web/src/components/setup-checklist.test.tsx`

**Interfaces:**
- Consumes: existing test helpers (`mockApiFetch`, `mockOnboarding`, `mockActiveWorkspace`)
- Produces: 4 new test cases (X opens dialog, Keep open cancels, Close checklist calls PATCH, footer shows "Skip Onboarding" with no dialog)

- [ ] **Step 1: Read the test file to understand existing patterns**

Read `artifacts/web/src/components/setup-checklist.test.tsx` end-to-end. Note especially:
- The `beforeEach` block that resets `mockOnboarding`, `mockActiveWorkspace`, `mockApiFetch.mockImplementation(apiFetchImpl)`, `queryClientMock.invalidateQueries.mockReset()`, and `localStorageMock.clear()`.
- Existing test `plays exit animation then unmounts when user dismisses` (which currently tests immediate dismiss from the footer button) — you'll need to UPDATE it.
- How `act` + `userEvent` are used together.
- The `waitFor` wrapper for async assertions.

- [ ] **Step 2: Add the 4 new tests at the end of the `describe("SetupChecklist Component", ...)` block**

Find the closing `});` of the main describe block. Insert before it:

```tsx
test("clicking X icon opens the close confirmation dialog", async () => {
  const { SetupChecklist } = await import("@/components/setup-checklist");
  render(React.createElement(SetupChecklist));

  // Wait for the X (close) button to appear
  const closeBtn = await waitFor(() =>
    screen.getByRole("button", { name: /close checklist/i }),
  );

  await act(async () => {
    await userEvent.click(closeBtn);
  });

  // Dialog should be open
  await waitFor(() => {
    expect(screen.getByText("Close setup checklist?")).toBeTruthy();
  });
  expect(
    screen.getByText(/you won't see this setup checklist again/i),
  ).toBeTruthy();
});

test("Keep open cancels the close confirmation and does not call PATCH", async () => {
  mockApiFetch.mockClear();

  const { SetupChecklist } = await import("@/components/setup-checklist");
  render(React.createElement(SetupChecklist));

  const closeBtn = await waitFor(() =>
    screen.getByRole("button", { name: /close checklist/i }),
  );

  await act(async () => {
    await userEvent.click(closeBtn);
  });

  const keepOpenBtn = await waitFor(() =>
    screen.getByRole("button", { name: /keep open/i }),
  );
  await act(async () => {
    await userEvent.click(keepOpenBtn);
  });

  // Dialog should close
  await waitFor(() => {
    expect(screen.queryByText("Close setup checklist?")).toBeNull();
  });

  // PATCH should not have been called for onboarding
  const onboardingCalls = mockApiFetch.mock.calls.filter(
    (call) =>
      typeof call[0] === "string" &&
      (call[0] as string).includes("/onboarding") &&
      ((call[1] as { method?: string })?.method ?? "GET") === "PATCH",
  );
  expect(onboardingCalls).toHaveLength(0);
});

test("Close checklist in dialog calls PATCH with dismiss action", async () => {
  mockApiFetch.mockClear();

  const { SetupChecklist } = await import("@/components/setup-checklist");
  render(React.createElement(SetupChecklist));

  const closeBtn = await waitFor(() =>
    screen.getByRole("button", { name: /close checklist/i }),
  );
  await act(async () => {
    await userEvent.click(closeBtn);
  });

  const confirmCloseBtn = await waitFor(() =>
    screen.getByRole("button", { name: /^close checklist$/i }),
  );
  await act(async () => {
    await userEvent.click(confirmCloseBtn);
    await new Promise((r) => setTimeout(r, 300));
  });

  await waitFor(() => {
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/workspaces/ws1/onboarding",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ action: "dismiss" }),
      }),
    );
  });
});

test("footer button shows Skip Onboarding and dismisses without dialog", async () => {
  const { SetupChecklist } = await import("@/components/setup-checklist");
  render(React.createElement(SetupChecklist));

  // Footer button (still a direct dismiss)
  const skipBtn = await waitFor(() =>
    screen.getByRole("button", { name: /skip onboarding/i }),
  );
  expect(skipBtn.textContent?.trim()).toBe("Skip Onboarding");

  await act(async () => {
    await userEvent.click(skipBtn);
    await new Promise((r) => setTimeout(r, 300));
  });

  // No confirmation dialog should appear
  expect(screen.queryByText("Close setup checklist?")).toBeNull();

  // PATCH should have fired
  await waitFor(() => {
    expect(mockApiFetch).toHaveBeenCalledWith(
      "/api/workspaces/ws1/onboarding",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ action: "dismiss" }),
      }),
    );
  });
});
```

- [ ] **Step 3: Update the existing test `plays exit animation then unmounts when user dismisses`**

Find this existing test in the file. It was written when X dismissed immediately. The new behavior: X opens a dialog, the user must confirm, then the exit animation plays. Update the test to:

```tsx
test("plays exit animation then unmounts when user dismisses", async () => {
  const { SetupChecklist } = await import("@/components/setup-checklist");
  render(React.createElement(SetupChecklist));

  // Click X
  const closeBtn = await waitFor(() =>
    screen.getByRole("button", { name: /close checklist/i }),
  );
  await act(async () => {
    await userEvent.click(closeBtn);
  });

  // Confirm in dialog
  const confirmCloseBtn = await waitFor(() =>
    screen.getByRole("button", { name: /^close checklist$/i }),
  );
  await act(async () => {
    await userEvent.click(confirmCloseBtn);
    await new Promise((r) => setTimeout(r, 250));
  });

  // Wait for unmount
  await waitFor(() => {
    expect(screen.queryByRole("region", { name: /setup checklist/i })).toBeNull();
  });
});
```

- [ ] **Step 4: Run the test file to verify all pass**

Run: `bun test artifacts/web/src/components/setup-checklist.test.tsx --preload ./test/dom-setup.ts 2>&1 | tail -20`
Expected: all tests pass. If any test fails, read the error, fix the test, re-run. Common issues:
- `userEvent` setup needs the DOM happy-dom preload — already configured.
- `act()` warnings: wrap any state-update-triggering action in `act(() => ...)` or `await act(async () => ...)`.
- `mockApiFetch.mockClear()` doesn't reset the mock implementation. Use `mockApiFetch.mockReset(); mockApiFetch.mockImplementation(apiFetchImpl);` if you need a full reset. The `beforeEach` already does this.

- [ ] **Step 5: Commit**

```bash
git add artifacts/web/src/components/setup-checklist.test.tsx
git commit -m "test(web): cover setup checklist close confirmation + Skip Onboarding"
```

---

### Task 6: Final verification

**Files:** none modified

- [ ] **Step 1: Run full monorepo typecheck**

Run: `bun run typecheck 2>&1 | tail -10`
Expected: all 6 workspaces pass.

- [ ] **Step 2: Run full web test suite**

Run: `bun run --filter @workspace/web test 2>&1 | tail -10`
Expected: pass count is 4 higher than the pre-existing baseline (72 pass / 20 fail baseline → 76 pass / 20 fail). Zero new failures. The 20 pre-existing failures in `audit-log.test.tsx` are unrelated.

- [ ] **Step 3: Log the change**

Update `context/progress-tracker.md`. Add a new entry under "Recent Changes":

```markdown
- **Setup Checklist close confirmation**: X icon now opens a confirmation dialog before dismissing the checklist. Footer button renamed from "Skip for now" to "Skip Onboarding" for clarity. Reuses the existing `ConfirmDialog` primitive. 4 new component tests + 1 updated. Full monorepo typecheck clean, web test suite +4 pass / -0 fail vs. baseline (no regressions).
```

- [ ] **Step 4: Commit the progress tracker update**

```bash
git add context/progress-tracker.md
git commit -m "docs: log setup checklist close confirmation in progress tracker"
```

- [ ] **Step 5: Report back to user**

Report: (a) which tasks completed, (b) final test count, (c) confirmation typecheck clean, (d) any concerns.

---

## Self-Review

**Spec coverage:**
- X icon requires confirmation → Task 3 (dialog)
- "Keep open" / "Close checklist" copy → Task 3
- Footer button renamed to "Skip Onboarding" → Task 4
- Footer button still direct dismiss → Task 1 (handler refactor keeps it direct) + Task 4 (just rename)
- Reduced motion unchanged → covered by reusing Radix `AlertDialog` primitive
- No changes to hook/backend/layout → no tasks for those, explicitly out of scope

**Placeholder scan:** No TBD/TODO/fill-in markers. All test code is concrete.

**Type consistency:** `dismiss` and `complete` are the only hook exports used. `handleDismiss` and `handleConfirmClose` are the only new identifiers. `setShowCloseConfirm` is added in Task 2 and consumed by Task 1 and Task 3.

**Ambiguity check:** Each step has concrete code. The `mockApiFetch.mockClear()` vs `mockReset()` distinction is called out in Task 5 Step 4.
