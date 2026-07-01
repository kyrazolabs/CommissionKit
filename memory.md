# Memory — Project Setup & OS Bootstrapping

Last updated: 2026-07-01

## What was built

- **`context/`** — 9 documentation files derived from codebase analysis (project-overview, architecture, ui-tokens, ui-rules, ui-registry, code-standards, library-docs, build-plan, progress-tracker)
- **`.opencode/skills/`** — 5 JSM skills installed from `JavaScript-Mastery-Pro/skills` (architect, imprint, recover, remember, review) in proper `SKILL.md` format
- **`opencode.json`** — project config with skills paths, instruction files (context/* + AGENTS.md + os/*)
- **`os/`** — CommissionKit OS folder with merged content:
  - `content-system/` (3 files), `sales-system/` (3 files), `sops/` (8 files), `contracts/` (1 file), `dashboard/` (3 files) from kyrazo-os archive
  - `crm/` moved from root (AGENTS.md, PLATFORM.md, SALES-PLAYBOOK.md)
  - `gtm/`, `skills/` — empty skeletons for future use
  - `README.md`, `AGENTS.md` — OS navigation
- **`AGENTS.md`** — updated with context-order, immutable-rules, and available-skills sections at top

## Decisions made

- OS folder named `os/` at project root, not `kyrazo-os/`
- Business skills folder is `os/skills/` (separate from `.opencode/skills/` for agent skills)
- crm/ moved under os/crm/ to consolidate all business docs
- opencode.json skills.paths uses `.opencode/skills` (project-relative)
- AGENTS.md uses `<!-- BEGIN/END -->` guards for safe future edits

## Problems solved

- WeTransfer download requires JS browser — resolved by user providing MediaFire direct link
- Empty file edit error — resolved by using write tool for empty files instead of edit
- Corrupted AGENTS.md after bad edit — recovered via git checkout and re-applied changes

## Current state

- All context docs, skills, OS files, and config files are in place
- opencode.json is valid JSON and configured correctly
- No .git sub-repos created anywhere
- All files are tracked in the working directory but not yet committed

## Next session starts with

Restart opencode to load the new config and skills. After restart, verify `/architect`, `/review`, `/recover`, `/remember`, and `/imprint` skills are all available.

## Open questions

- gtm/ folder in os/ is empty — needs GTM strategy docs (ICP, positioning, pricing)
- os/skills/ is empty — needs business skill files if the user wants them
