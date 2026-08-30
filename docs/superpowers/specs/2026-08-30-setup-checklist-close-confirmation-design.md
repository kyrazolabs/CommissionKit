# Setup Checklist Close Confirmation — Design

**Date:** 2026-08-30
**Status:** Approved
**Author:** @nexus (with @pixel for implementation)

## Problem

The setup checklist card can be dismissed in one click via either the X (top-right) or the footer "Skip for now" button. Accidental clicks permanently hide a checklist the user may still need. The card hides via `PATCH /api/workspaces/:id/onboarding action: "dismiss"`, which sets `checklistDismissed: true` in the DB.

## Goal

Reduce accidental dismissal. Make the action of closing the X icon intentional, while keeping the footer "skip" path as a deliberate but unconfirmed shortcut — renamed so its permanent effect is explicit.

## Behavior

### X icon button (top-right of card) — confirmation required

1. Open existing `ConfirmDialog` (Radix `AlertDialog`)
2. Title: **"Close setup checklist?"**
3. Body: **"You won't see this setup checklist again for this workspace."** (Honest about the permanent effect — there is no Settings UI to reopen it. The `show()` API exists but is not wired to any UI.)
4. Buttons: **"Keep open"** (cancel) | **"Close checklist"** (confirm, `variant="default"`, NOT destructive — the user is choosing this)
5. On confirm: run the existing dismiss flow (exit animation 200ms, then PATCH `/api/workspaces/:id/onboarding` with `action: "dismiss"`)
6. Cancel just closes the dialog with no side effects

### Footer button — renamed, still direct

- Visible text: **"Skip Onboarding"** (was "Skip for now")
- `aria-label`: `"Skip onboarding"`
- Still fires `handleDismiss` immediately (no confirmation)
- The new name signals the action's permanent effect

### Unchanged

- "Load Sample Data" confirmation (separate dialog, separate state)
- Auto-complete when `allComplete && !isCompleted` (card hides silently, no dialog)
- Reduced motion: Radix `AlertDialog` respects `prefers-reduced-motion`
- The "celebration" view (when `allComplete` is true at render time) — it no longer shows in the new design because the `!allComplete` gate was added in the previous task

## Architecture

Single file change: `artifacts/web/src/components/setup-checklist.tsx`. No hook, backend, or layout changes.

### State

Add `showCloseConfirm` alongside the existing `showConfirmDialog` (which is for the "Load Sample Data" confirmation). No collision.

### Handlers

- `handleDismiss` (existing) — now only opens the close confirm dialog
- `handleConfirmClose` (new) — closes the dialog and runs the existing dismiss flow
- Footer button — keeps `onClick={handleDismiss}` (now triggers the dialog, same as X)

### Dialog instance

Render after the existing "Load Sample Data" `ConfirmDialog`. Reuses the existing `ConfirmDialog` primitive (no changes to it). `variant="default"` keeps the visual tone neutral — this is a confirmation, not a destructive action.

## Testing

**File:** `artifacts/web/src/components/setup-checklist.test.tsx`

### New tests

1. Clicking X opens the confirmation dialog (assert `screen.getByText("Close setup checklist?")` is present)
2. Clicking "Keep open" closes the dialog and does NOT call the PATCH
3. Clicking "Close checklist" in the dialog calls PATCH with `action: "dismiss"`
4. Footer button label is "Skip Onboarding" and clicking it dismisses without opening a dialog

### Updated tests

- The existing test `plays exit animation then unmounts when user dismisses` was written when X dismissed immediately. Update to click through the dialog before asserting the dismiss.
- The existing test `clears stale localStorage minimize entry when unmounted` is unaffected.

### Unchanged

- `artifacts/web/src/components/setup-checklist-existing-account.test.tsx` — asserts card hidden when allComplete, no dismiss flow tested
- `artifacts/web/src/hooks/use-setup-checklist.test.tsx` — no hook changes

## Out of scope

- Settings panel "Reopen setup checklist" button (future work, uses the existing `show()` hook action)
- i18n keys — component is currently English-only, consistent with the rest of the file
- Confirmation on the "Skip Onboarding" footer button (per user instruction — footer stays direct)
- Undo toast after dismiss (the confirmation is the friction; no extra undo needed)

## Files touched

- `artifacts/web/src/components/setup-checklist.tsx` — add state, refactor handler, add dialog, rename button
- `artifacts/web/src/components/setup-checklist.test.tsx` — add 4 tests, update 1 existing
- `context/progress-tracker.md` — log the change
