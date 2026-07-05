# Memory — OS Interconnection Cleanup

Last updated: 2026-07-04

## What was built

- **AGENTS.md** completely rewritten as the single entry point linking `context/` (technical) and `os/` (business) documentation trees
- Cross-reference footers added to all 9 `context/*.md` files
- Cross-reference footers added to all 17 `os/**/*.md` files
- 7 new business skills created in `os/skills/`:
  - `research.md`, `content-seo.md`, `sales-outreach.md`
  - `social-engage.md`, `data-report.md`, `deploy-verify.md`, `design-ux.md`
- All stale references to deleted folders (`.agents/`, `os/content-system/`, `os/sales-system/`, etc.) scrubbed from all markdown files
- `/remember` skill updated: path changed from `.opencode/memory.md` to `memory.md` (project root)

## Decisions made

- `AGENTS.md` is the single source of truth. Every doc must link back to it and to the next doc in its reading order.
- Technical context lives in `context/` — 9 files read sequentially before coding.
- Business OS lives in `os/` — 8 departments covering all company operations.
- Skills have two homes: `.opencode/skills/` (technical, 5 skills) and `os/skills/` (business, 7 skills).
- `.opencode/memory.md` was deleted in favor of `memory.md` at project root to match the remember skill spec.

## Problems solved

- `context/progress-tracker.md` was referencing deleted files (`.agents/DESIGN.md`, `.agents/PLATFORM.md`, `os/system-of-work.opml`) — all cleaned.
- `os/README.md` claimed OS was "built from zero" but all 8 departments now have content — updated status.
- `os/skills/` directory was referenced in `AGENTS.md` but didn't exist — created with 7 business skills.

## Current state

- All 33 markdown files (9 context + 17 os + 7 skills + AGENTS.md) have working cross-references
- Zero orphaned references to deleted content confirmed via grep
- `/remember` skill now points to project-root `memory.md`

## Next session starts with

Nothing queued. Last session was cleanup/foundation work. Next session should:
- Review if any of the remaining gaps in `context/progress-tracker.md` need action (web component tests, E2E tests, CI/CD, payout providers)
- Or pick up any product feature work per `os/03-product/product-system.md` roadmap

## Open questions

- Should `CHANGELOG.md` get cross-reference footers too, or is it append-only by convention?
- Should `os/skills/` files be registered in `opencode.jsonc` skills.paths, or kept as plain reference docs?
